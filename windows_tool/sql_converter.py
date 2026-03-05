"""
AnjaarFinance SQL Server Data Converter v5.0
Complete rewrite with Ledger, CollFollow, Photos support
"""

import json
from datetime import datetime, date
import traceback

try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    print("Install pyodbc: py -m pip install pyodbc")


# ══════════════════════════════════════
# UTILITY FUNCTIONS
# ══════════════════════════════════════

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
    """Convert SQL date → DD-MMM-YYYY (e.g. 21-Feb-2008)"""
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

def build_address(row, prefix=""):
    """Combine Address1-5 into one string"""
    parts = [
        safe_str(row.get(f"{prefix}Address1")),
        safe_str(row.get(f"{prefix}Address2")),
        safe_str(row.get(f"{prefix}Address3")),
        safe_str(row.get(f"{prefix}Address4")),
        safe_str(row.get(f"{prefix}Address5")),
    ]
    return ", ".join(p for p in parts if p)


# ══════════════════════════════════════
# DATABASE CONNECTION
# ══════════════════════════════════════

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


# ══════════════════════════════════════
# MAIN DATA BUILDER
# ══════════════════════════════════════

def build_contract_data(conn):

    # ── 1. MAIN CONTRACT QUERY (all 7 tables) ──
    print("  Fetching contracts...")
    contracts = execute_query(conn, """
        SELECT
            a.CoCode, a.FlCode, a.FnCode, a.FnName, a.FnRefNo,
            a.FnRegistration, a.FnGr1Code, a.FnArtCode, a.FnChassis,
            a.FnEngine, a.FnModel, a.FnColour, a.FnAgSeized, a.FnSettled,
            a.FnAgDate,

            b.CoName, b.CoAlias,

            c.Title,   c.Father,
            c.Address1, c.Address2, c.Address3, c.Address4, c.Address5,
            c.Mobile, c.Mobile2, c.Mobile3,

            d.Title    AS GTitle,   d.Father   AS GFather,
            d.Address1 AS GAddress1, d.Address2 AS GAddress2,
            d.Address3 AS GAddress3, d.Address4 AS GAddress4,
            d.Address5 AS GAddress5, d.Mobile  AS GMobile,
            d.Mobile2  AS GMobile2,  d.Mobile3  AS GMobile3,

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

        WHERE a.FnSettled IN (1, 2)   -- 1=Closed, 2=Unsettled(Live/Seized)
        ORDER BY a.FnCode
    """)
    print(f"    → {len(contracts)} contracts found")

    # ── 2. PAYMENT SCHEDULE ──
    print("  Fetching payment schedule...")
    installments = execute_query(conn, """
        SELECT * FROM FnAgInstalments
        ORDER BY FnCode, SerialNo
    """)
    print(f"    → {len(installments)} instalments found")

    # ── 3. LEDGER ──
    print("  Fetching ledger entries...")
    ledger_rows = execute_query(conn, """
        SELECT
            FnCode,
            VoucherDt,
            VoucherType,
            VoucherNo,
            VoucherAmnt,
            DrCrFlag,
            Narration1,
            OverDue
        FROM FnAgLedgers
        WHERE DeleteFlag = 2
          AND PostFlag IN (1, 2, 4)
        ORDER BY VoucherDt, VoucherType, VoucherNo
    """)
    print(f"    → {len(ledger_rows)} ledger entries found")

    # ── 4. COLLECTION FOLLOWUP ──
    print("  Fetching collection followup...")
    followup_rows = execute_query(conn, """
        SELECT
            FnCode,
            FnSerials,
            RunDate,
            ContDate,
            Remark01, Remark02, Remark03, Remark04, Remark05,
            Remark06, Remark07, Remark08, Remark09, Remark10
        FROM FnAgCollFollow
        ORDER BY FnCode, FnSerials
    """)
    print(f"    → {len(followup_rows)} followup entries found")

    # ── GROUP BY FnCode ──
    inst_dict     = {}
    ledger_dict   = {}
    followup_dict = {}

    for i in installments:
        inst_dict.setdefault(i["FnCode"], []).append(i)

    for l in ledger_rows:
        ledger_dict.setdefault(l["FnCode"], []).append(l)

    for f in followup_rows:
        followup_dict.setdefault(f["FnCode"], []).append(f)

    # ══════════════════════════════════════
    # BUILD EACH CONTRACT
    # ══════════════════════════════════════

    contracts_data = []

    for c in contracts:
        fn_code    = c["FnCode"]
        fl_code    = safe_str(c.get("FlCode"))
        outstanding = safe_float(c.get("FnAgAmtDue"))
        seized      = safe_int(c.get("FnAgSeized"))
        fn_settled  = safe_int(c.get("FnSettled"))

        # ── Status: FnSettled=1 = Closed, FnAgSeized=1 = Seized, else Live ──
        if fn_settled == 1:
            status = "Closed"
        elif seized == 1:
            status = "Seized"
        else:
            status = "Live"

        # ── Photo: A{FlCode}.jpg for both borrower and guarantor ──
        photo_filename = f"A{fl_code}.jpg" if fl_code else None

        # ── Payment Schedule ──
        payment_schedule = []
        for inst in inst_dict.get(fn_code, []):
            payment_schedule.append({
                "sno":              safe_int(inst.get("SerialNo")),
                "emi_amount":       safe_float(inst.get("DueAmount")),
                "due_date":         format_date(inst.get("DueDate")),
                "payment_received": safe_float(inst.get("DueAmountRcvd")),
                "date_received":    format_date(inst.get("DueRcvdOn")),
                "delay_days":       safe_int(inst.get("DiffDays")),
            })

        # ── Ledger ──
        ledger = []
        for l in ledger_dict.get(fn_code, []):
            # DrCrFlag: D = Debit, C = Credit
            dr_cr   = safe_str(l.get("DrCrFlag")).upper()
            amount  = safe_float(l.get("VoucherAmnt"))
            debit   = amount if dr_cr == "D" else 0.0
            credit  = amount if dr_cr == "C" else 0.0
            ledger.append({
                "voucher_date":    format_date(l.get("VoucherDt")),
                "voucher_type":    safe_str(l.get("VoucherType")),
                "voucher_no":      safe_str(l.get("VoucherNo")),
                "debit":           debit,
                "credit":          credit,
                "narration":       safe_str(l.get("Narration1")),
                "running_balance": safe_float(l.get("OverDue")),
            })

        # ── Collection Followup ──
        followup = []
        for f in followup_dict.get(fn_code, []):
            # Combine all remarks into one string
            remarks = " | ".join(
                safe_str(f.get(f"Remark{str(i).zfill(2)}"))
                for i in range(1, 11)
                if safe_str(f.get(f"Remark{str(i).zfill(2)}"))
            )
            followup.append({
                "serial":    safe_int(f.get("FnSerials")),
                "run_date":  format_date(f.get("RunDate")),
                "cont_date": format_date(f.get("ContDate")),
                "remarks":   remarks,
            })

        # ── Customer name ──
        customer_title = safe_str(c.get("Title"))
        customer_name  = safe_str(c.get("FnName"))
        full_name      = f"{customer_title} {customer_name}".strip() if customer_title else customer_name

        # ── Guarantor name ──
        g_title = safe_str(c.get("GTitle"))
        g_name  = safe_str(c.get("GFather"))
        g_full  = f"{g_title} {g_name}".strip() if g_title else g_name

        # ── EMI amount ──
        emi = safe_float(c.get("FnPayable"))
        if emi == 0 and payment_schedule:
            emi = payment_schedule[0]["emi_amount"]

        # ── Build contract object ──
        contract_obj = {
            "_id":             str(fn_code),
            "contract_number": safe_str(c.get("FnRefNo")) or str(fn_code),
            "contract_date":   format_date(c.get("FnAgDate")),
            "status":          status,
            "customer_name":   full_name or customer_name,
            "vehicle_number":  safe_str(c.get("FnRegistration")),
            "file_number":     safe_str(c.get("FnRefNo")),
            "fl_code":         fl_code,
            "company_name":    safe_str(c.get("CoName")),
            "company_alias":   safe_str(c.get("CoAlias")),
            "article_name":    safe_str(c.get("AtName")),

            # Photo filename — A{FlCode}.jpg (same for borrower & guarantor)
            "photo":           photo_filename,

            "customer": {
                "name":    full_name or customer_name,
                "father":  safe_str(c.get("Father")),
                "phone":   safe_str(c.get("Mobile")),
                "phone2":  safe_str(c.get("Mobile2")),
                "phone3":  safe_str(c.get("Mobile3")),
                "address": build_address(c, ""),
                "photo":   photo_filename,
            },

            "guarantor": {
                "name":     g_full,
                "father":   safe_str(c.get("GFather")),
                "phone":    safe_str(c.get("GMobile")),
                "phone2":   safe_str(c.get("GMobile2")),
                "phone3":   safe_str(c.get("GMobile3")),
                "address":  build_address(c, "G"),
                "relation": "Guarantor",
                "photo":    photo_filename,
            },

            "vehicle": {
                "make":                safe_str(c.get("AtName")),
                "model":               safe_str(c.get("FnModel")),
                "year":                0,
                "registration_number": safe_str(c.get("FnRegistration")),
                "chassis_number":      safe_str(c.get("FnChassis")),
                "engine_number":       safe_str(c.get("FnEngine")),
                "color":               safe_str(c.get("FnColour")),
            },

            "loan": {
                "loan_amount":        safe_float(c.get("LoanAmount")),
                "interest_rate":      safe_float(c.get("FnFinRate")),
                "tenure_months":      len(payment_schedule),
                "emi_amount":         emi,
                "total_amount":       safe_float(c.get("TotalAmount")),
                "amount_paid":        safe_float(c.get("FnAgAmtPaid")),
                "outstanding_amount": outstanding,
            },

            "payment_schedule": payment_schedule,
            "ledger":           ledger,
            "followup":         followup,
        }

        contracts_data.append(contract_obj)

    return contracts_data


