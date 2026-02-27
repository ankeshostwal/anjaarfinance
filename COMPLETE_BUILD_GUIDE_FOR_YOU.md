# 🚀 Complete APK Build Guide - From GitHub to APK

## Your GitHub Repository
https://github.com/ankeshostwal/anjaarfinance

---

## 📥 PART 1: Download Project from GitHub

### Method A: Using Git (Recommended if you have Git installed)

**Step 1: Open Terminal/Command Prompt**
- Windows: Press `Win + R`, type `cmd`, press Enter
- Mac: Open Terminal app
- Linux: Open Terminal

**Step 2: Navigate to where you want the project**
```bash
cd Desktop
```
(Or any folder you prefer)

**Step 3: Clone the repository**
```bash
git clone https://github.com/ankeshostwal/anjaarfinance.git
```

**Step 4: Enter the project**
```bash
cd anjaarfinance
```

✅ **Done!** You now have the project on your computer.

---

### Method B: Download as ZIP (If you don't have Git)

**Step 1: Download**
1. Go to: https://github.com/ankeshostwal/anjaarfinance
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. Save the ZIP file

**Step 2: Extract**
1. Find the downloaded ZIP file (usually in Downloads folder)
2. Right-click → **"Extract All"** or **"Unzip"**
3. Choose where to extract (e.g., Desktop)

**Step 3: Open Terminal/Command Prompt**
Navigate to the extracted folder:
```bash
cd Desktop/anjaarfinance-main
```
(The folder name might be `anjaarfinance-main` if downloaded as ZIP)

✅ **Done!** You now have the project on your computer.

---

## 🛠️ PART 2: Install Required Software

### Step 1: Install Node.js

**Download:**
- Go to: https://nodejs.org/
- Download the **LTS version** (recommended)
- Install it (use default settings)

**Verify installation:**
Open a new terminal and type:
```bash
node -v
```
You should see a version number like `v22.x.x`

### Step 2: Install EAS CLI

In your terminal, run:
```bash
npm install -g eas-cli
```

**Verify installation:**
```bash
eas --version
```
You should see a version number.

---

## 🏗️ PART 3: Build Your APK

### Step 1: Navigate to Frontend Folder

Make sure you're in the project directory:
```bash
cd path/to/anjaarfinance/frontend
```

For example, if you cloned to Desktop:
```bash
cd Desktop/anjaarfinance/frontend
```

### Step 2: Install Project Dependencies

```bash
npm install -g yarn
yarn install
```

This will take 2-3 minutes. Wait for it to complete.

### Step 3: Login to Expo

```bash
eas login
```

When prompted:
- **Username:** `ankeshostwal`
- **Password:** [Your Expo account password]

**Don't have an Expo account?**
Create one at: https://expo.dev/signup (use username: ankeshostwal)

### Step 4: Build the APK

```bash
eas build --platform android --profile preview
```

**What happens next:**
1. ⏱️ It will upload your project to Expo servers (2-3 minutes)
2. ⏱️ Expo will build your APK (15-20 minutes)
3. ✅ You'll get a download link when ready

**Example output:**
```
✔ Build started, it may take a few minutes to complete.
✔ You can monitor the build at:
  https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds/xxxxx
```

### Step 5: Monitor Your Build

Go to: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds

You'll see your build with status:
- 🟡 **In Queue** → Waiting to start
- 🔵 **In Progress** → Building now
- 🟢 **Finished** → Ready to download!
- 🔴 **Failed** → Something went wrong (let me know if this happens)

---

## 📲 PART 4: Download and Install APK

### Step 1: Download APK

1. Go to: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
2. Wait for build status to show **"Finished"** (15-20 minutes)
3. Click the **"Download"** button
4. Save the APK file (e.g., `anjaarfinance-xxxxx.apk`)

### Step 2: Transfer to Your Android Phone

**Option A: Direct Download on Phone**
- Open the Expo build link on your phone's browser
- Download directly to phone

