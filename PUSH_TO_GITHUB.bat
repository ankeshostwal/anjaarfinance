@echo off
echo ========================================
echo    Push AnjaarFinance to GitHub
echo ========================================
echo.
echo This will upload all your files to:
echo https://github.com/ankeshostwal/anjaarfinance
echo.
pause

REM Check if we're in the right directory
if not exist "frontend" (
    echo [ERROR] Please run this from the anjaarfinance project folder
    pause
    exit /b 1
)

echo.
echo Step 1: Initializing Git...
git init

echo.
echo Step 2: Adding all files...
git add .

echo.
echo Step 3: Creating commit...
git commit -m "Initial commit - AnjaarFinance app with build workflow"

echo.
echo Step 4: Setting up remote...
git remote remove origin 2>nul
git remote add origin https://github.com/ankeshostwal/anjaarfinance.git

echo.
echo Step 5: Renaming branch to main...
git branch -M main

echo.
echo ========================================
echo    Ready to Push to GitHub!
echo ========================================
echo.
echo You'll need to authenticate with GitHub.
echo.
echo Choose your method:
echo   1. Username + Personal Access Token (recommended)
echo   2. GitHub Desktop (if installed)
echo.
echo For Personal Access Token:
echo   - Go to: https://github.com/settings/tokens
echo   - Click "Generate new token (classic)"
echo   - Select: repo (all permissions)
echo   - Copy the token
echo   - Use it as password when prompted
echo.
pause

echo.
echo Step 6: Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. Common fixes:
    echo.
    echo 1. Authentication issue:
    echo    - Get token: https://github.com/settings/tokens
    echo    - Username: ankeshostwal
    echo    - Password: [Use your token, not your GitHub password]
    echo.
    echo 2. Try this alternative command:
    echo    git push --set-upstream origin main
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    SUCCESS! Files Pushed to GitHub!
echo ========================================
echo.
echo Your files are now at:
echo https://github.com/ankeshostwal/anjaarfinance
echo.
echo Next steps:
echo   1. Create Expo account: https://expo.dev/signup
echo   2. Get token: https://expo.dev/accounts/settings/access-tokens
echo   3. Add to GitHub: https://github.com/ankeshostwal/anjaarfinance/settings/secrets/actions
echo   4. Run build: https://github.com/ankeshostwal/anjaarfinance/actions
echo.
pause
