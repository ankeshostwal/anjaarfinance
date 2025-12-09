@echo off
echo ============================================
echo   AnjaarFinance APK Builder
echo   Automated Local Build Script
echo ============================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo Download the LTS version and install it.
    pause
    exit /b 1
)
echo Node.js found!
node --version
echo.

REM Check if we're in the frontend directory
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the frontend directory.
    pause
    exit /b 1
)

REM Install dependencies
echo [2/6] Installing dependencies (this may take 5-10 minutes)...
echo Please wait...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully!
echo.

REM Install EAS CLI globally
echo [3/6] Installing Expo EAS CLI...
call npm install -g eas-cli
if %errorlevel% neq 0 (
    echo Warning: Failed to install EAS CLI globally
    echo Trying local installation...
    call npx eas-cli --version
)
echo EAS CLI ready!
echo.

REM Login to Expo
echo [4/6] Login to Expo account...
echo Please enter your credentials when prompted:
echo Username: ankeshostwal
echo Password: [your Expo password]
echo.
call eas login
if %errorlevel% neq 0 (
    echo ERROR: Failed to login to Expo
    echo Please check your username and password
    pause
    exit /b 1
)
echo Login successful!
echo.

REM Configure EAS (if not already done)
echo [5/6] Configuring EAS build...
if not exist "eas.json" (
    call eas build:configure
)
echo Configuration ready!
echo.

REM Build APK
echo [6/6] Building APK...
echo This will take 15-20 minutes. Please wait...
echo Build is running on Expo servers.
echo You can close this window and check status at:
echo https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
echo.
call eas build -p android --profile preview --non-interactive
if %errorlevel% neq 0 (
    echo.
    echo Build submission failed. But don't worry!
    echo The build might still be queued on Expo servers.
    echo Check: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   BUILD SUBMITTED SUCCESSFULLY!
echo ============================================
echo.
echo Your APK is being built on Expo servers.
echo.
echo What to do next:
echo 1. Wait 15-20 minutes for build to complete
echo 2. Check build status at:
echo    https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
echo 3. Download APK when ready
echo 4. Transfer to your Android phone
echo 5. Install and enjoy!
echo.
echo ============================================
pause
