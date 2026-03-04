@echo off
echo ==========================================
echo   Building AnjaarFinance SQL Converter EXE
echo ==========================================
echo.

REM Check if Python is installed (using py launcher)
py --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed.
    pause
    exit /b 1
)

echo Step 1: Installing required packages...
py -m pip install --upgrade pip
py -m pip install -r requirements.txt
py -m pip install pyinstaller

if errorlevel 1 (
    echo ERROR: Failed to install packages
    pause
    exit /b 1
)

echo.
echo Step 2: Building EXE file...
py -m PyInstaller --onefile --name "AnjaarFinance_SQLConverter" sql_converter.py

if errorlevel 1 (
    echo ERROR: Failed to build EXE
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   BUILD SUCCESSFUL!
echo ==========================================
pause