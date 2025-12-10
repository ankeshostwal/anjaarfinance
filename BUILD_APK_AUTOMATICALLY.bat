@echo off
echo ========================================
echo    AnjaarFinance - Automatic APK Builder
echo ========================================
echo.
echo This script will:
echo   1. Download your project from GitHub
echo   2. Install dependencies automatically
echo   3. Guide you through Expo login (ONE TIME only)
echo   4. Build your APK automatically
echo   5. Give you the download link
echo.
echo Total time: About 25 minutes (mostly waiting for build)
echo.
pause

echo.
echo ========================================
echo Step 1: Checking Prerequisites...
echo ========================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo Then run this script again.
    pause
    exit /b 1
)
echo [OK] Node.js is installed: 
node -v

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Git is not installed.
    echo Downloading project as ZIP instead...
    echo.
    echo Please download manually:
    echo 1. Go to: https://github.com/ankeshostwal/anjaarfinance
    echo 2. Click "Code" button
    echo 3. Click "Download ZIP"
    echo 4. Extract the ZIP file to your Desktop
    echo 5. Run this script from inside the extracted folder
    pause
    exit /b 1
)
echo [OK] Git is installed

REM Check if EAS CLI is installed
eas --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] EAS CLI not found. Installing now...
    call npm install -g eas-cli
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install EAS CLI
        pause
        exit /b 1
    )
    echo [OK] EAS CLI installed successfully
) else (
    echo [OK] EAS CLI is installed
)

echo.
echo ========================================
echo Step 2: Downloading Project from GitHub...
echo ========================================
echo.

cd %USERPROFILE%\Desktop

REM Check if folder already exists
if exist anjaarfinance (
    echo [INFO] Project folder already exists. Updating...
    cd anjaarfinance
    git pull
) else (
    echo [INFO] Downloading project...
    git clone https://github.com/ankeshostwal/anjaarfinance.git
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to download project
        pause
        exit /b 1
    )
    cd anjaarfinance
)

echo [OK] Project downloaded successfully

echo.
echo ========================================
echo Step 3: Installing Dependencies...
echo ========================================
echo.

cd frontend

REM Check if Yarn is installed
yarn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Yarn...
    call npm install -g yarn
)

echo [INFO] Installing project dependencies (this takes 2-3 minutes)...
call yarn install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed successfully

echo.
echo ========================================
echo Step 4: Expo Account Login
echo ========================================
echo.
echo IMPORTANT: You need an Expo account to build the APK.
echo.
echo Option 1: If you already have an account
echo    - Just login with your username and password
echo.
echo Option 2: If you don't have an account
echo    - Create one at: https://expo.dev/signup
echo    - Takes only 2 minutes
echo    - You only need to do this ONCE
echo.
echo After creating/logging in, this script will handle the rest!
echo.
pause

REM Try to login
eas whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Please login to Expo now...
    echo.
    call eas login
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Login failed. Please check your credentials.
        echo.
        echo Don't have an account? Create one at: https://expo.dev/signup
        echo Then run this script again.
        pause
        exit /b 1
    )
) else (
    echo [OK] Already logged in to Expo
)

echo.
echo ========================================
echo Step 5: Building Your APK!
echo ========================================
echo.
echo Starting build process...
echo This will upload your app to Expo servers and build the APK.
echo.
echo The build takes 15-20 minutes. You can:
echo   - Close this window (build continues on Expo servers)
echo   - Keep it open to see progress
echo.
echo After submission, check your build at:
echo https://expo.dev/accounts/%USERNAME%/projects/anjaarfinance/builds
echo.
pause

call eas build --platform android --profile preview --non-interactive

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build submission failed
    echo.
    echo Please check the error message above.
    echo Common fixes:
    echo   1. Make sure you're logged in: eas whoami
    echo   2. Check your internet connection
    echo   3. Try again - sometimes Expo servers are busy
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Build Submitted!
echo ========================================
echo.
echo Your APK is being built on Expo servers (takes 15-20 minutes)
echo.
echo NEXT STEPS:
echo.
echo 1. Check build status:
echo    https://expo.dev/accounts/YOUR_USERNAME/projects/anjaarfinance/builds
echo.
echo 2. When build is "Finished", click "Download" button
echo.
echo 3. Transfer APK to your Android phone
echo.
echo 4. Install on phone:
echo    - Enable "Unknown Sources" in Settings
echo    - Tap APK file
echo    - Click "Install"
echo.
echo 5. Open AnjaarFinance app and enjoy!
echo.
echo ========================================
echo.
echo IMPORTANT: Save this information:
echo   - Your Expo username: [Check with: eas whoami]
echo   - Build dashboard: https://expo.dev
echo.
echo For future builds, just run this script again!
echo It will be much faster (no installation needed)
echo.
pause
