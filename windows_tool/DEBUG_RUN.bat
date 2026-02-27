@echo off
cd /d "%~dp0"

echo ======================================== > debug_log.txt
echo AnjaarFinance Converter Debug Log >> debug_log.txt
echo %date% %time% >> debug_log.txt
echo ======================================== >> debug_log.txt
echo. >> debug_log.txt

echo Checking Python... >> debug_log.txt
python --version >> debug_log.txt 2>&1

echo. >> debug_log.txt
echo Running converter... >> debug_log.txt
echo. >> debug_log.txt

python sql_converter.py >> debug_log.txt 2>&1

echo. >> debug_log.txt
echo ======================================== >> debug_log.txt
echo Script completed >> debug_log.txt
echo ======================================== >> debug_log.txt

echo.
echo Debug log created: debug_log.txt
echo.
echo Opening log file...
notepad debug_log.txt

pause