# ══════════════════════════════════════
# SAVE OUTPUT
# ══════════════════════════════════════

def save_output(data, filename="app_data.json"):
    wrapped = {"contracts": data}
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(wrapped, f, indent=2, ensure_ascii=False)
    print(f"\n  Saved: {filename}")
    print(f"  Total Contracts: {len(data)}")


# ══════════════════════════════════════
# MAIN
# ══════════════════════════════════════

def main():
    if not PYODBC_AVAILABLE:
        print("pyodbc not installed. Run: py -m pip install pyodbc")
        input("Press Enter to exit...")
        return

    config = {
        "server":   "DESKTOP-GL59K6T\\SQLEXPRESS",
        "database": "AnjaarFinance"
    }

    print("\n====================================")
    print("  AnjaarFinance Data Converter v5.0")
    print("====================================\n")

    print("Connecting to SQL Server...")
    conn = connect_to_database(config)
    if not conn:
        print("Could not connect to database.")
        input("Press Enter to exit...")
        return
    print("Connected!\n")

    try:
        print("Fetching data...")
        data = build_contract_data(conn)
        print("\nSaving output...")
        save_output(data)

    except Exception as e:
        print("\nError:", e)
        traceback.print_exc()
    finally:
        conn.close()

    print("\n====================================")
    print("  Completed Successfully!")
    print("====================================")
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    main()
