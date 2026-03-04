"""
AnjaarFinance SQL Server Data Converter v4.0
Fully maps all fields from your SQL query to app JSON format.
"""

import json
from datetime import datetime, date
import traceback

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    print("Install pyodbc using: py -m pip install pyodbc")


# ==============================
# Utility Functions
# ==============================

def safe_float(value, default=0.0):
    try:
        return float(value) if value is not None else default
    except:
        return default

def safe_int(value, default=0):
    try:
        return int(value) if value is not None else default
    except:
        return default

def safe_str(value, default=""):
    if value is None:
        return default
    return str(value).strip()

def format_date(value):
    if not value:
        return ""
    try:
        if isinstance(value, (datetime, date)):
            return value.strftime("%d-%b-%Y")
        value_str = str(value)
        if len(value_str) == 8 and value_str.isdigit():
            return datetime.strptime(value_str, "%Y%m%d").strftime("%d-%b-%Y")
        if "-" in value_str:
            return datetime.strptime(value_str[:10], "%Y-%m-%d").strftime("%d-%b-%Y")
        return ""
    except:
        return ""

def build_address(r, prefix=""):
    """Combine address fields into one readable string."""
    parts = [
        safe_str(r.get(f"{prefix}Address1")),
        safe_str(r.get(f"{prefix}Address2")),
        safe_str(r.get(f"{prefix}Address3")),
        safe_str(r.get(f"{prefix}Address4")),
        safe_str(r.get(f"{prefix}Address5")),
    ]
    return ", ".join(p for p in parts if p)


# ==============================
# Database Connection
# ==============================

def connect_to_database(config):
    try:
        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={config['server']};"
            f"DATABASE={config['database']};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
        )
        return pyodbc.connect(conn_str)
    except Exception as e:
        print("Connection Error:", e)
        return None

def execute_query(conn, query):
    cursor = conn.cursor()
    cursor.execute(query)
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


# ==============================
# Main Builder
# ==============================

