# SQL to Mobile Data Converter - Create .EXE File

## Step-by-Step Guide to Create Windows .EXE

### Prerequisites:
1. Windows PC
2. Python 3.7 or higher installed
3. The converter script: `sql_to_mobile_converter.py`

---

## Step 1: Install Python (If Not Already Installed)

**Download Python:**
1. Go to https://www.python.org/downloads/
2. Download Python 3.11 or latest version
3. Run the installer
4. **IMPORTANT:** Check the box "Add Python to PATH"
5. Click "Install Now"

**Verify Installation:**
Open Command Prompt and type:
```
python --version
```
You should see: `Python 3.x.x`

---

## Step 2: Install Required Libraries

Open Command Prompt and run these commands:

```bash
pip install pyodbc
pip install pyinstaller
```

Wait for installation to complete.

---

## Step 3: Prepare the Converter Script

1. Copy `sql_to_mobile_converter.py` to a folder (e.g., `C:\VehicleFinance\`)
2. Open the file in Notepad
3. Update these settings at the top:

```python
SQL_SERVER = "YOUR_SERVER_NAME"  # e.g., "localhost" or "192.168.1.100"
DATABASE = "YOUR_DATABASE_NAME"  # e.g., "VehicleFinanceDB"
USERNAME = "YOUR_SQL_USERNAME"   # e.g., "sa"
PASSWORD = "YOUR_SQL_PASSWORD"   # Your password
USE_WINDOWS_AUTH = True  # Set to False if using SQL Server authentication
```

4. Update the SQL queries to match your database table structure
5. Save the file

---

## Step 4: Create the .EXE File

**Method A: Simple Console App**

1. Open Command Prompt
2. Navigate to your folder:
   ```bash
   cd C:\VehicleFinance
   ```

3. Run PyInstaller:
   ```bash
   pyinstaller --onefile sql_to_mobile_converter.py
   ```

4. Wait for 2-3 minutes while it builds
5. Find your .exe in: `C:\VehicleFinance\dist\sql_to_mobile_converter.exe`

---

**Method B: With Custom Name and Icon**

```bash
pyinstaller --onefile --name "AnjaarFinanceConverter" sql_to_mobile_converter.py
```

This creates: `AnjaarFinanceConverter.exe`

---

**Method C: With No Console Window (GUI Mode)**

```bash
pyinstaller --onefile --windowed --name "AnjaarFinanceConverter" sql_to_mobile_converter.py
```

This creates a GUI app with no black console window.

---

## Step 5: Test the .EXE

1. Navigate to the `dist` folder
2. Double-click `sql_to_mobile_converter.exe` (or your custom name)
3. The converter should:
   - Show configuration
   - Ask you to press Enter to start
   - Connect to SQL Server
   - Extract data
   - Create `vehicle_finance_data.json`

---

## Step 6: Distribute the .EXE

**The .exe file is standalone!**

You can:
- Copy it to any Windows PC
- No Python installation needed on other PCs
- Just double-click to run

**Note:** The .exe needs:
- SQL Server ODBC drivers installed
- Access to your SQL Server
- Permission to create files in the folder

---

## Common Issues & Solutions

### Issue: "pyinstaller is not recognized"
**Solution:**
```bash
python -m pip install --upgrade pip
pip install pyinstaller
```

### Issue: ".exe fails to run"
**Solution:**
- Run as Administrator
- Check Windows Defender (it may block unknown .exe files)
- Add exception in antivirus software

### Issue: "Unable to connect to SQL Server"
**Solution:**
- Verify SQL Server is running
- Check server name and database name
- Test connection from SQL Server Management Studio first
- Ensure SQL Server allows remote connections

### Issue: ".exe is too large (100+ MB)"
**Solution:** This is normal. PyInstaller bundles Python and all libraries.

### Issue: "Module not found error"
**Solution:**
- Make sure pyodbc is installed: `pip install pyodbc`
- Rebuild the .exe after installing missing modules

---

## Advanced: Create Installer Package

If you want to create a professional installer:

1. Install NSIS (Nullsoft Scriptable Install System)
2. Create an installer script
3. Package the .exe with installer

Or use tools like:
- Inno Setup
- Advanced Installer
- InstallShield

---

## Alternative: Create a Batch File (Simpler)

If you don't want to create .exe, you can create a batch file:

**Create: `RunConverter.bat`**

```batch
@echo off
echo Starting AnjaarFinance Data Converter...
python sql_to_mobile_converter.py
pause
```

Save this file next to your Python script.
Users just double-click the .bat file to run the converter.

**Requirement:** Python must be installed on the PC.

---

## What the Converter Does:

1. Connects to your SQL Server database
2. Extracts all contracts (Live/Seized only)
3. Gets customer, guarantor, vehicle data
4. Gets payment schedules
5. Converts photos to base64 format
6. Creates `vehicle_finance_data.json` file
7. You copy this file to your Android phone
8. Import it in AnjaarFinance mobile app

---

## Next Steps:

1. Create the .exe file
2. Test it with your database
3. Once working, you can:
   - Run it whenever you need updated data
   - Create a shortcut on desktop
   - Schedule it to run automatically (using Windows Task Scheduler)

---

## Need Help?

If you face any issues:
1. Take a screenshot of the error
2. Note which step you're on
3. Contact me with details

I'll help you troubleshoot and get the converter working!
