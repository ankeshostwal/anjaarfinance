# AnjaarFinance SQL Server Data Converter

This Windows tool extracts data from your SQL Server database and converts it into a format that can be imported into the AnjaarFinance mobile app.

## Prerequisites

1. **Python 3.8+** - Download from https://www.python.org/downloads/
2. **ODBC Driver 17 for SQL Server** - Download from Microsoft:
   https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server

## Quick Start

### Option 1: Run Python Script Directly

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Edit `config.json` with your database settings (see Configuration below)

3. Run the converter:
   ```
   python sql_converter.py
   ```

### Option 2: Build and Run EXE

1. Double-click `build_exe.bat` to create the EXE
2. Copy `dist\AnjaarFinance_SQLConverter.exe` and `config.json` to your desired folder
3. Double-click the EXE to run

## Configuration (config.json)

Edit `config.json` to match your database structure:

### Database Connection
```json
{
  "database": {
    "server": "localhost",           // Your SQL Server name/IP
    "database": "YourDatabaseName",  // Your database name
    "username": "",                  // SQL login (if not using Windows auth)
    "password": "",                  // SQL password (if not using Windows auth)
    "trusted_connection": true       // true = Windows Authentication
  }
}
```

### Table Mappings
Map your table names and column names to the app's expected format:

```json
{
  "tables": {
    "contracts": {
      "table_name": "YOUR_TABLE_NAME",    // Your actual table name
      "columns": {
        "id": "YourIDColumn",              // Map app field to your column
        "contract_number": "YourContractNoColumn",
        ...
      }
    }
  }
}
```

## Expected Data Structure

The app expects the following data structure:

### Contract
- `id` - Unique identifier
- `contract_number` - Contract/File number
- `contract_date` - Date of contract
- `status` - "Live" or "Seized"
- `file_number` - File reference number
- `company_name` - Finance company name

### Customer
- `name` - Customer full name
- `phone` - Phone number
- `address` - Full address
- `photo` - Path to photo (optional)

### Guarantor
- `name` - Guarantor full name
- `phone` - Phone number
- `address` - Full address
- `relation` - Relationship to customer
- `photo` - Path to photo (optional)

### Vehicle
- `make` - Vehicle manufacturer (e.g., "Honda")
- `model` - Vehicle model (e.g., "City")
- `year` - Manufacturing year
- `registration_number` - Vehicle registration number
- `vin` - Vehicle identification number
- `color` - Vehicle color

### Loan
- `loan_amount` - Principal loan amount
- `interest_rate` - Interest rate percentage
- `tenure_months` - Loan tenure in months
- `emi_amount` - Monthly EMI amount
- `total_amount` - Total payable amount
- `amount_paid` - Amount already paid
- `outstanding_amount` - Remaining amount

### Payment Schedule (per EMI)
- `sno` - Installment number (1, 2, 3...)
- `emi_amount` - EMI amount for this installment
- `due_date` - Due date for payment
- `payment_received` - Amount received (0 if not paid)
- `date_received` - Date payment was received (null if not paid)
- `delay_days` - Number of days delayed (0 if on time)

## Output Files

The tool generates two files:

1. **app_data.json** - Raw JSON data
2. **app_data.ts** - TypeScript file ready to use in the app

## Updating the App

After generating the data:

1. Copy `app_data.ts` to replace `app/mockData.ts` in the app source
2. Rebuild the APK using GitHub Actions
3. Install the new APK on your phone

## Troubleshooting

### "ODBC Driver not found"
Install ODBC Driver 17 for SQL Server from Microsoft

### "Login failed"
- Check server name and database name in config.json
- If using SQL authentication, set `trusted_connection: false` and provide username/password
- If using Windows auth, ensure `trusted_connection: true`

### "Table not found"
- Verify table names in config.json match your actual table names
- Table names are case-sensitive

### "Column not found"
- Verify column names in config.json match your actual column names
- Column names are case-sensitive

## Support

For issues or questions, please contact the development team.
