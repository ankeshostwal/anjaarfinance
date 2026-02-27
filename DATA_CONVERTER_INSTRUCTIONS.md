# SQL Server to Mobile Data Converter - Instructions

## Overview
This converter extracts vehicle finance data from your VB6 SQL Server database and creates a JSON file that can be viewed on your mobile app.

---

## Step 1: Prepare the Converter

### What You Need:
- Python 3.x installed on your Windows computer
- Access to your SQL Server database
- The converter script: `sql_to_mobile_converter.py`

### Install Required Library:
Open Command Prompt and run:
```
pip install pyodbc
```

---

## Step 2: Configure the Converter

Open `sql_to_mobile_converter.py` in Notepad and update these settings (lines 11-18):

```python
SQL_SERVER = "localhost"  # Change to your SQL Server name/IP
DATABASE = "VehicleFinance"  # Change to your database name
USERNAME = "sa"  # Your SQL username
PASSWORD = "your_password"  # Your SQL password
USE_WINDOWS_AUTH = True  # Set to False if using SQL Server authentication
```

### Important: Update SQL Queries

The converter includes sample SQL queries. **You MUST update them** to match your actual database table and column names.

Find these sections in the script and modify:

#### Contracts Query (Line 23):
```sql
SELECT 
    contract_id,
    contract_number,
    contract_date,
    status,  -- should be 'live' or 'seized'
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
```

#### Customers Query (Line 42):
```sql
SELECT 
    customer_id,
    customer_name,
    phone,
    address,
    photo_path  -- full path to customer photo
FROM customers
```

#### Guarantors Query (Line 52):
```sql
SELECT 
    guarantor_id,
    guarantor_name,
    phone,
    address,
    relation,
    photo_path  -- full path to guarantor photo
FROM guarantors
```

#### Vehicles Query (Line 63):
```sql
SELECT 
    vehicle_id,
    make,
    model,
    year,
    registration_number,
    vin,
    color
FROM vehicles
```

#### Payment Schedule Query (Line 75):
```sql
SELECT 
    contract_id,
    installment_number,
    due_date,
    amount,
    status,  -- 'paid', 'pending', or 'overdue'
    paid_date
FROM payment_schedule
```

---

## Step 3: Run the Converter

1. Double-click `sql_to_mobile_converter.py` OR
2. Open Command Prompt in the folder and run:
   ```
   python sql_to_mobile_converter.py
   ```

3. Press Enter to start conversion

4. The converter will:
   - ✓ Connect to your SQL Server
   - ✓ Extract all contracts
   - ✓ Fetch customer, guarantor, vehicle, and payment data
   - ✓ Convert photos to base64 format
   - ✓ Create `vehicle_finance_data.json`

---

## Step 4: Transfer to Mobile

### Method 1: USB Cable
1. Connect your Android phone to computer
2. Copy `vehicle_finance_data.json` to your phone's Downloads folder
3. Open the Vehicle Finance app
4. Tap the menu icon → Import Data
5. Select the JSON file

### Method 2: Cloud Storage (Google Drive, Dropbox)
1. Upload `vehicle_finance_data.json` to your cloud storage
2. Download the file on your mobile
3. Open the Vehicle Finance app
4. Import the downloaded file

### Method 3: Direct API Upload (Coming Soon)
Upload data directly from your computer to the mobile app via API.

---

## Troubleshooting

### "Connection failed" Error:
- ✓ Check SQL Server is running
- ✓ Verify server name and database name
- ✓ Ensure SQL Server allows remote connections
- ✓ Check username and password

### "No contracts found" Message:
- ✓ Verify the contracts table has data
- ✓ Check the status column contains 'live' or 'seized' values
- ✓ Update the WHERE clause in CONTRACTS_QUERY

### "Missing related data" Warning:
- ✓ Ensure all foreign keys are valid
- ✓ Check customer_id, guarantor_id, vehicle_id exist in their tables

### Photos Not Showing:
- ✓ Verify photo_path column contains full file paths
- ✓ Check the image files exist at those paths
- ✓ Ensure images are .jpg, .jpeg, or .png format

---

## Database Schema Example

If you need help mapping your tables, here's what the converter expects:

### Contracts Table:
- contract_id (INT/BIGINT)
- contract_number (VARCHAR)
- contract_date (DATE/DATETIME)
- status (VARCHAR) - must be 'live' or 'seized'
- customer_id (INT/BIGINT)
- guarantor_id (INT/BIGINT)
- vehicle_id (INT/BIGINT)
- loan_amount (DECIMAL/FLOAT)
- interest_rate (DECIMAL/FLOAT)
- tenure_months (INT)
- emi_amount (DECIMAL/FLOAT)
- total_amount (DECIMAL/FLOAT)
- amount_paid (DECIMAL/FLOAT)
- outstanding_amount (DECIMAL/FLOAT)
- company_name (VARCHAR)

### Customers Table:
- customer_id (INT/BIGINT)
- customer_name (VARCHAR)
- phone (VARCHAR)
- address (VARCHAR)
- photo_path (VARCHAR) - full path to image file

### Guarantors Table:
- guarantor_id (INT/BIGINT)
- guarantor_name (VARCHAR)
- phone (VARCHAR)
- address (VARCHAR)
- relation (VARCHAR)
- photo_path (VARCHAR) - full path to image file

### Vehicles Table:
- vehicle_id (INT/BIGINT)
- make (VARCHAR)
- model (VARCHAR)
- year (INT)
- registration_number (VARCHAR)
- vin (VARCHAR)
- color (VARCHAR)

### Payment Schedule Table:
- contract_id (INT/BIGINT)
- installment_number (INT)
- due_date (DATE/DATETIME)
- amount (DECIMAL/FLOAT)
- status (VARCHAR) - 'paid', 'pending', or 'overdue'
- paid_date (DATE/DATETIME) - NULL if not paid

---

## Need Help?

If your database structure is different, please provide:
1. Your table names
2. Column names in each table
3. How tables are related (foreign keys)

I can then customize the converter script for your specific database structure.

---

## Next Steps

Once you have successfully converted and imported your data:
1. Test viewing all contracts on mobile
2. Test search and filter features
3. Verify customer and guarantor photos display correctly
4. Check payment schedules show correctly
5. When satisfied, we can implement **Live Data Sync** for real-time updates
