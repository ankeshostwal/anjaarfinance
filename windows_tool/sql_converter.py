"""
AnjaarFinance SQL Server Data Converter v2.0
=============================================
This tool reads data from your SQL Server database and converts it
to a JSON file that can be loaded by the AnjaarFinance mobile app.

Features:
- Extracts contracts with customer, guarantor, vehicle details
- Extracts EMI payment schedule
- Extracts Finance Ledger transactions
- Extracts Collection Follow-up history
- Supports photo paths for customer and guarantor

Output: Place app_data.json in your phone's Downloads/AnjaarFinance folder

Author: AnjaarFinance Team
Version: 2.0
"""

import json
import os
import sys
from datetime import datetime, date
from decimal import Decimal
import traceback
import shutil

# Try to import pyodbc for SQL Server connection
try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    print("WARNING: pyodbc not installed. Install it with: pip install pyodbc")


def print_header():
    """Print application header"""
    print("\n" + "="*60)
    print("   ANJAARFINANCE - SQL Server Data Converter v2.0")
    print("   Database: AnjaarFinance")
    print("="*60 + "\n")

def print_success(msg):
    print(f"[OK] {msg}")

def print_error(msg):
    print(f"[ERROR] {msg}")

def print_info(msg):
    print(f"[INFO] {msg}")

def print_warning(msg):
    print(f"[WARN] {msg}")

def load_config(config_path="config.json"):
    """Load configuration from JSON file"""
    if not os.path.exists(config_path):
        print_error(f"Config file not found: {config_path}")
        return None
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print_success(f"Loaded configuration from {config_path}")
        return config
    except Exception as e:
        print_error(f"Error loading config: {e}")
        return None

def connect_to_database(db_config):

    try:
        server = db_config['server']
        database = db_config['database']

        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            f"SERVER={server};"
            f"DATABASE={database};"
            "Trusted_Connection=yes;"
            "TrustServerCertificate=yes;"
            "Encrypt=no;"
        )

        print_info(f"Connecting to {server}/{database} using ODBC Driver 17")

        conn = pyodbc.connect(conn_str, timeout=10)

        print_success("Connected successfully!")
        return conn

    except Exception as e:
        print_error(f"Connection failed: {e}")
        return None

def json_serializer(obj):
    """Custom JSON serializer"""
    if isinstance(obj, (datetime, date)):
        return obj.strftime('%Y-%m-%d')
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def format_date(value):
    """Format date to string"""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.strftime('%Y-%m-%d')
    return str(value)

def safe_float(value, default=0):
    if value is None:
        return default
    try:
        return float(value)
    except:
        return default

def safe_int(value, default=0):
    if value is None:
        return default
    try:
        return int(value)
    except:
        return default

def safe_str(value, default=''):
    if value is None:
        return default
    return str(value).strip()

def combine_address(*parts):
    """Combine address parts"""
    addr_parts = [safe_str(p) for p in parts if p and safe_str(p)]
    return ', '.join(addr_parts)

def execute_query(conn, query, params=None):
    """Execute a query and return results as list of dicts"""
    try:
        cursor = conn.cursor()
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        columns = [col[0] for col in cursor.description]
        results = []
        for row in cursor.fetchall():
            results.append(dict(zip(columns, row)))
        return results
    except pyodbc.Error as e:
        print_warning(f"Query error: {e}")
        return []

