# AnjaarFinance - Android APK Build Instructions

## Method 1: Using Expo EAS Build (Recommended - Easiest)

### Prerequisites:
1. Create a free Expo account at https://expo.dev/signup
2. Install EAS CLI on your computer

### Steps:

**1. Install EAS CLI:**
```bash
npm install -g eas-cli
```

**2. Login to Expo:**
```bash
eas login
```
Enter your Expo account credentials.

**3. Navigate to Project:**
```bash
cd /app/frontend
```

**4. Configure EAS Build:**
```bash
eas build:configure
```
- Select: Android
- Choose: All (Production, Preview, Development)

**5. Build APK:**
```bash
eas build -p android --profile preview
```

This will:
- Upload your app to Expo servers
- Build the APK in the cloud
- Give you a download link

**6. Download APK:**
- Wait for build to complete (15-20 minutes)
- You'll get a download link
- Download the APK to your computer
- Transfer to your Android phone
- Install it

---

## Method 2: Local Build (Advanced)

### Prerequisites:
- Android Studio installed
- Java JDK 11 or higher
- Node.js installed

### Steps:

**1. Install Expo CLI:**
```bash
npm install -g expo-cli
```

**2. Navigate to Project:**
```bash
cd /app/frontend
```

**3. Install Dependencies:**
```bash
yarn install
```

**4. Build APK Locally:**
```bash
npx expo run:android --variant release
```

**5. Find APK:**
The APK will be in:
```
/app/frontend/android/app/build/outputs/apk/release/app-release.apk
```

---

## Method 3: Using GitHub Actions (Automated)

If your code is on GitHub, I can set up automatic APK builds whenever you make changes.

---

## Installing the APK on Your Android Phone

**Step 1: Enable Unknown Sources**
1. Open Settings on your Android phone
2. Go to Security or Privacy
3. Enable "Install Unknown Apps" or "Unknown Sources"
4. Select your browser/file manager and allow installations

**Step 2: Transfer APK**
- Method A: Download directly to phone from the build link
- Method B: Transfer via USB cable
- Method C: Upload to Google Drive and download on phone

**Step 3: Install**
1. Tap the APK file
2. Click "Install"
3. Wait for installation to complete
4. Click "Open" to launch AnjaarFinance app

---

## Current App Configuration

**App Name:** AnjaarFinance
**Package Name:** com.anjaarfinance.app
**Version:** 1.0.0
**Bundle ID (iOS):** com.anjaarfinance.app

---

## Troubleshooting

**Build fails:**
- Check internet connection
- Verify Expo account is active
- Try again after a few minutes

**APK won't install:**
- Ensure "Unknown Sources" is enabled
- Check Android version (minimum Android 6.0 required)
- Verify APK file is not corrupted (re-download if needed)

**App crashes on startup:**
- Clear app data and cache
- Uninstall and reinstall
- Check if device has sufficient storage

---

## Next Steps After Installation

1. Open AnjaarFinance app on your phone
2. App will show sample data automatically
3. Test all features:
   - Browse contracts
   - Search and filter
   - View contract details
   - Check payment schedules

4. When ready for your real data:
   - Use the SQL converter to generate data file
   - Import data into the app

---

## Need Help?

Contact me if you face any issues during:
- APK build process
- Installation on your device
- App functionality

I can help troubleshoot and resolve any problems!
