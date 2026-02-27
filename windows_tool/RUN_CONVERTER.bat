@echo off
cd /d "%~dp0"

echo ============================================
echo    AnjaarFinance SQL Converter v2.0
echo ============================================
echo.

py --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed!
    pause
    exit /b 1
)

echo.
echo Installing required package...
py -m pip install pyodbc

echo.
echo Starting converter...
echo.

py sql_converter.py

echo.
pause
