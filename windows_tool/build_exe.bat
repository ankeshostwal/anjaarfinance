@echo off
echo ============================================
echo   Building AnjaarFinance SQL Converter EXE
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Step 1: Installing required packages...
pip install -r requirements.txt

if errorlevel 1 (
    echo ERROR: Failed to install packages
    pause
    exit /b 1
)

echo.
echo Step 2: Building EXE file...
pyinstaller --onefile --name "AnjaarFinance_SQLConverter" --icon=icon.ico sql_converter.py 2>nul
if not exist icon.ico (
    pyinstaller --onefile --name "AnjaarFinance_SQLConverter" sql_converter.py
)

if errorlevel 1 (
    echo ERROR: Failed to build EXE
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD SUCCESSFUL!
echo ============================================
echo.
echo The EXE file is located at:
echo   dist\AnjaarFinance_SQLConverter.exe
echo.
echo Copy these files to your target folder:
echo   1. dist\AnjaarFinance_SQLConverter.exe
echo   2. config.json
echo.
pause
