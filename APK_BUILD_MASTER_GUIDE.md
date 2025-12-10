# AnjaarFinance - Complete APK Build Guide

This guide provides **THREE** proven methods to build your AnjaarFinance Android APK. Choose the one that works best for you!

---

## 📋 Quick Overview

| Method | Difficulty | Requirements | Time | Best For |
|--------|-----------|--------------|------|----------|
| **Method 1: Local Build Script** | ⭐ Easy | EAS CLI | 15-20 min | Most users |
| **Method 2: GitHub Actions** | ⭐⭐ Medium | GitHub repo + Expo token | 15-20 min | Automated builds |
| **Method 3: Manual EAS** | ⭐⭐⭐ Advanced | EAS CLI knowledge | 15-20 min | Developers |

---

## 🚀 Method 1: Local Build Script (RECOMMENDED)

**This is the easiest and most reliable method!**

### Prerequisites:
- Node.js installed on your computer
- Internet connection

### Steps:

**1. Download the project files** (if not already on your computer)

**2. Open Terminal/Command Prompt and navigate to the frontend folder:**
```bash
cd /path/to/app/frontend
```

**3. Run the build script:**
```bash
bash ../LOCAL_BUILD_APK.sh
```

**4. Follow the on-screen instructions:**
- The script will check and install all requirements
- You'll be asked to login to Expo (username: `ankeshostwal`)
- Choose option 1 (Cloud Build) - this is easiest
- Wait 15-20 minutes for the build to complete

**5. Download your APK:**
- The script will provide a link to your build
- Go to: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
- Click the download button when build is complete

**6. Install on your Android phone**

✅ **Done!** Your APK is ready to install.

---

## 🤖 Method 2: GitHub Actions (Automated)

**Perfect for automatic builds when you push code changes.**

### One-Time Setup:

**Step 1: Get Expo Access Token**

1. Go to https://expo.dev/accounts/ankeshostwal/settings/access-tokens
2. Login with username: `ankeshostwal`
3. Click "Create Token"
4. Name it: "GitHub Actions"
5. Copy the token (it looks like: `expo_abc123...xyz789`)
6. ⚠️ Save it immediately - you won't see it again!

**Step 2: Add Token to GitHub**

1. Go to your GitHub repository
2. Click "Settings" tab
3. Click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `EXPO_TOKEN` (EXACTLY this name, all caps)
6. Value: Paste your Expo token
7. Click "Add secret"

**Step 3: Push the Workflow File**

The workflow file is already created at `.github/workflows/build-apk.yml`

Commit and push it to GitHub:
```bash
git add .github/workflows/build-apk.yml
git commit -m "Add APK build workflow"
git push origin main
```

### Using GitHub Actions:

**Option A: Automatic Build (when you push code)**
```bash
git add .
git commit -m "Your changes"
git push origin main
```
Build starts automatically! 🎉

**Option B: Manual Trigger**
1. Go to https://github.com/YOUR_USERNAME/YOUR_REPO/actions
2. Click "Build AnjaarFinance APK"
3. Click "Run workflow"
4. Select branch: "main"
5. Click "Run workflow" button

### Download APK:

1. Wait for GitHub Action to complete (shows green checkmark)
2. Go to https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
3. Wait 15-20 minutes for build to finish
4. Click "Download" button
5. Transfer to phone and install

---

## 🛠️ Method 3: Manual EAS Build

**For developers who prefer full control.**

### Prerequisites:
```bash
npm install -g eas-cli
```

### Steps:

**1. Navigate to frontend directory:**
```bash
cd /app/frontend
```

**2. Login to Expo:**
```bash
eas login
```
- Username: `ankeshostwal`
- Password: [your Expo password]

**3. Build APK:**
```bash
eas build --platform android --profile preview
```

**4. Wait and download:**
- Build takes 15-20 minutes
- You'll get a download link
- Download APK from the link

---

## 📱 Installing APK on Android Phone

Once you have the APK file:

### Step 1: Enable Unknown Sources
1. Open **Settings** on your Android phone
2. Go to **Security** or **Privacy**
3. Find **"Install Unknown Apps"** or **"Unknown Sources"**
4. Select your browser or file manager
5. Toggle **Allow** or **Enable**

