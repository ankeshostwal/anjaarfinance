"""
AnjaarFinance SQL Server Data Converter
=======================================
This tool reads data from your SQL Server database and converts it
to a JSON file that can be imported into the AnjaarFinance mobile app.

Customized for AnjaarFinance database structure:
- FnAgreement - Main contract details
- GnCompanyM - Company information  
- GnCusFolio - Customer & Guarantor details
- GnArticle - Vehicle/Article details
- FnAgAmount - Loan amounts
- FnAgDues - Payment dues
- FnAgInstalments - EMI/Payment schedule

Author: AnjaarFinance Team
"""

import json
import os
import sys
from datetime import datetime, date
from decimal import Decimal
import traceback

# Try to import pyodbc for SQL Server connection
try:
    import pyodbc
    PYODBC_AVAILABLE = True
except ImportError:
    PYODBC_AVAILABLE = False
    print("WARNING: pyodbc not installed. Install it with: pip install pyodbc")

# Console colors for Windows
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    """Print application header"""
    print("\n" + "="*60)
    print("       ANJAARFINANCE - SQL Server Data Converter")
    print("       Database: AnjaarFinance")
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
        print_info("Please create config.json with your database settings")
        return None
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        print_success(f"Loaded configuration from {config_path}")
        return config
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON in config file: {e}")
        return None
    except Exception as e:
        print_error(f"Error loading config: {e}")
        return None

def connect_to_database(db_config):
    """Connect to SQL Server database"""
    if not PYODBC_AVAILABLE:
        print_error("pyodbc is required for SQL Server connection")
        print_info("Install it with: pip install pyodbc")
        return None
    
    try:
        server = db_config.get('server', 'localhost')
        database = db_config.get('database', '')
        username = db_config.get('username', '')
        password = db_config.get('password', '')
        trusted_connection = db_config.get('trusted_connection', True)
        
        # Try different ODBC drivers
        drivers = [
            'ODBC Driver 17 for SQL Server',
            'ODBC Driver 18 for SQL Server',
            'SQL Server Native Client 11.0',
            'SQL Server'
        ]
        
        conn = None
        for driver in drivers:
            try:
                if trusted_connection:
                    connection_string = f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"
                else:
                    connection_string = f"DRIVER={{{driver}}};SERVER={server};DATABASE={database};UID={username};PWD={password};"
                
                print_info(f"Trying driver: {driver}")
                conn = pyodbc.connect(connection_string, timeout=10)
                print_success(f"Connected using: {driver}")
                break
            except pyodbc.Error:
                continue
        
        if conn:
            print_success(f"Connected to {server}/{database}")
            return conn
        else:
            print_error("Could not connect with any available driver")
            print_info("Please install ODBC Driver 17 for SQL Server from Microsoft")
            return None
    
    except pyodbc.Error as e:
        print_error(f"Database connection failed: {e}")
        print_info("Please check your connection settings in config.json")
        return None

def json_serializer(obj):
    """Custom JSON serializer for dates and decimals"""
    if isinstance(obj, (datetime, date)):
        return obj.strftime('%Y-%m-%d')
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def format_date(value):
    """Format date value to string"""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.strftime('%Y-%m-%d')
    return str(value)

def safe_float(value, default=0):
    """Safely convert to float"""
    if value is None:
        return default
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def safe_int(value, default=0):
    """Safely convert to int"""
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_str(value, default=''):
    """Safely convert to string"""
    if value is None:
        return default
    return str(value).strip()

def combine_address(*parts):
    """Combine address parts into single string"""
    address_parts = [safe_str(p) for p in parts if p and safe_str(p)]
    return ', '.join(address_parts)

def fetch_contracts(conn, config):
    """Fetch all contracts using the main query"""
    query_config = config.get('query', {})
    main_query = query_config.get('main_query', '')
    
    if not main_query:
        print_error("No main_query defined in config.json")
        return []
    
    try:
        print_info("Fetching contracts from database...")
        cursor = conn.cursor()
        cursor.execute(main_query)
        
        # Get column names
        columns = [column[0] for column in cursor.description]
        
        # Fetch all rows as dictionaries
        rows = []
        for row in cursor.fetchall():
            row_dict = {}
            for i, value in enumerate(row):
                row_dict[columns[i]] = value
            rows.append(row_dict)
        
        print_success(f"Found {len(rows)} contracts")
        return rows
    
    except pyodbc.Error as e:
        print_error(f"Error fetching contracts: {e}")
        return []

