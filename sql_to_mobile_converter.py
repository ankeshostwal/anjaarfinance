"""
SQL Server to Mobile Data Converter
Extracts vehicle finance data from SQL Server and converts to JSON for mobile app
"""

import pyodbc
import json
from datetime import datetime
import base64
import os

# ===== CONFIGURATION =====
# Update these settings to match your SQL Server setup
SQL_SERVER = "localhost"  # or your server IP/name
DATABASE = "VehicleFinance"  # your database name
USERNAME = "sa"  # your SQL username (leave empty for Windows Authentication)
PASSWORD = "your_password"  # your SQL password (leave empty for Windows Authentication)

# If using Windows Authentication, set this to True
USE_WINDOWS_AUTH = True

# Output file path
OUTPUT_FILE = "vehicle_finance_data.json"

# ===== SAMPLE SQL QUERIES =====
# Modify these queries based on your actual table structure

CONTRACTS_QUERY = """
SELECT 
    contract_id,
    contract_number,
    contract_date,
    status,
    customer_id,
    guarantor_id,
    vehicle_id,
    loan_amount,
    interest_rate,
    tenure_months,
    emi_amount,
    total_amount,
    amount_paid,
    outstanding_amount,
    company_name
FROM contracts
WHERE status IN ('live', 'seized')
"""

CUSTOMERS_QUERY = """
SELECT 
    customer_id,
    customer_name,
    phone,
    address,
    photo_path
FROM customers
WHERE customer_id IN ({})
"""

GUARANTORS_QUERY = """
SELECT 
    guarantor_id,
    guarantor_name,
    phone,
    address,
    relation,
    photo_path
FROM guarantors
WHERE guarantor_id IN ({})
"""

VEHICLES_QUERY = """
SELECT 
    vehicle_id,
    make,
    model,
    year,
    registration_number,
    vin,
    color
FROM vehicles
WHERE vehicle_id IN ({})
"""

PAYMENTS_QUERY = """
SELECT 
    contract_id,
    installment_number,
    due_date,
    amount,
    status,
    paid_date
FROM payment_schedule
WHERE contract_id IN ({})
ORDER BY contract_id, installment_number
"""


def get_connection():
    """Create database connection"""
    try:
        if USE_WINDOWS_AUTH:
            conn_str = f'DRIVER={{SQL Server}};SERVER={SQL_SERVER};DATABASE={DATABASE};Trusted_Connection=yes;'
        else:
            conn_str = f'DRIVER={{SQL Server}};SERVER={SQL_SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};'
        
        conn = pyodbc.connect(conn_str)
        print("✓ Connected to SQL Server successfully")
        return conn
    except Exception as e:
        print(f"✗ Connection failed: {str(e)}")
        print("\nPlease check:")
        print("1. SQL Server is running")
        print("2. Server name and database name are correct")
        print("3. Username and password are correct")
        print("4. SQL Server allows remote connections")
        return None


def image_to_base64(image_path):
    """Convert image file to base64 string"""
    if not image_path or not os.path.exists(image_path):
        # Return a default placeholder SVG
        svg = '''<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#4A90E2"/>
            <text x="100" y="100" text-anchor="middle" fill="white" font-size="20">No Photo</text>
        </svg>'''
        return f"data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}"
    
    try:
        with open(image_path, 'rb') as img_file:
            img_data = img_file.read()
            img_ext = os.path.splitext(image_path)[1].lower()
            mime_type = 'image/jpeg' if img_ext in ['.jpg', '.jpeg'] else 'image/png'
            return f"data:{mime_type};base64,{base64.b64encode(img_data).decode()}"
    except Exception as e:
        print(f"Warning: Could not read image {image_path}: {str(e)}")
        return image_to_base64(None)