def find_followup_table(conn):
    """Try to find the followup table name"""
    possible_names = [
        'FnAgFollowup', 'FnFollowup', 'FnFollowUp', 
        'FollowUp', 'Followup', 'FnAgFollowUp',
        'CollectionFollowup', 'FnCollection'
    ]
    
    for table_name in possible_names:
        try:
            cursor = conn.cursor()
            cursor.execute(f"SELECT TOP 1 * FROM {table_name}")
            print_success(f"Found follow-up table: {table_name}")
            return table_name
        except:
            continue
    
    # Try to find any table with 'follow' in name
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE' 
            AND (TABLE_NAME LIKE '%follow%' OR TABLE_NAME LIKE '%Follow%')
        """)
        for row in cursor.fetchall():
            print_success(f"Found follow-up table: {row[0]}")
            return row[0]
    except:
        pass
    
    print_warning("Follow-up table not found")
    return None

def find_ledger_table(conn):
    """Try to find the ledger table name"""
    possible_names = [
        'FnAgLedgers', 'FnAgLedger', 'FnLedger', 
        'AgLedger', 'FinanceLedger'
    ]
    
    for table_name in possible_names:
        try:
            cursor = conn.cursor()
            cursor.execute(f"SELECT TOP 1 * FROM {table_name}")
            print_success(f"Found ledger table: {table_name}")
            return table_name
        except:
            continue
    
    print_warning("Ledger table not found")
    return None

def get_table_columns(conn, table_name):
    """Get column names for a table"""
    try:
        cursor = conn.cursor()
        cursor.execute(f"SELECT TOP 1 * FROM {table_name}")
        return [col[0] for col in cursor.description]
    except:
        return []

def build_contract_data(conn, config):
    """Build complete contract data"""
    contracts_data = []
    queries = config.get('queries', {})
    
    # Fetch contracts
    print_info("Fetching contracts...")
    contracts_query = queries.get('contracts', '')
    if not contracts_query:
        # Default query
        contracts_query = """
            SELECT a.CoCode, a.FlCode, a.FnCode, a.FnName, a.FnRefNo, 
                   a.FnRegistration, a.FnGr1Code, a.FnArtCode, a.FnChassis, 
                   a.FnEngine, a.FnModel, a.FnColour, a.FnAgSeized, a.FnAgDate,
                   ISNULL(b.CoName, '') AS CoName, ISNULL(b.CoAlias, '') AS CoAlias 
            FROM FnAgreement a 
            LEFT JOIN GnCompanyM b ON a.CoCode = b.CoCode 
            WHERE a.FnSettled = 2 
            ORDER BY a.FnCode
        """
    
    contracts = execute_query(conn, contracts_query)
    print_success(f"Found {len(contracts)} contracts")
    
    # Fetch all customers
    print_info("Fetching customers...")
    customers = execute_query(conn, """
        SELECT Code, ISNULL(Title, '') AS Title, ISNULL(Father, '') AS Father,
               ISNULL(Address1, '') AS Address1, ISNULL(Address2, '') AS Address2,
               ISNULL(Address3, '') AS Address3, ISNULL(Address4, '') AS Address4,
               ISNULL(Address5, '') AS Address5, ISNULL(Mobile, '') AS Mobile,
               ISNULL(Photo, '') AS Photo
        FROM GnCusFolio
    """)
    customers_dict = {c['Code']: c for c in customers}
    print_success(f"Found {len(customers)} customer records")
    
    # Fetch all vehicles/articles
    print_info("Fetching vehicles...")
    vehicles = execute_query(conn, """
        SELECT AtCode, ISNULL(AtName, '') AS AtName, ISNULL(AtMake, '') AS AtMake
        FROM GnArticle
    """)
    vehicles_dict = {v['AtCode']: v for v in vehicles}
    print_success(f"Found {len(vehicles)} vehicle types")
    
    # Fetch loan amounts
    print_info("Fetching loan amounts...")
    loan_amounts = execute_query(conn, """
        SELECT FnCode, ISNULL(FnAmt08, 0) AS LoanAmount, 
               ISNULL(FnFinRate, 0) AS FnFinRate,
               ISNULL(FnPayable, 0) AS FnPayable, 
               ISNULL(FnAgAmt, 0) AS TotalAmount
        FROM FnAgAmount
    """)
    loans_dict = {l['FnCode']: l for l in loan_amounts}
    print_success(f"Found {len(loan_amounts)} loan records")
    
    # Fetch dues
    print_info("Fetching dues...")
    dues = execute_query(conn, """
        SELECT FnCode, ISNULL(FnAgAmtPaid, 0) AS FnAgAmtPaid, 
               ISNULL(FnAgAmtDue, 0) AS FnAgAmtDue
        FROM FnAgDues
    """)
    dues_dict = {d['FnCode']: d for d in dues}
    print_success(f"Found {len(dues)} due records")
    
    # Fetch all installments
    print_info("Fetching installments...")
    installments = execute_query(conn, """
        SELECT FnCode, SerialNo, DueDate, ISNULL(DueAmount, 0) AS DueAmount,
               DueRcvdOn, ISNULL(DueAmountRcvd, 0) AS DueAmountRcvd,
               ISNULL(DiffDays, 0) AS DiffDays
        FROM FnAgInstalments
        ORDER BY FnCode, SerialNo
    """)
    # Group by FnCode
    installments_dict = {}
    for inst in installments:
        fn_code = inst['FnCode']
        if fn_code not in installments_dict:
            installments_dict[fn_code] = []
        installments_dict[fn_code].append(inst)
    print_success(f"Found {len(installments)} installment records")
    
    # Find and fetch ledger data
    print_info("Fetching ledger transactions...")
    ledger_table = find_ledger_table(conn)
    ledger_dict = {}
    if ledger_table:
        columns = get_table_columns(conn, ledger_table)
        print_info(f"Ledger columns: {columns}")
        ledgers = execute_query(conn, f"SELECT * FROM {ledger_table} ORDER BY FnCode")
        for led in ledgers:
            fn_code = led.get('FnCode')
            if fn_code not in ledger_dict:
                ledger_dict[fn_code] = []
            ledger_dict[fn_code].append(led)
        print_success(f"Found {len(ledgers)} ledger entries")
    
    # Find and fetch followup data
    print_info("Fetching follow-up records...")
    followup_table = find_followup_table(conn)
    followup_dict = {}
    if followup_table:
        columns = get_table_columns(conn, followup_table)
        print_info(f"Followup columns: {columns}")
        followups = execute_query(conn, f"SELECT * FROM {followup_table} ORDER BY FnCode")
        for fu in followups:
            fn_code = fu.get('FnCode')
            if fn_code not in followup_dict:
                followup_dict[fn_code] = []
            followup_dict[fn_code].append(fu)
        print_success(f"Found {len(followups)} follow-up records")
    
    # Build contract objects
    print_info("Building contract data...")
    for idx, contract in enumerate(contracts):
        fn_code = contract.get('FnCode')
        fl_code = contract.get('FlCode')  # Customer code
        gr_code = contract.get('FnGr1Code')  # Guarantor code
        art_code = contract.get('FnArtCode')  # Article/Vehicle code
        
        # Get related data
        customer = customers_dict.get(fl_code, {})
        guarantor = customers_dict.get(gr_code, {})
        vehicle = vehicles_dict.get(art_code, {})
        loan = loans_dict.get(fn_code, {})
        due = dues_dict.get(fn_code, {})
        contract_installments = installments_dict.get(fn_code, [])
        contract_ledger = ledger_dict.get(fn_code, [])
        contract_followup = followup_dict.get(fn_code, [])
        
        # Determine status
        seized = contract.get('FnAgSeized', 0)
        status = 'Seized' if seized == 1 else 'Live'
        
        # Build addresses
        customer_address = combine_address(
            customer.get('Address1'), customer.get('Address2'),
            customer.get('Address3'), customer.get('Address4'),
            customer.get('Address5')
        )
        
        guarantor_address = combine_address(
            guarantor.get('Address1'), guarantor.get('Address2'),
            guarantor.get('Address3'), guarantor.get('Address4'),
            guarantor.get('Address5')
        )
        
        # Build names
        cust_title = safe_str(customer.get('Title'))
        cust_father = safe_str(customer.get('Father'))
        customer_name = f"{cust_title} {cust_father}".strip() if cust_title else cust_father
        if not customer_name:
            customer_name = safe_str(contract.get('FnName'))
        
        guar_title = safe_str(guarantor.get('Title'))
        guar_father = safe_str(guarantor.get('Father'))
        guarantor_name = f"{guar_title} {guar_father}".strip() if guar_title else guar_father
        
        # Calculate loan values
        loan_amount = safe_float(loan.get('LoanAmount'))
        total_amount = safe_float(loan.get('TotalAmount'))
        amount_paid = safe_float(due.get('FnAgAmtPaid'))
        outstanding = safe_float(due.get('FnAgAmtDue'))
        interest_rate = safe_float(loan.get('FnFinRate'))
        
        # EMI amount from installments
        emi_amount = 0
        if contract_installments:
            emi_amount = safe_float(contract_installments[0].get('DueAmount'))
        
        # Build payment schedule
        payment_schedule = []
        for inst in contract_installments:
            payment_schedule.append({
                'sno': safe_int(inst.get('SerialNo')),
                'emi_amount': safe_float(inst.get('DueAmount')),
                'due_date': format_date(inst.get('DueDate')),
                'payment_received': safe_float(inst.get('DueAmountRcvd')),
                'date_received': format_date(inst.get('DueRcvdOn')),
                'delay_days': safe_int(inst.get('DiffDays'))
            })
        
        # Build ledger entries
        ledger_entries = []
        for led in contract_ledger:
            ledger_entries.append({
                'date': format_date(led.get('LedDate') or led.get('Date') or led.get('TranDate')),
                'particulars': safe_str(led.get('LedParticulars') or led.get('Particulars') or led.get('Description')),
                'debit': safe_float(led.get('LedDebit') or led.get('Debit') or led.get('DrAmount')),
                'credit': safe_float(led.get('LedCredit') or led.get('Credit') or led.get('CrAmount')),
                'balance': safe_float(led.get('LedBalance') or led.get('Balance'))
            })
        
        # Build followup entries
        followup_entries = []
        for fu in contract_followup:
            followup_entries.append({
                'sno': safe_int(fu.get('SerialNo') or fu.get('SNo') or fu.get('SNO')),
                'contacted_on': format_date(fu.get('ContactedOn') or fu.get('ContactDate') or fu.get('Date')),
                'followup_date': format_date(fu.get('FollowUpDate') or fu.get('FollowupDate') or fu.get('NextDate')),
                'user': safe_str(fu.get('UserName') or fu.get('User') or fu.get('EnteredBy')),
                'reasons': safe_str(fu.get('ReasonsGiven') or fu.get('Reasons') or fu.get('Remarks'))
            })
        
        # Build contract object
        contract_obj = {
            "_id": str(fn_code),
            "contract_number": safe_str(contract.get('FnRefNo')) or str(fn_code),
            "contract_date": format_date(contract.get('FnAgDate')),
            "status": status,
            "customer_name": customer_name,
            "vehicle_number": safe_str(contract.get('FnRegistration')),
            "file_number": safe_str(contract.get('FnRefNo')),
            "company_name": safe_str(contract.get('CoName')) or safe_str(contract.get('CoAlias')),
            "customer": {
                "name": customer_name,
                "phone": safe_str(customer.get('Mobile')),
                "address": customer_address,
                "photo": safe_str(customer.get('Photo')) or None
            },
            "guarantor": {
                "name": guarantor_name,
                "phone": safe_str(guarantor.get('Mobile')),
                "address": guarantor_address,
                "relation": "Guarantor",
                "photo": safe_str(guarantor.get('Photo')) or None
            },
            "vehicle": {
                "make": safe_str(vehicle.get('AtMake')) or safe_str(vehicle.get('AtName')),
                "model": safe_str(contract.get('FnModel')),
                "year": 0,
                "registration_number": safe_str(contract.get('FnRegistration')),
                "chassis_number": safe_str(contract.get('FnChassis')),
                "engine_number": safe_str(contract.get('FnEngine')),
                "color": safe_str(contract.get('FnColour'))
            },
            "loan": {
                "loan_amount": loan_amount,
                "interest_rate": interest_rate,
                "tenure_months": len(contract_installments),
                "emi_amount": emi_amount,
                "total_amount": total_amount,
                "amount_paid": amount_paid,
                "outstanding_amount": outstanding
            },
            "payment_schedule": payment_schedule,
            "ledger": ledger_entries,
            "followup": followup_entries
        }
        
        contracts_data.append(contract_obj)
        
        if (idx + 1) % 100 == 0:
            print_info(f"Processed {idx + 1}/{len(contracts)} contracts...")
    
    print_success(f"Built {len(contracts_data)} complete contracts")
    return contracts_data

def save_output(data, output_path):
    """Save data to JSON file"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=json_serializer, ensure_ascii=False)
        print_success(f"Data saved to: {output_path}")
        return True
    except Exception as e:
        print_error(f"Error saving: {e}")
        return False