def fetch_installments(conn, fn_code):
    """Fetch installments for a specific contract"""
    query = """
        SELECT FnCode, SerialNo, DueDate, DueAmount, DueRcvdOn, DueAmountRcvd, DiffDays 
        FROM FnAgInstalments 
        WHERE FnCode = ? 
        ORDER BY SerialNo
    """
    
    try:
        cursor = conn.cursor()
        cursor.execute(query, (fn_code,))
        
        installments = []
        for row in cursor.fetchall():
            installments.append({
                'sno': safe_int(row[1]),
                'emi_amount': safe_float(row[3]),
                'due_date': format_date(row[2]),
                'payment_received': safe_float(row[5]),
                'date_received': format_date(row[4]),
                'delay_days': safe_int(row[6])
            })
        
        return installments
    
    except pyodbc.Error as e:
        print_warning(f"Error fetching installments for FnCode {fn_code}: {e}")
        return []

def build_contract_data(conn, config):
    """Build the complete contract data structure"""
    contracts_data = []
    
    # Fetch all contracts
    raw_contracts = fetch_contracts(conn, config)
    
    if not raw_contracts:
        return []
    
    print_info("Processing contracts and fetching installments...")
    
    for idx, row in enumerate(raw_contracts):
        fn_code = row.get('FnCode')
        
        # Determine status based on FnAgSeized
        seized_value = row.get('FnAgSeized', 0)
        status = 'Seized' if seized_value == 1 else 'Live'
        
        # Build customer address
        customer_address = combine_address(
            row.get('Address1'),
            row.get('Address2'),
            row.get('Address3'),
            row.get('Address4'),
            row.get('Address5')
        )
        
        # Build guarantor address
        guarantor_address = combine_address(
            row.get('GAddress1'),
            row.get('GAddress2'),
            row.get('GAddress3'),
            row.get('GAddress4'),
            row.get('GAddress5')
        )
        
        # Customer name with title
        customer_title = safe_str(row.get('Title'))
        customer_father = safe_str(row.get('Father'))
        customer_name = f"{customer_title} {customer_father}".strip() if customer_title else customer_father
        
        # Guarantor name with title
        guarantor_title = safe_str(row.get('GTitle'))
        guarantor_father = safe_str(row.get('GFather'))
        guarantor_name = f"{guarantor_title} {guarantor_father}".strip() if guarantor_title else guarantor_father
        
        # Fetch installments for this contract
        installments = fetch_installments(conn, fn_code)
        
        # Calculate loan details
        loan_amount = safe_float(row.get('LoanAmount'))
        total_amount = safe_float(row.get('TotalAmount'))
        amount_paid = safe_float(row.get('FnAgAmtPaid'))
        outstanding = safe_float(row.get('FnAgAmtDue'))
        interest_rate = safe_float(row.get('FnFinRate'))
        
        # Calculate EMI amount from installments or loan details
        emi_amount = 0
        if installments:
            emi_amount = installments[0].get('emi_amount', 0)
        
        # Calculate tenure from installments
        tenure_months = len(installments) if installments else 0
        
        # Build the contract object
        contract_obj = {
            "_id": str(fn_code),
            "contract_number": safe_str(row.get('FnRefNo')) or safe_str(fn_code),
            "contract_date": format_date(datetime.now()),  # You might have a date field
            "status": status,
            "customer_name": customer_name,
            "vehicle_number": safe_str(row.get('FnRegistration')),
            "file_number": safe_str(row.get('FnRefNo')),
            "company_name": safe_str(row.get('CoName')) or safe_str(row.get('CoAlias')),
            "customer": {
                "name": customer_name,
                "phone": safe_str(row.get('Mobile')),
                "address": customer_address,
                "photo": None
            },
            "guarantor": {
                "name": guarantor_name,
                "phone": safe_str(row.get('GMobile')),
                "address": guarantor_address,
                "relation": "Guarantor",
                "photo": None
            },
            "vehicle": {
                "make": safe_str(row.get('AtName')),  # Article name as make
                "model": safe_str(row.get('FnModel')),
                "year": 0,  # Year not in your schema
                "registration_number": safe_str(row.get('FnRegistration')),
                "vin": safe_str(row.get('FnChassis')),
                "color": safe_str(row.get('FnColour'))
            },
            "loan": {
                "loan_amount": loan_amount,
                "interest_rate": interest_rate,
                "tenure_months": tenure_months,
                "emi_amount": emi_amount,
                "total_amount": total_amount,
                "amount_paid": amount_paid,
                "outstanding_amount": outstanding
            },
            "payment_schedule": installments
        }
        
        contracts_data.append(contract_obj)
        
        # Progress indicator
        if (idx + 1) % 10 == 0:
            print_info(f"Processed {idx + 1}/{len(raw_contracts)} contracts...")
    
    print_success(f"Built {len(contracts_data)} complete contract records")
    return contracts_data

