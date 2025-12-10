# How to Install EAS CLI - Step by Step

## Step 1: Open Command Prompt / Terminal

### On Windows:
1. Press the **Windows key** on your keyboard (or click Start button)
2. Type: **cmd**
3. Press **Enter**
4. A black window will open - this is Command Prompt

### On Mac:
1. Press **Command + Space** (to open Spotlight)
2. Type: **terminal**
3. Press **Enter**
4. A white/black window will open - this is Terminal

### On Linux:
1. Press **Ctrl + Alt + T**
2. Terminal will open

---

## Step 2: Type the Installation Command

In the Command Prompt/Terminal window that just opened, **type this exactly:**

```
npm install -g eas-cli
```

**Important:** 
- Type it exactly as shown
- Don't add any extra spaces
- Don't change anything

---

## Step 3: Press Enter

After typing the command, press the **Enter** key on your keyboard.

---

## Step 4: Wait for Installation

You will see text scrolling on the screen. This is normal! It means it's installing.

**What you'll see:**
- Lines of text appearing
- Progress indicators
- Package names being installed
- This takes 1-2 minutes

**DO NOT CLOSE THE WINDOW** - wait until you see a command prompt again (a blinking cursor).

---

## Step 5: Verify Installation

When the installation is complete, type this command to verify:

```
eas --version
```

Press Enter.

**If you see a version number** (like `5.x.x`) = ✅ Success! EAS CLI is installed!

**If you see an error** = Installation didn't work. Let me know what error you see.

---

## Full Example of What You'll Do:

```
C:\Users\YourName> npm install -g eas-cli
[... lots of text appearing ...]
[... wait 1-2 minutes ...]

C:\Users\YourName> eas --version
5.9.3

C:\Users\YourName> 
```

---

## Common Issues and Solutions

### Issue 1: "npm is not recognized"
**Solution:** Node.js is not installed correctly. Restart your computer and try again.

### Issue 2: "Permission denied" or "EACCES" error
**Solution:** On Windows, close Command Prompt and open it as Administrator:
1. Press Windows key
2. Type: **cmd**
3. **Right-click** on Command Prompt
4. Select **"Run as administrator"**
5. Try the command again

On Mac/Linux, use:
```
sudo npm install -g eas-cli
```
(It will ask for your computer password)

### Issue 3: Installation is very slow
**Solution:** This is normal! It can take 2-5 minutes depending on your internet speed. Just wait.

---

## After Installation is Complete

Once you see the version number, you're ready to continue with the APK build!

**Next command to run:**
```
cd Desktop
```
(This moves to your Desktop folder)

Then:
```
git clone https://github.com/ankeshostwal/anjaarfinance.git
```
(This downloads the project)

---

## Need More Help?

If you get stuck:
1. Take a screenshot of what you see
2. Tell me exactly which step you're on
3. Copy and paste any error messages

I'm here to help! 🚀
