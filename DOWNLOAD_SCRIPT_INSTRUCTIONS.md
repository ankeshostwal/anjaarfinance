# How to Download and Run the Automated Build Script

## Option 1: Download from GitHub (Easiest)

1. **Go to your GitHub repository:**
   https://github.com/ankeshostwal/anjaarfinance

2. **Find the file:** `BUILD_APK_AUTOMATICALLY.bat`

3. **Click on the file** to open it

4. **Click "Download" or "Raw" button**

5. **Save it to your Desktop**

6. **Double-click the file** to run it

---

## Option 2: Create the File Manually

1. **Open Notepad** (search for "Notepad" in Windows Start menu)

2. **Copy the script from GitHub:**
   - Go to: https://github.com/ankeshostwal/anjaarfinance/blob/main/BUILD_APK_AUTOMATICALLY.bat
   - Copy all the text

3. **Paste into Notepad**

4. **Save as:**
   - Click File → Save As
   - Name: `BUILD_APK.bat`
   - Save type: All Files (*)
   - Location: Desktop
   - Click Save

5. **Go to Desktop and double-click** `BUILD_APK.bat`

---

## What Happens When You Run It?

1. Script checks if Node.js is installed ✅
2. Script installs EAS CLI if needed ✅
3. Script downloads your project from GitHub ✅
4. Script installs dependencies ✅
5. **Script asks you to login to Expo** ⬅️ (YOU DO THIS - 2 minutes)
6. Script builds your APK ✅
7. Script gives you download link ✅

---

## The ONLY Thing You Need to Do:

### When the script asks for Expo login:

**If you don't have an Expo account yet:**
1. Open browser
2. Go to: https://expo.dev/signup
3. Create account (takes 2 minutes)
4. Remember your username and password
5. Return to the script and login

**If you already have an Expo account:**
1. Just enter your username and password when asked
2. Done!

---

## Timeline:

| Step | Time | Who Does It |
|------|------|-------------|
| Run script | 1 second | YOU (double-click) |
| Script checks prerequisites | 10 seconds | AUTOMATIC |
| Script downloads project | 1 minute | AUTOMATIC |
| Script installs dependencies | 2 minutes | AUTOMATIC |
| Create/Login to Expo | 2 minutes | YOU |
| Script starts build | 1 minute | AUTOMATIC |
| Expo builds APK | 15-20 minutes | AUTOMATIC |
| Download APK | 1 minute | YOU |
| **TOTAL** | **~25 minutes** | **Mostly automatic!** |

---

## After the Script Finishes:

You'll get a link like:
```
https://expo.dev/accounts/YOUR_USERNAME/projects/anjaarfinance/builds
```

1. Open that link in browser
2. Wait for build to show "Finished" (15-20 min)
3. Click "Download" button
4. Install on your Android phone

---

## For Future Builds:

Just double-click the script again! It will:
- Skip installation steps (already installed)
- Update your project
- Build a new APK
- Takes only ~5 minutes to start (not counting build time)

---

## Need Help?

If the script shows any errors, take a screenshot and share it with me!