def save_output(data, output_path):
    """Save data to JSON file"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=json_serializer, ensure_ascii=False)
        print_success(f"Data saved to: {output_path}")
        return True
    except Exception as e:
        print_error(f"Error saving file: {e}")
        return False

def generate_mock_data_file(data, output_path):
    """Generate a TypeScript file that can be directly used in the app"""
    try:
        ts_content = f"""// Auto-generated by AnjaarFinance SQL Converter
// Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
// Total contracts: {len(data)}
// Database: AnjaarFinance

export const MOCK_CONTRACTS = {json.dumps(data, indent=2, default=json_serializer, ensure_ascii=False)};

export const MOCK_CREDENTIALS = {{
  username: 'admin',
  password: 'admin123'
}};
"""
        ts_path = output_path.replace('.json', '.ts')
        with open(ts_path, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        print_success(f"TypeScript file saved to: {ts_path}")
        return True
    except Exception as e:
        print_error(f"Error generating TypeScript file: {e}")
        return False

def main():
    """Main function"""
    print_header()
    
    # Check for pyodbc
    if not PYODBC_AVAILABLE:
        print_error("pyodbc is not installed!")
        print_info("Please install it using: pip install pyodbc")
        print_info("You also need 'ODBC Driver 17 for SQL Server' installed on Windows")
        input("\nPress Enter to exit...")
        return
    
    # Load configuration
    config = load_config()
    if not config:
        input("\nPress Enter to exit...")
        return
    
    # Connect to database
    conn = connect_to_database(config.get('database', {}))
    if not conn:
        input("\nPress Enter to exit...")
        return
    
    try:
        # Build contract data
        contracts_data = build_contract_data(conn, config)
        
        if not contracts_data:
            print_warning("No contracts found!")
            print_info("This could mean:")
            print_info("  - No records with FnSettled = 2")
            print_info("  - Database tables are empty")
            print_info("  - Query conditions don't match any data")
            input("\nPress Enter to exit...")
            return
        
        # Save output
        output_config = config.get('output', {})
        output_path = output_config.get('file_path', 'app_data.json')
        
        print("\n" + "-"*40)
        save_output(contracts_data, output_path)
        generate_mock_data_file(contracts_data, output_path)
        
        print("\n" + "="*60)
        print("SUCCESS! Data export completed.")
        print("="*60)
        print(f"\nFiles created:")
        print(f"  1. {output_path} (JSON data)")
        print(f"  2. {output_path.replace('.json', '.ts')} (TypeScript for app)")
        print(f"\nTotal contracts exported: {len(contracts_data)}")
        print(f"\nStatistics:")
        live_count = sum(1 for c in contracts_data if c['status'] == 'Live')
        seized_count = sum(1 for c in contracts_data if c['status'] == 'Seized')
        print(f"  - Live contracts: {live_count}")
        print(f"  - Seized contracts: {seized_count}")
        
        print("\nNext steps:")
        print("  1. Share the .ts file with developer")
        print("  2. New APK will be built with your data")
        
    except Exception as e:
        print_error(f"An error occurred: {e}")
        traceback.print_exc()
    
    finally:
        conn.close()
        print_info("Database connection closed")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
