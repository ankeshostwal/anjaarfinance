# GitHub Actions - Automated APK Build Setup

## Overview

This setup will automatically build your APK whenever you push code to GitHub. No manual building needed!

---

## Step 1: Get Your Expo Access Token

You need an Expo token so GitHub can build on your behalf.

### Get Token from Expo Website:

1. **Login to Expo:**
   - Go to: https://expo.dev/
   - Login with username: **ankeshostwal**

2. **Go to Access Tokens:**
   - Click your profile (top right)
   - Click **"Access Tokens"** or go to: https://expo.dev/accounts/ankeshostwal/settings/access-tokens

3. **Create New Token:**
   - Click **"Create Token"** button
   - Name it: **"GitHub Actions"** (or any name you like)
   - Click **"Create"**

4. **Copy Token:**
   - You'll see a long token like: `expo_abc123...xyz789`
   - **COPY IT IMMEDIATELY** - you won't see it again!
   - Save it somewhere safe temporarily

### OR Get Token via Command Line:

If you have EAS CLI installed:

```bash
eas login
eas whoami --json
```

Copy the token from the output.

---

## Step 2: Add Token to GitHub Secrets

Now add this token to your GitHub repository:

1. **Go to Your GitHub Repo:**
   - Visit: https://github.com/ankeshostwal/anjaarfinance

2. **Open Settings:**
   - Click **"Settings"** tab (at the top)

3. **Go to Secrets:**
   - Click **"Secrets and variables"** in left sidebar
   - Click **"Actions"**

4. **Add New Secret:**
   - Click **"New repository secret"** button
   - Name: `EXPO_TOKEN` (EXACTLY this name, all caps)
   - Value: Paste your Expo token here
   - Click **"Add secret"**

**Important:** The name MUST be `EXPO_TOKEN` exactly!

---

## Step 3: Push GitHub Actions Workflow

The workflow file is already created at: `.github/workflows/build-apk.yml`

Now push it to GitHub:

1. **Click "Save to GitHub"** button on this page
2. Wait for confirmation
3. GitHub Actions is now set up!

---

## Step 4: Trigger Your First Build

You have 3 ways to trigger a build:

### Option A: Push Code (Automatic)

Whenever you push code to the `main` branch, build starts automatically:

```bash
git add .
git commit -m "Update code"
git push origin main
```

Build starts automatically! 🎉

### Option B: Manual Trigger (From GitHub)

1. Go to: https://github.com/ankeshostwal/anjaarfinance/actions
2. Click **"Build AnjaarFinance APK"** workflow
3. Click **"Run workflow"** button (right side)
4. Select branch: **main**
5. Click green **"Run workflow"** button

Build starts manually! 🎉

### Option C: Using GitHub CLI

If you have GitHub CLI installed:

```bash
gh workflow run "Build AnjaarFinance APK"
```

---

## Step 5: Monitor Build Progress

### Watch Build in Real-Time:

1. Go to: https://github.com/ankeshostwal/anjaarfinance/actions
2. Click on the latest workflow run
3. You'll see:
   - 🟡 **Yellow dot** = Build in progress
   - ✅ **Green checkmark** = Build submitted successfully
   - ❌ **Red X** = Build failed (check logs)

### The workflow will:

- ✅ Checkout your code
- ✅ Setup Node.js
- ✅ Setup Expo and EAS
- ✅ Install dependencies
- ✅ Submit build to Expo servers
- ✅ Give you the Expo dashboard link

**Note:** GitHub Actions only SUBMITS the build. The actual building happens on Expo servers (15-20 minutes).

---

## Step 6: Download APK

After GitHub Actions completes:

1. **Go to Expo Dashboard:**
   - Visit: https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds

2. **Wait for Build:**
   - Build takes 15-20 minutes on Expo servers
   - You'll see: Queue → In Progress → Finished

3. **Download APK:**
   - Click **"Download"** button
   - APK file downloads: `anjaarfinance-xxxxx.apk`

4. **Install on Phone:**
   - Transfer to Android phone
   - Enable "Install Unknown Apps"
   - Tap APK → Install

---

## How It Works

```
You Push Code → GitHub Actions Triggers → Submits to Expo → Expo Builds APK → You Download
```

**Automatic:** Every code push builds new APK!

---

## Benefits of GitHub Actions

✅ **Automatic builds** - No manual work  
✅ **Always latest code** - Builds from GitHub  
✅ **Free for public repos** - No cost  
✅ **Build logs** - See what happened  
✅ **Multiple triggers** - Push or manual  
✅ **No local setup** - Works from anywhere  

---

## Troubleshooting

### Error: "EXPO_TOKEN secret not found"

**Solution:**
- Check secret name is exactly: `EXPO_TOKEN` (all caps)
- Verify token is added to repository secrets
- Re-add the token if needed

### Error: "Authentication failed"

**Solution:**
- Token might be expired or invalid
- Generate new token from Expo dashboard
- Update GitHub secret with new token

### Error: "eas command not found"

**Solution:**
- This shouldn't happen with the workflow
- The workflow installs EAS CLI automatically
- Check workflow file is correct

### Build Stuck in Queue on Expo

**Solution:**
- This is normal during busy times
- Wait 5-15 minutes
- Build will proceed automatically

### GitHub Actions Shows Green but No APK

**Solution:**
- GitHub Actions only SUBMITS the build
- Actual build happens on Expo servers (15-20 min)
- Check Expo dashboard for APK download

---

## Workflow Customization

### Build on Different Branch:

Edit `.github/workflows/build-apk.yml`:

```yaml
on:
  push:
    branches:
      - main
      - development  # Add more branches
```

### Build on Tag/Release:

```yaml
on:
  push:
    tags:
      - 'v*'  # Triggers on version tags like v1.0.0
```

### Schedule Automatic Builds:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Every Sunday at midnight
```

---

## Advanced: Build Profiles

In `eas.json`, you have profiles:

- **preview** - APK for testing (current setup)
- **production** - AAB for Play Store

To build for production:

Change workflow line:
```yaml
run: eas build --platform android --profile production --non-interactive --no-wait
```

---

## Cost

**GitHub Actions:**
- ✅ FREE for public repositories
- ✅ 2,000 minutes/month for private repos

**Expo EAS Build:**
- ✅ FREE tier: Limited builds per month
- Check: https://expo.dev/accounts/ankeshostwal/settings/billing

---

## Summary

**Setup Once:**
1. ✅ Get Expo token
2. ✅ Add to GitHub secrets as `EXPO_TOKEN`
3. ✅ Push workflow file

**Use Forever:**
- Push code → APK builds automatically! 🎉
- Or trigger manually from GitHub Actions tab
- Download from Expo dashboard

---

## Quick Reference

**Expo Token:** https://expo.dev/accounts/ankeshostwal/settings/access-tokens  
**GitHub Secrets:** https://github.com/ankeshostwal/settings/secrets  
**Actions Tab:** https://github.com/ankeshostwal/anjaarfinance/actions  
**Expo Builds:** https://expo.dev/accounts/ankeshostwal/projects/anjaarfinance/builds  

---

**Questions?**

If you face issues:
1. Check workflow logs in GitHub Actions tab
2. Check Expo build logs in Expo dashboard
3. Verify token is correct and not expired

---

Your APK will now build automatically whenever you push code! 🚀
