"""
AnjaarFinance SQL Server Data Converter
=======================================
This tool reads data from your SQL Server database and converts it
to a JSON file that can be imported into the AnjaarFinance mobile app.

Instructions:
1. Edit config.json with your database connection details
2. Map your table names and column names in config.json
3. Run this tool to generate app_data.json
4. Import app_data.json into the mobile app

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
    print("="*60 + "\n")

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

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
        
        if trusted_connection:
            connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"
        else:
            connection_string = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};"
        
        print_info(f"Connecting to {server}/{database}...")
        conn = pyodbc.connect(connection_string, timeout=10)
        print_success("Connected to SQL Server successfully!")
        return conn
    
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

def fetch_data(conn, table_name, columns_map):
    """Fetch data from a table with column mapping"""
    try:
        # Build SELECT query with column aliases
        select_parts = []
        for app_field, db_column in columns_map.items():
            select_parts.append(f"[{db_column}] AS [{app_field}]")
        
        select_clause = ", ".join(select_parts)
        query = f"SELECT {select_clause} FROM [{table_name}]"
        
        cursor = conn.cursor()
        cursor.execute(query)
        
        # Get column names from cursor description
        columns = [column[0] for column in cursor.description]
        
        # Fetch all rows as dictionaries
        rows = []
        for row in cursor.fetchall():
            row_dict = {}
            for i, value in enumerate(row):
                row_dict[columns[i]] = value
            rows.append(row_dict)
        
        return rows
    
    except pyodbc.Error as e:
        print_error(f"Error fetching from {table_name}: {e}")
        return []

def build_contract_data(conn, config):
    """Build the complete contract data structure"""
    tables = config.get('tables', {})
    contracts_data = []
    
    # Fetch contracts
    print_info("Fetching contracts...")
    contracts_config = tables.get('contracts', {})
    contracts = fetch_data(conn, 
                          contracts_config.get('table_name', ''),
                          contracts_config.get('columns', {}))
    print_success(f"Found {len(contracts)} contracts")
    
    # Fetch related data
    print_info("Fetching customers...")
    customers_config = tables.get('customers', {})
    customers = fetch_data(conn,
                          customers_config.get('table_name', ''),
                          customers_config.get('columns', {}))
    customers_by_contract = {c.get('contract_id'): c for c in customers}
    print_success(f"Found {len(customers)} customers")
    
    print_info("Fetching guarantors...")
    guarantors_config = tables.get('guarantors', {})
    guarantors = fetch_data(conn,
                           guarantors_config.get('table_name', ''),
                           guarantors_config.get('columns', {}))
    guarantors_by_contract = {g.get('contract_id'): g for g in guarantors}
    print_success(f"Found {len(guarantors)} guarantors")
    
    print_info("Fetching vehicles...")
    vehicles_config = tables.get('vehicles', {})
    vehicles = fetch_data(conn,
                         vehicles_config.get('table_name', ''),
                         vehicles_config.get('columns', {}))
    vehicles_by_contract = {v.get('contract_id'): v for v in vehicles}
    print_success(f"Found {len(vehicles)} vehicles")
    
    print_info("Fetching loans...")
    loans_config = tables.get('loans', {})
    loans = fetch_data(conn,
                      loans_config.get('table_name', ''),
                      loans_config.get('columns', {}))
    loans_by_contract = {l.get('contract_id'): l for l in loans}
    print_success(f"Found {len(loans)} loans")
    
    print_info("Fetching payments...")
    payments_config = tables.get('payments', {})
    payments = fetch_data(conn,
                         payments_config.get('table_name', ''),
                         payments_config.get('columns', {}))
    # Group payments by contract
    payments_by_contract = {}
    for p in payments:
        contract_id = p.get('contract_id')
        if contract_id not in payments_by_contract:
            payments_by_contract[contract_id] = []
        payments_by_contract[contract_id].append(p)
    print_success(f"Found {len(payments)} payment records")
    
    # Build complete contract objects
    print_info("Building contract data...")
    for idx, contract in enumerate(contracts):
        contract_id = contract.get('id')
        
        customer = customers_by_contract.get(contract_id, {})
        guarantor = guarantors_by_contract.get(contract_id, {})
        vehicle = vehicles_by_contract.get(contract_id, {})
        loan = loans_by_contract.get(contract_id, {})
        contract_payments = payments_by_contract.get(contract_id, [])
        
        # Sort payments by sno
        contract_payments.sort(key=lambda x: x.get('sno', 0))
        
        # Build the contract object matching app's expected format
        contract_obj = {
            "_id": str(contract_id),
            "contract_number": str(contract.get('contract_number', '')),
            "contract_date": contract.get('contract_date', ''),
            "status": contract.get('status', 'Live'),
            "customer_name": customer.get('name', ''),
            "vehicle_number": vehicle.get('registration_number', ''),
            "file_number": str(contract.get('file_number', '')),
            "company_name": contract.get('company_name', ''),
            "customer": {
                "name": customer.get('name', ''),
                "phone": customer.get('phone', ''),
                "address": customer.get('address', ''),
                "photo": customer.get('photo') or None
            },
            "guarantor": {
                "name": guarantor.get('name', ''),
                "phone": guarantor.get('phone', ''),
                "address": guarantor.get('address', ''),
                "relation": guarantor.get('relation', ''),
                "photo": guarantor.get('photo') or None
            },
            "vehicle": {
                "make": vehicle.get('make', ''),
                "model": vehicle.get('model', ''),
                "year": int(vehicle.get('year', 0)) if vehicle.get('year') else 0,
                "registration_number": vehicle.get('registration_number', ''),
                "vin": vehicle.get('vin', ''),
                "color": vehicle.get('color', '')
            },
            "loan": {
                "loan_amount": float(loan.get('loan_amount', 0) or 0),
                "interest_rate": float(loan.get('interest_rate', 0) or 0),
                "tenure_months": int(loan.get('tenure_months', 0) or 0),
                "emi_amount": float(loan.get('emi_amount', 0) or 0),
                "total_amount": float(loan.get('total_amount', 0) or 0),
                "amount_paid": float(loan.get('amount_paid', 0) or 0),
                "outstanding_amount": float(loan.get('outstanding_amount', 0) or 0)
            },
            "payment_schedule": [
                {
                    "sno": int(p.get('sno', i+1)),
                    "emi_amount": float(p.get('emi_amount', 0) or 0),
                    "due_date": p.get('due_date', ''),
                    "payment_received": float(p.get('payment_received', 0) or 0),
                    "date_received": p.get('date_received') or None,
                    "delay_days": int(p.get('delay_days', 0) or 0)
                }
                for i, p in enumerate(contract_payments)
            ]
        }
        
        contracts_data.append(contract_obj)
    
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
            print_warning("No contracts found! Please check your table mappings in config.json")
            input("\nPress Enter to exit...")
            return
        
        # Save output
        output_config = config.get('output', {})
        output_path = output_config.get('file_path', 'app_data.json')
        
        print("\n" + "-"*40)
        save_output(contracts_data, output_path)
        generate_mock_data_file(contracts_data, output_path)
        
        print("\n" + "="*60)
        print(f"{Colors.GREEN}{Colors.BOLD}SUCCESS! Data export completed.{Colors.END}")
        print("="*60)
        print(f"\nFiles created:")
        print(f"  1. {output_path} (JSON data)")
        print(f"  2. {output_path.replace('.json', '.ts')} (TypeScript for app)")
        print(f"\nTotal contracts exported: {len(contracts_data)}")
        print("\nNext steps:")
        print("  1. Copy the .ts file to replace app/mockData.ts in your app")
        print("  2. Rebuild the APK to include the new data")
        
    except Exception as e:
        print_error(f"An error occurred: {e}")
        traceback.print_exc()
    
    finally:
        conn.close()
        print_info("Database connection closed")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