**Option B: USB Cable**
- Connect phone to computer
- Copy APK to phone's Downloads folder

**Option C: Google Drive**
- Upload APK to Google Drive from computer
- Download on phone from Drive app

### Step 3: Enable Installation from Unknown Sources

On your Android phone:
1. Open **Settings**
2. Go to **Security** or **Privacy & Security**
3. Find **"Install unknown apps"** or **"Unknown sources"**
4. Select your browser or file manager
5. Toggle **Allow** to ON

### Step 4: Install the APK

1. Open the APK file on your phone (from Downloads or wherever you saved it)
2. Tap **"Install"**
3. Wait for installation to complete
4. Tap **"Open"** to launch AnjaarFinance!

---

## 🎉 Complete Command Summary

Here's everything in order:

```bash
# 1. Download project
git clone https://github.com/ankeshostwal/anjaarfinance.git
cd anjaarfinance/frontend

# 2. Install EAS CLI (one time only)
npm install -g eas-cli

# 3. Install dependencies
npm install -g yarn
yarn install

# 4. Login to Expo
eas login

# 5. Build APK
eas build --platform android --profile preview
```

Then wait and download from: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Download project from GitHub | 2 min |
| Install Node.js & EAS CLI | 5 min |
| Install project dependencies | 3 min |
| Login and start build | 2 min |
| Wait for Expo to build APK | 15-20 min |
| Download and install | 3 min |
| **TOTAL** | **~30-35 min** |

---

## 🆘 Troubleshooting

### "git command not found"
**Fix:** Use Method B (Download ZIP) instead, or install Git from https://git-scm.com/

### "node command not found"
**Fix:** Install Node.js from https://nodejs.org/ and restart terminal

### "eas command not found"
**Fix:** Run `npm install -g eas-cli` and restart terminal

### "Authentication failed" when logging into Expo
**Fix:** 
- Make sure username is exactly: `ankeshostwal`
- Check your password
- Create account at https://expo.dev/signup if you don't have one

### "Build failed" on Expo
**Fix:**
1. Check the error message in Expo dashboard
2. Try building again (sometimes it's just server issues)
3. Share the error message with me

### "Can't install APK on phone"
**Fix:**
- Make sure "Unknown sources" is enabled
- Check that your phone is Android 6.0 or higher
- Try re-downloading the APK

---

## 📞 Important Links

- **Your GitHub:** https://github.com/ankeshostwal/anjaarfinance
- **Expo Builds:** https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds
- **Expo Login:** https://expo.dev/login
- **Expo Signup:** https://expo.dev/signup
- **Node.js Download:** https://nodejs.org/
- **Git Download:** https://git-scm.com/

---

## ✅ Checklist

Use this to track your progress:

- [ ] Downloaded/cloned project from GitHub
- [ ] Installed Node.js
- [ ] Installed EAS CLI
- [ ] Navigated to `anjaarfinance/frontend` folder
- [ ] Ran `yarn install`
- [ ] Logged into Expo with `eas login`
- [ ] Started build with `eas build --platform android --profile preview`
- [ ] Waiting for build to complete
- [ ] Downloaded APK from Expo dashboard
- [ ] Transferred APK to Android phone
- [ ] Enabled "Unknown sources" on phone
- [ ] Installed APK
- [ ] Opened AnjaarFinance app

---

## 💡 Pro Tips

1. **Keep terminal open** while building - don't close it
2. **Use the same terminal** for all commands
3. **Check Expo dashboard** for build progress
4. **Be patient** - first build takes 15-20 minutes
5. **Save your Expo password** - you'll need it for future builds

---

## 🚀 Ready to Start?

**Right now, do this:**

1. Open Terminal/Command Prompt
2. Run these commands one by one:

```bash
cd Desktop
git clone https://github.com/ankeshostwal/anjaarfinance.git
cd anjaarfinance/frontend
```

Then tell me when you're done, and I'll guide you through the next steps!

---

**Need help at any step?** Just tell me:
- Which step you're on
- What command you ran
- What error/message you see