def generate_ts_file(data, output_path):
    """Generate TypeScript file"""
    try:
        ts_path = output_path.replace('.json', '.ts')
        ts_content = f"""// Auto-generated by AnjaarFinance SQL Converter v2.0
// Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// Total contracts: {len(data)}

export const MOCK_CONTRACTS = {json.dumps(data, indent=2, default=json_serializer, ensure_ascii=False)};

export const MOCK_CREDENTIALS = {{
  username: 'admin',
  password: 'admin123'
}};
"""
        with open(ts_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        print_success(f"TypeScript file saved to: {ts_path}")
        return True
    except Exception as e:
        print_error(f"Error generating TS: {e}")
        return False

def main():
    """Main function"""
    print_header()
    
    if not PYODBC_AVAILABLE:
        print_error("pyodbc not installed!")
        print_info("Install with: pip install pyodbc")
        input("\nPress Enter to exit...")
        return
    
    config = load_config()
    if not config:
        input("\nPress Enter to exit...")
        return
    
    conn = connect_to_database(config['database'])
    if not conn:
        input("\nPress Enter to exit...")
        return
    
    try:
        contracts_data = build_contract_data(conn, config)
        
        if not contracts_data:
            print_warning("No contracts found!")
            input("\nPress Enter to exit...")
            return
        
        output_config = config.get('output', {})
        output_path = output_config.get('file_path', 'app_data.json')
        
        print("\n" + "-"*40)
        save_output(contracts_data, output_path)
        generate_ts_file(contracts_data, output_path)
        
        # Statistics
        live = sum(1 for c in contracts_data if c['status'] == 'Live')
        seized = sum(1 for c in contracts_data if c['status'] == 'Seized')
        with_ledger = sum(1 for c in contracts_data if c['ledger'])
        with_followup = sum(1 for c in contracts_data if c['followup'])
        
        print("\n" + "="*60)
        print("SUCCESS! Export completed.")
        print("="*60)
        print(f"\nTotal contracts: {len(contracts_data)}")
        print(f"  - Live: {live}")
        print(f"  - Seized: {seized}")
        print(f"  - With ledger entries: {with_ledger}")
        print(f"  - With follow-up records: {with_followup}")
        print(f"\nFiles created:")
        print(f"  1. {output_path}")
        print(f"  2. {output_path.replace('.json', '.ts')}")
        print(f"\nNext steps:")
        print(f"  1. Copy {output_path} to phone's Downloads/AnjaarFinance folder")
        print(f"  2. Open app - it will load the latest data!")
        
    except Exception as e:
        print_error(f"Error: {e}")
        traceback.print_exc()
    finally:
        conn.close()
        print_info("Connection closed")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
