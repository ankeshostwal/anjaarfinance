# AnjaarFinance - Download & Build APK Locally

## Quick Start Guide

Follow these simple steps to build your APK on your own computer.

---

## Step 1: Download Project Files

You already have the project on GitHub! Here's how to download it:

### Option A: Download as ZIP from GitHub

1. Go to: **https://github.com/ankeshostwal/anjaarfinance**
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Extract the ZIP file to a folder (e.g., `C:\AnjaarFinance\`)

### Option B: Use Git Clone (If you have Git installed)

```bash
git clone https://github.com/ankeshostwal/anjaarfinance.git
cd anjaarfinance
```

---

## Step 2: Install Node.js (If Not Already Installed)

**Download Node.js:**
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. **IMPORTANT:** Check the box **"Add to PATH"**
5. Click "Next" through all steps
6. Restart your computer after installation

**Verify Installation:**
Open Command Prompt and type:
```bash
node --version
npm --version
```

You should see version numbers like:
```
v22.11.0
10.9.0
```

---

## Step 3: Run the Build Script

### On Windows:

1. Navigate to the **frontend** folder inside your downloaded project
2. Find the file: **BUILD_APK_LOCALLY.bat**
3. **Right-click** on it
4. Select **"Run as Administrator"**
5. Follow the on-screen instructions

The script will:
- ✅ Check Node.js installation
- ✅ Install all dependencies (5-10 minutes)
- ✅ Install Expo EAS CLI
- ✅ Ask you to login (Username: ankeshostwal, Password: your password)
- ✅ Submit build to Expo servers
- ✅ Give you a link to track progress

### On Mac/Linux:

Open Terminal and run:
```bash
cd /path/to/anjaarfinance/frontend
chmod +x BUILD_APK_LOCALLY.sh
./BUILD_APK_LOCALLY.sh
```

---

## Step 4: Wait for Build

After the script completes:

1. **Build Status:** Check at https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
2. **Wait Time:** 15-20 minutes
3. **Email:** Expo will email you when done (if email provided)

---

## Step 5: Download APK

Once build completes:

1. Go to: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
2. Click the **"Download"** button next to your completed build
3. APK file downloads to your computer (named: `anjaarfinance-xxxxx.apk`)

---

## Step 6: Install on Android Phone

### Method 1: USB Cable

1. Connect phone to computer with USB cable
2. Copy APK file to phone's **Downloads** folder
3. On phone, open **File Manager**
4. Go to **Downloads** folder
5. Tap the APK file
6. If prompted, enable **"Install Unknown Apps"**:
   - Settings → Security → Install Unknown Apps → Enable for File Manager
7. Tap **"Install"**
8. Wait for installation
9. Tap **"Open"** to launch AnjaarFinance!

### Method 2: Google Drive

1. Upload APK to your Google Drive
2. Open Google Drive on your phone
3. Download the APK
4. Follow installation steps above

### Method 3: Direct Download

1. Upload APK to a file hosting service
2. Open link on your phone
3. Download and install

---

## Troubleshooting

### Error: "Node.js not found"
**Solution:** Install Node.js from https://nodejs.org/ and restart computer

### Error: "npm install failed"
**Solution:** 
1. Delete `node_modules` folder
2. Run script again
3. Or manually run: `npm install` in frontend folder

### Error: "EAS login failed"
**Solution:**
- Check username: ankeshostwal
- Check password is correct
- Try: `eas logout` then `eas login` again

### Error: "Build submission failed"
**Solution:**
- Check internet connection
- Verify you're logged into correct Expo account
- Try again - it's usually temporary

### APK Won't Install on Phone
**Solution:**
- Enable "Install Unknown Apps" in Settings
- Check if you have enough storage space
- Verify APK file downloaded completely (not corrupted)

---

## What If Build Script Doesn't Work?

### Manual Build Steps:

1. **Open Command Prompt/Terminal**
2. **Navigate to frontend folder:**
   ```bash
   cd C:\AnjaarFinance\frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

5. **Login to Expo:**
   ```bash
   eas login
   ```
   - Username: ankeshostwal
   - Password: [your password]

6. **Build APK:**
   ```bash
   eas build -p android --profile preview
   ```

7. **Wait and Download:**
   - Wait 15-20 minutes
   - Download from Expo dashboard

---

## Need Help?

If you encounter any issues:

1. **Take a screenshot** of the error
2. **Note which step** you're on
3. **Contact support** with details

---

## Summary

**What You Have:**
- ✅ Project files on GitHub
- ✅ Build script ready to use
- ✅ Complete instructions

**What You Need:**
- Node.js installed
- Internet connection
- 30 minutes time

**Result:**
- AnjaarFinance.apk ready to install on your Android phone!

---

## Alternative: Pre-Built APK

If you want to skip the build process entirely, you can:

1. Contact Emergent support: support@emergent.sh
2. Ask if they can help with APK generation
3. Or use a build service like AppCenter (free)

---

Good luck! Your app is almost ready to use on your phone! 🎉