### Step 2: Transfer APK to Phone

**Option A - Direct Download:**
- Open the Expo build link on your phone's browser
- Download directly

**Option B - USB Cable:**
- Connect phone to computer
- Copy APK to Downloads folder

**Option C - Cloud Storage:**
- Upload APK to Google Drive
- Download on phone from Drive app

### Step 3: Install
1. Open the APK file on your phone
2. Tap **"Install"**
3. Wait for installation to complete
4. Tap **"Open"** to launch AnjaarFinance

---

## 📊 Build Configuration

Your app is configured with these settings:

**App Details:**
- **Name:** AnjaarFinance
- **Package:** com.anjaarfinance.app
- **Version:** 1.0.0
- **Owner:** ankeshostwal

**Build Profile (preview):**
- **Type:** APK (not AAB)
- **Distribution:** Internal
- **Node Version:** 22.11.0

**Build Profile (production):**
- **Type:** APK
- **Node Version:** 22.11.0

You can modify these in `frontend/eas.json` if needed.

---

## 🐛 Troubleshooting

### Build Fails with "npm not found" or "package-lock.json not found"
**Solution:** This project uses Yarn, not npm. The build scripts are already configured correctly. If you see this error:
- Make sure you're using the latest workflow file
- The workflow uses `yarn install --frozen-lockfile`
- Check that `yarn.lock` exists in the frontend folder

### EXPO_TOKEN error in GitHub Actions
**Solution:**
- Verify the secret name is exactly `EXPO_TOKEN` (all caps)
- Check the token hasn't expired
- Generate a new token and update the secret

### Build stuck in queue
**Solution:**
- This is normal during busy times
- Wait 5-15 minutes
- Build will proceed automatically

### Can't install APK on phone
**Solution:**
- Ensure "Unknown Sources" is enabled
- Check Android version (minimum 6.0 required)
- Verify APK downloaded completely (not corrupted)
- Try re-downloading the APK

### Login issues with Expo
**Solution:**
- Verify username is: `ankeshostwal`
- Check your password
- Try resetting password at: https://expo.dev/forgot-password

### "Android SDK not found" (Local Build)
**Solution:**
- Use Cloud Build (option 1 in script) instead
- Cloud build doesn't require Android SDK
- Android SDK only needed for option 2 (local build)

---

## 🎯 Recommended Build Method

**For most users:** Use **Method 1** (Local Build Script with Cloud Build option)

**Why?**
- ✅ Easiest to use
- ✅ No complex setup
- ✅ Automated checks
- ✅ Clear instructions
- ✅ No Android SDK needed
- ✅ Reliable results

**For automation:** Use **Method 2** (GitHub Actions)

**Why?**
- ✅ Automatic builds on code push
- ✅ No manual intervention
- ✅ Perfect for ongoing development

---

## 📞 Need Help?

If you encounter any issues:

1. **Check the build logs:**
   - GitHub Actions: Check the workflow logs
   - Expo: Check build logs in Expo dashboard

2. **Common URLs:**
   - Expo Builds: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
   - GitHub Actions: https://github.com/YOUR_USERNAME/YOUR_REPO/actions
   - Expo Tokens: https://expo.dev/accounts/ankeshostwal/settings/access-tokens

3. **Verify configuration:**
   - Check `frontend/eas.json` is correct
   - Verify `frontend/app.json` has correct settings
   - Ensure `yarn.lock` exists

---

## 🎉 What's Next?

After installing the APK:

1. ✅ Open AnjaarFinance on your phone
2. ✅ The app shows sample data automatically
3. ✅ Test all features (contracts, search, filter, details)
4. ✅ When ready, use the SQL converter to import your real data

---

## 📝 Build Files Reference

**Important files for building:**
- `frontend/eas.json` - EAS build configuration
- `frontend/app.json` - App metadata
- `frontend/package.json` - Dependencies
- `.github/workflows/build-apk.yml` - GitHub Actions workflow
- `LOCAL_BUILD_APK.sh` - Local build script

---

Your AnjaarFinance APK is ready to build! Choose your preferred method and get started. 🚀
