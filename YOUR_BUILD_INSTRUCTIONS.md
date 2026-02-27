# 🎯 Your Step-by-Step Build Instructions

## Prerequisites (Install These First)

### 1. Install Node.js
- Download from: https://nodejs.org/
- Choose the LTS (Long Term Support) version
- Install and verify: Open terminal and type `node -v`

### 2. Install EAS CLI
Open your terminal/command prompt and run:
```bash
npm install -g eas-cli
```

---

## Option A: Build from Your Local Computer (If You Have the Project Files)

### Step 1: Open Terminal/Command Prompt

**On Windows:**
- Press `Win + R`, type `cmd`, press Enter
- Or use Git Bash if you have it

**On Mac/Linux:**
- Open Terminal app

### Step 2: Navigate to the Frontend Folder

```bash
cd path/to/your/project/frontend
```

Replace `path/to/your/project` with the actual location where you have the AnjaarFinance project.

### Step 3: Run the Build Script

```bash
bash ../LOCAL_BUILD_APK.sh
```

### Step 4: Follow the Prompts

The script will:
1. ✅ Check if Node.js is installed
2. ✅ Check/install Yarn if needed
3. ✅ Install project dependencies
4. ✅ Check/install EAS CLI
5. ✅ Ask you to login to Expo
6. ✅ Give you build options (choose option 1 - Cloud Build)

### Step 5: Login When Prompted

- **Username:** `ankeshostwal`
- **Password:** Your Expo account password

### Step 6: Choose Cloud Build (Option 1)

Press `1` and then Enter.

### Step 7: Wait and Get Your APK

The script will give you a link like:
```
https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
```

Go to this link and wait 15-20 minutes for your APK to be ready.

---

## Option B: Build Directly (If Script Doesn't Work)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
- Username: `ankeshostwal`
- Password: [your password]

### Step 3: Navigate to Frontend
```bash
cd path/to/your/project/frontend
```

### Step 4: Install Dependencies
```bash
yarn install
```

### Step 5: Start Build
```bash
eas build --platform android --profile preview
```

### Step 6: Wait for Build
- Build takes 15-20 minutes
- You'll get a download link when ready
- Or check: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds

---

## Option C: I Don't Have the Project on My Computer

### You Need to Download the Project First

**Method 1: From GitHub (if you pushed it there)**
```bash
git clone YOUR_GITHUB_REPO_URL
cd anjaarfinance/frontend
```

**Method 2: Download Zip**
- If you have the project as a zip file, extract it
- Navigate to the `frontend` folder
- Then follow Option A or B above

---

## After Build Completes

### Step 1: Download APK
1. Go to: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
2. Find your latest build
3. Click "Download" button
4. Save the APK file (e.g., `anjaarfinance-xxxxx.apk`)

### Step 2: Transfer to Your Phone

**Option 1: Direct Download**
- Open the Expo build link on your phone's browser
- Download directly

**Option 2: USB Cable**
- Connect phone to computer
- Copy APK to phone's Downloads folder

**Option 3: Cloud Storage**
- Upload APK to Google Drive
- Download on phone from Drive app

### Step 3: Enable Installation from Unknown Sources

On your Android phone:
1. Go to **Settings**
2. Go to **Security** or **Privacy**
3. Find **"Install Unknown Apps"**
4. Select your browser or file manager
5. Toggle **Allow** to ON

### Step 4: Install APK

1. Open the APK file on your phone
2. Tap **"Install"**
3. Wait for installation
4. Tap **"Open"** to launch AnjaarFinance

---

## 🆘 Troubleshooting

### "Node.js not installed"
**Fix:** Download and install from https://nodejs.org/

### "eas command not found"
**Fix:** Run `npm install -g eas-cli`

### "Authentication failed"
**Fix:** Check your Expo username and password
- Username must be: `ankeshostwal`
- Reset password if needed at: https://expo.dev/forgot-password

### "Can't find project files"
**Fix:** Make sure you're in the `frontend` folder where `app.json` exists

### "Build failed"
**Fix:** 
1. Check internet connection
2. Try again (sometimes Expo servers are busy)
3. Check build logs on Expo dashboard for specific error

---

## Quick Commands Reference

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to project (replace with your path)
cd path/to/anjaarfinance/frontend

# Install dependencies
yarn install

# Build APK
eas build --platform android --profile preview

# Check who you're logged in as
eas whoami
```

---

## Important Links

- **Expo Dashboard:** https://expo.dev/
- **Your Builds:** https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
- **Expo Login:** https://expo.dev/login
- **Reset Password:** https://expo.dev/forgot-password
- **Node.js Download:** https://nodejs.org/

---

## What to Expect

**Timeline:**
1. ⏱️ Script setup: 2-3 minutes
2. ⏱️ Login: 1 minute
3. ⏱️ Build submission: 2-3 minutes
4. ⏱️ Build on Expo servers: 15-20 minutes
5. ⏱️ Download and install: 2-3 minutes

**Total time:** About 25-30 minutes from start to installed app!

---

## Need Help?

If you get stuck at any step, let me know:
- Which step you're on
- What error message you see
- Screenshot if possible

I'm here to help! 🚀