def convert_data():
    """Main conversion function"""
    conn = get_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    try:
        print("\n📥 Fetching contracts...")
        cursor.execute(CONTRACTS_QUERY)
        contracts_rows = cursor.fetchall()
        print(f"✓ Found {len(contracts_rows)} contracts")
        
        if not contracts_rows:
            print("⚠ No contracts found. Exiting.")
            return False
        
        # Get all IDs
        customer_ids = [str(row.customer_id) for row in contracts_rows]
        guarantor_ids = [str(row.guarantor_id) for row in contracts_rows]
        vehicle_ids = [str(row.vehicle_id) for row in contracts_rows]
        contract_ids = [str(row.contract_id) for row in contracts_rows]
        
        # Fetch related data
        print("📥 Fetching customers...")
        cursor.execute(CUSTOMERS_QUERY.format(','.join(customer_ids)))
        customers = {row.customer_id: row for row in cursor.fetchall()}
        
        print("📥 Fetching guarantors...")
        cursor.execute(GUARANTORS_QUERY.format(','.join(guarantor_ids)))
        guarantors = {row.guarantor_id: row for row in cursor.fetchall()}
        
        print("📥 Fetching vehicles...")
        cursor.execute(VEHICLES_QUERY.format(','.join(vehicle_ids)))
        vehicles = {row.vehicle_id: row for row in cursor.fetchall()}
        
        print("📥 Fetching payment schedules...")
        cursor.execute(PAYMENTS_QUERY.format(','.join(contract_ids)))
        payments_rows = cursor.fetchall()
        
        # Organize payments by contract
        payments = {}
        for payment in payments_rows:
            if payment.contract_id not in payments:
                payments[payment.contract_id] = []
            payments[payment.contract_id].append(payment)
        
        # Build JSON structure
        print("\n🔄 Converting to mobile format...")
        contracts_data = []
        
        for contract in contracts_rows:
            customer = customers.get(contract.customer_id)
            guarantor = guarantors.get(contract.guarantor_id)
            vehicle = vehicles.get(contract.vehicle_id)
            payment_schedule = payments.get(contract.contract_id, [])
            
            if not all([customer, guarantor, vehicle]):
                print(f"⚠ Skipping contract {contract.contract_number} - missing related data")
                continue
            
            contract_data = {
                "id": str(contract.contract_id),
                "contract_number": contract.contract_number,
                "contract_date": contract.contract_date.strftime("%Y-%m-%d") if hasattr(contract.contract_date, 'strftime') else str(contract.contract_date),
                "status": contract.status.lower(),
                "company_name": contract.company_name or "Vehicle Finance Ltd",
                "customer": {
                    "name": customer.customer_name,
                    "phone": customer.phone or "",
                    "address": customer.address or "",
                    "photo": image_to_base64(customer.photo_path if hasattr(customer, 'photo_path') else None)
                },
                "guarantor": {
                    "name": guarantor.guarantor_name,
                    "phone": guarantor.phone or "",
                    "address": guarantor.address or "",
                    "relation": guarantor.relation or "Guarantor",
                    "photo": image_to_base64(guarantor.photo_path if hasattr(guarantor, 'photo_path') else None)
                },
                "vehicle": {
                    "make": vehicle.make,
                    "model": vehicle.model,
                    "year": int(vehicle.year),
                    "registration_number": vehicle.registration_number,
                    "vin": vehicle.vin or "",
                    "color": vehicle.color or "Not Specified"
                },
                "loan": {
                    "loan_amount": float(contract.loan_amount),
                    "interest_rate": float(contract.interest_rate),
                    "tenure_months": int(contract.tenure_months),
                    "emi_amount": float(contract.emi_amount),
                    "total_amount": float(contract.total_amount),
                    "amount_paid": float(contract.amount_paid),
                    "outstanding_amount": float(contract.outstanding_amount)
                },
                "payment_schedule": [
                    {
                        "installment_number": int(payment.installment_number),
                        "due_date": payment.due_date.strftime("%Y-%m-%d") if hasattr(payment.due_date, 'strftime') else str(payment.due_date),
                        "amount": float(payment.amount),
                        "status": payment.status.lower(),
                        "paid_date": payment.paid_date.strftime("%Y-%m-%d") if payment.paid_date and hasattr(payment.paid_date, 'strftime') else None
                    }
                    for payment in payment_schedule
                ],
                "created_at": datetime.utcnow().isoformat()
            }
            
            contracts_data.append(contract_data)
        
        # Save to JSON file
        print(f"\n💾 Saving to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(contracts_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ SUCCESS! Converted {len(contracts_data)} contracts")
        print(f"\n📱 Next steps:")
        print(f"1. Copy '{OUTPUT_FILE}' to your Android mobile")
        print(f"2. Open the Vehicle Finance mobile app")
        print(f"3. Use the Import Data feature to load the file")
        print(f"\nFile location: {os.path.abspath(OUTPUT_FILE)}")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Error during conversion: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("  SQL Server to Mobile Data Converter")
    print("  Vehicle Finance Application")
    print("=" * 60)
    print()
    
    # Show configuration
    print("Configuration:")
    print(f"  Server: {SQL_SERVER}")
    print(f"  Database: {DATABASE}")
    print(f"  Authentication: {'Windows' if USE_WINDOWS_AUTH else 'SQL Server'}")
    print()
    
    input("Press Enter to start conversion...")
    
    success = convert_data()
    
    print()
    input("Press Enter to exit...")
