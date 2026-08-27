# 🚀 Quick Start Guide

Get your bouldering competition website running in 5 minutes!

## Prerequisites Check

Before starting, make sure you have:
- ✅ Node.js v16 or higher ([Download here](https://nodejs.org/))
- ✅ Git ([Download here](https://git-scm.com/))
- ✅ A Firebase account ([Sign up here](https://firebase.google.com/))

Check your versions:
```bash
node --version  # Should be v16+
npm --version   # Should be 8+
git --version
```

---

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/bouldering-competition.git
cd bouldering-competition

# Install dependencies
npm install
```

---

## Step 2: Firebase Setup (2 minutes)

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it (e.g., "My Bouldering Competition")
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Enable Realtime Database

1. In Firebase Console, click **"Realtime Database"**
2. Click **"Create Database"**
3. Choose location (closest to you)
4. Start in **"Test mode"** (for now)
5. Click **"Enable"**

### Get Configuration

1. Click the ⚙️ gear icon → **Project settings**
2. Scroll to **"Your apps"**
3. Click the **</>** (web) icon
4. Register your app with a nickname
5. Copy the `firebaseConfig` values

---

## Step 3: Environment Setup (1 minute)

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and paste your Firebase values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-app-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-ABC123
```

---

## Step 4: Launch! 🎉

```bash
npm run dev
```

Open your browser to **http://localhost:5173**

You should see the Bouldering Competition homepage!

---

## Quick Test

### Test Student Registration
1. Click **"Student Registration"**
2. Fill in a test student:
   - Name: Test Climber
   - School: Test School
   - Class: 5A
   - Age: 16
3. Click **"Register Student"**
4. Student should appear in the table

### Test Judge Scoring
1. Click **"Back"** → **"Judge Scoring"**
2. Select your test student
3. Select Round: Qualifier
4. Boulder: 1
5. Click: **Fall** → **Zone** → **Top**
6. Click **"Save Score"**
7. Score should appear in the table

### Test Rankings
1. Click **"Back"** → **"Ranking"**
2. Your test student should appear with their score!

---

## Common Issues

### Port already in use
```bash
# Kill the process on port 5173
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### Firebase connection error
- Check your `.env` file has all values
- Verify DATABASE_URL ends with your region (e.g., `firebasedatabase.app`)
- Check Firebase Console → Database is enabled

### Module not found errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Changes not appearing
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Check browser console for errors (F12)

---

## Next Steps

✅ **You're all set!** Your competition website is running.

### For Development
- Read the full [README.md](README.md)
- Check [CONTRIBUTING.md](CONTRIBUTING.md) for coding guidelines
- Review [Firebase Security Rules](https://firebase.google.com/docs/rules)

### For Production
- Read [DEPLOYMENT.md](DEPLOYMENT.md)
- Add Firebase Authentication
- Configure proper security rules
- Deploy to Vercel/Netlify/Firebase Hosting

### Need Help?
- 📖 Check the [full documentation](README.md)
- 🐛 [Open an issue](https://github.com/yourusername/bouldering-competition/issues)
- 💬 Ask questions in Discussions

---

## Keyboard Shortcuts (Development)

- `Ctrl/Cmd + S` - Save (auto-reloads)
- `Ctrl/Cmd + Shift + R` - Hard refresh
- `F12` - Open developer tools

---

**Enjoy building your competition! 🧗‍♂️**