def build_contract_data(conn):

    print("Fetching contracts...")

    # ── MAIN QUERY (exactly your SQL with all 7 tables) ──
    contracts = execute_query(conn, """
        SELECT
            a.CoCode, a.FlCode, a.FnCode, a.FnName, a.FnRefNo,
            a.FnRegistration, a.FnGr1Code, a.FnArtCode, a.FnChassis,
            a.FnEngine, a.FnModel, a.FnColour, a.FnAgSeized,
            a.FnAgDate,

            b.CoName, b.CoAlias,

            c.Title,   c.Father,
            c.Address1, c.Address2, c.Address3, c.Address4, c.Address5,
            c.Mobile,

            d.Title    AS GTitle,   d.Father   AS GFather,
            d.Address1 AS GAddress1, d.Address2 AS GAddress2,
            d.Address3 AS GAddress3, d.Address4 AS GAddress4,
            d.Address5 AS GAddress5, d.Mobile   AS GMobile,

            e.AtName,

            f.FnAmt08  AS LoanAmount,
            f.FnFinRate,
            f.FnPayable,
            f.FnAgAmt  AS TotalAmount,

            g.FnAgAmtPaid,
            g.FnAgAmtDue

        FROM FnAgreement a
        LEFT JOIN GnCompanyM   b ON a.CoCode    = b.CoCode
        LEFT JOIN GnCusFolio   c ON a.FlCode     = c.Code
        LEFT JOIN GnCusFolio   d ON a.FnGr1Code  = d.Code
        LEFT JOIN GnArticle    e ON a.FnArtCode  = e.AtCode
        LEFT JOIN FnAgAmount   f ON a.FnCode     = f.FnCode
        LEFT JOIN FnAgDues     g ON a.FnCode     = g.FnCode

        WHERE a.FnSettled = 2
        ORDER BY a.FnCode
    """)

    print(f"  Found {len(contracts)} contracts")

    # ── PAYMENT SCHEDULE ──
    print("Fetching payment schedule...")
    installments = execute_query(conn, """
        SELECT * FROM FnAgInstalments
        ORDER BY FnCode, SerialNo
    """)
    print(f"  Found {len(installments)} instalments")

    # Group instalments by FnCode
    inst_dict = {}
    for i in installments:
        inst_dict.setdefault(i["FnCode"], []).append(i)

    # ==============================
    # Build Each Contract
    # ==============================

    contracts_data = []

    for c in contracts:

        fn_code      = c["FnCode"]
        outstanding  = safe_float(c.get("FnAgAmtDue"))
        seized       = safe_int(c.get("FnAgSeized"))

        # Status Logic
        if seized == 1:
            status = "Seized"
        elif outstanding <= 0:
            status = "Closed"
        else:
            status = "Live"

        # ── Payment Schedule ──
        payment_schedule = []
        for inst in inst_dict.get(fn_code, []):
            payment_schedule.append({
                "sno":               safe_int(inst.get("SerialNo")),
                "emi_amount":        safe_float(inst.get("DueAmount")),
                "due_date":          format_date(inst.get("DueDate")),
                "payment_received":  safe_float(inst.get("DueAmountRcvd")),
                "date_received":     format_date(inst.get("DueRcvdOn")),
                "delay_days":        safe_int(inst.get("DiffDays")),
            })

        # ── Customer Name (Title + Name) ──
        customer_title = safe_str(c.get("Title"))
        customer_name  = safe_str(c.get("FnName"))
        full_name      = f"{customer_title} {customer_name}".strip() if customer_title else customer_name

        # ── Guarantor Name ──
        g_title = safe_str(c.get("GTitle"))
        g_name  = safe_str(c.get("GFather"))   # using Father as name from d table
        g_full  = f"{g_title} {g_name}".strip() if g_title else g_name

        # ── EMI Amount ──
        emi = safe_float(c.get("FnPayable"))   # FnPayable = monthly EMI
        if emi == 0 and payment_schedule:
            emi = payment_schedule[0]["emi_amount"]

        # ── Build Contract Object ──
        contract_obj = {
            "_id":             str(fn_code),
            "contract_number": safe_str(c.get("FnRefNo")) or str(fn_code),
            "contract_date":   format_date(c.get("FnAgDate")),
            "status":          status,
            "customer_name":   full_name or safe_str(c.get("FnName")),
            "vehicle_number":  safe_str(c.get("FnRegistration")),
            "file_number":     safe_str(c.get("FnRefNo")),
            "company_name":    safe_str(c.get("CoName")),
            "company_alias":   safe_str(c.get("CoAlias")),
            "article_name":    safe_str(c.get("AtName")),   # vehicle type/article

            # ── Customer ──
            "customer": {
                "name":    full_name or safe_str(c.get("FnName")),
                "father":  safe_str(c.get("Father")),
                "phone":   safe_str(c.get("Mobile")),
                "address": build_address(c, ""),            # Address1-5
                "photo":   None
            },

            # ── Guarantor ──
            "guarantor": {
                "name":     g_full,
                "father":   safe_str(c.get("GFather")),
                "phone":    safe_str(c.get("GMobile")),
                "address":  build_address(c, "G"),          # GAddress1-5
                "relation": "Guarantor",
                "photo":    None
            },

            # ── Vehicle ──
            "vehicle": {
                "make":                safe_str(c.get("AtName")),
                "model":               safe_str(c.get("FnModel")),
                "year":                0,
                "registration_number": safe_str(c.get("FnRegistration")),
                "chassis_number":      safe_str(c.get("FnChassis")),
                "engine_number":       safe_str(c.get("FnEngine")),
                "color":               safe_str(c.get("FnColour")),
            },

            # ── Loan ──
            "loan": {
                "loan_amount":        safe_float(c.get("LoanAmount")),    # FnAmt08
                "interest_rate":      safe_float(c.get("FnFinRate")),
                "tenure_months":      len(payment_schedule),
                "emi_amount":         emi,                                 # FnPayable
                "total_amount":       safe_float(c.get("TotalAmount")),   # FnAgAmt
                "amount_paid":        safe_float(c.get("FnAgAmtPaid")),
                "outstanding_amount": outstanding,                         # FnAgAmtDue
            },

            "payment_schedule": payment_schedule,
            "ledger":           [],
            "followup":         []
        }

        contracts_data.append(contract_obj)

    return contracts_data


# ==============================
# Save Output
# ==============================

def save_output(data, filename="app_data.json"):
    wrapped = {"contracts": data}
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(wrapped, f, indent=2, ensure_ascii=False)
    print(f"\nSaved: {filename}")
    print(f"Total Contracts: {len(data)}")


# ==============================
# MAIN
# ==============================

def main():

    if not PYODBC_AVAILABLE:
        print("pyodbc not installed. Run: py -m pip install pyodbc")
        return

    config = {
        "server":   "DESKTOP-GL59K6T\\SQLEXPRESS",
        "database": "AnjaarFinance"
    }

    print("Connecting to SQL Server...")
    conn = connect_to_database(config)

    if not conn:
        print("Could not connect to database.")
        input("Press Enter to exit...")
        return

    print("Connected!\n")

    try:
        data = build_contract_data(conn)
        save_output(data)

    except Exception as e:
        print("\nError:", e)
        traceback.print_exc()

    finally:
        conn.close()

    print("\n====================================")
    print("  Process Completed Successfully.")
    print("====================================")
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    main()
