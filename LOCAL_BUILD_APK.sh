#!/bin/bash

# AnjaarFinance - Local APK Build Script
# This script will build your Android APK locally on your computer

set -e  # Exit on error

echo "======================================"
echo "   AnjaarFinance APK Builder"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo -e "${RED}Error: Please run this script from the /app/frontend directory${NC}"
    echo "Usage: cd /app/frontend && bash ../LOCAL_BUILD_APK.sh"
    exit 1
fi

echo -e "${GREEN}✓ Found app.json${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}! Yarn not found. Installing yarn...${NC}"
    npm install -g yarn
fi

echo -e "${GREEN}✓ Yarn version: $(yarn -v)${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
yarn install

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}! EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
    echo -e "${GREEN}✓ EAS CLI installed${NC}"
fi

echo -e "${GREEN}✓ EAS CLI version: $(eas --version)${NC}"
echo ""

# Check login status
echo -e "${YELLOW}🔐 Checking Expo login status...${NC}"
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}! Not logged in to Expo${NC}"
    echo ""
    echo "Please login to your Expo account:"
    echo "Username: ankeshostwal"
    echo ""
    eas login
else
    EXPO_USER=$(eas whoami 2>&1)
    echo -e "${GREEN}✓ Logged in as: $EXPO_USER${NC}"
fi

echo ""
echo "======================================"
echo "   Choose Build Method"
echo "======================================"
echo ""
echo "1) Cloud Build (Recommended - Easiest)"
echo "   - Builds on Expo servers"
echo "   - Takes 15-20 minutes"
echo "   - No Android SDK required"
echo "   - Download APK when ready"
echo ""
echo "2) Local Build (Advanced)"
echo "   - Builds on this computer"
echo "   - Requires Android SDK"
echo "   - Faster if SDK is set up"
echo "   - APK ready immediately"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo -e "${YELLOW}🚀 Starting cloud build...${NC}"
    echo ""
    echo "This will:"
    echo "  - Upload your app to Expo servers"
    echo "  - Build the APK in the cloud"
    echo "  - Provide a download link"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    echo ""
    
    eas build --platform android --profile preview
    
    echo ""
    echo -e "${GREEN}======================================"
    echo "   Build Submitted Successfully!"
    echo "======================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Wait for build to complete (15-20 minutes)"
    echo "2. Check build status at:"
    echo "   https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds"
    echo ""
    echo "3. Download APK from the link above"
    echo "4. Transfer to your Android phone"
    echo "5. Install the APK"
    echo ""

elif [ "$choice" = "2" ]; then
    echo ""
    echo -e "${YELLOW}🏗️  Starting local build...${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Requirements:${NC}"
    echo "  - Android SDK must be installed"
    echo "  - Java JDK 11+ required"
    echo "  - ANDROID_HOME environment variable set"
    echo ""
    read -p "Press Enter if you have these installed, or Ctrl+C to cancel..."
    echo ""
    
    # Check for Android SDK
    if [ -z "$ANDROID_HOME" ]; then
        echo -e "${RED}✗ ANDROID_HOME is not set${NC}"
        echo ""
        echo "Please install Android SDK and set ANDROID_HOME:"
        echo "  export ANDROID_HOME=/path/to/android/sdk"
        echo ""
        echo "Or use Cloud Build (option 1) instead."
        exit 1
    fi
    
    echo -e "${GREEN}✓ ANDROID_HOME: $ANDROID_HOME${NC}"
    echo ""
    
    eas build --platform android --profile preview --local
    
    echo ""
    echo -e "${GREEN}======================================"
    echo "   Build Complete!"
    echo "======================================${NC}"
    echo ""
    echo "Your APK is ready!"
    echo "Look for the APK file in the output above."
    echo ""
    echo "Transfer to your Android phone and install."
    echo ""
else
    echo -e "${RED}Invalid choice. Please run the script again.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Script completed${NC}"
echo ""
