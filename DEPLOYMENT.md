# Deployment Guide

This guide will help you deploy the Bouldering Competition Website to various hosting platforms.

## Table of Contents
- [Vercel (Recommended)](#vercel)
- [Netlify](#netlify)
- [Firebase Hosting](#firebase-hosting)
- [GitHub Pages](#github-pages)

---

## Vercel

Vercel is the recommended platform for deploying this React application.

### Prerequisites
- GitHub account
- Vercel account (free tier available)

### Steps

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/bouldering-competition.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Add Environment Variables**
   - In Vercel dashboard, go to: Settings > Environment Variables
   - Add all variables from your `.env` file:
     ```
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_AUTH_DOMAIN
     VITE_FIREBASE_DATABASE_URL
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_STORAGE_BUCKET
     VITE_FIREBASE_MESSAGING_SENDER_ID
     VITE_FIREBASE_APP_ID
     VITE_FIREBASE_MEASUREMENT_ID
     ```

4. **Deploy**
   - Click "Deploy"
   - Your site will be live in minutes!

### Custom Domain (Optional)
- Go to Settings > Domains
- Add your custom domain
- Follow DNS configuration instructions

---

## Netlify

### Steps

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `dist` folder to Netlify

   OR use the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

3. **Configure Environment Variables**
   - Go to: Site settings > Environment variables
   - Add all `VITE_*` variables

4. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

---

## Firebase Hosting

Since you're already using Firebase for the database, hosting on Firebase makes sense!

### Steps

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   
   Configuration:
   - Use existing project: Select your `bouldering-4d840` project
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub auto-deploys: Optional

4. **Build your project**
   ```bash
   npm run build
   ```

5. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

6. **Environment Variables**
   - Create `.env.production` file with your variables
   - Or use Firebase Environment Config

Your site will be live at: `https://bouldering-4d840.web.app`

---

## GitHub Pages

### Steps

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "homepage": "https://yourusername.github.io/bouldering-competition",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Update vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/bouldering-competition/',
     // ... rest of config
   })
   ```

4. **Deploy**
   ```bash
   npm run deploy
   ```

5. **Configure GitHub Pages**
   - Go to repository Settings > Pages
   - Source: Deploy from branch
   - Branch: `gh-pages`
   - Folder: `/ (root)`

**Note:** Environment variables won't work on GitHub Pages in the same way. You'll need to hardcode Firebase credentials (use a separate Firebase project for security).

---

## Post-Deployment Checklist

- [ ] Test all features (registration, scoring, ranking)
- [ ] Verify Firebase connection works
- [ ] Test on mobile devices
- [ ] Check all routes work correctly
- [ ] Test real-time data synchronization
- [ ] Verify environment variables are loading
- [ ] Configure Firebase Security Rules (see below)

---

## Firebase Security Rules

After deployment, update your Firebase Realtime Database rules for security:

```json
{
  "rules": {
    "students": {
      ".read": true,
      ".write": true,
      "$studentId": {
        ".validate": "newData.hasChildren(['id', 'name', 'school', 'class', 'age'])"
      }
    },
    "scores": {
      ".read": true,
      ".write": true,
      "$scoreId": {
        ".validate": "newData.hasChildren(['id', 'round', 'boulder', 'at', 'az'])"
      }
    }
  }
}
```

**For production**, add authentication and more restrictive rules!

---

## Troubleshooting

### Build Fails
- Check Node.js version (v16+)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for missing environment variables

### Firebase Connection Issues
- Verify all environment variables are set correctly
- Check Firebase project is active
- Verify database URL is correct

### Routes Not Working
- Ensure your hosting platform is configured for SPA
- Check that all routes redirect to `index.html`

---

## Support

For deployment issues:
1. Check the platform-specific documentation
2. Review the logs in your hosting dashboard
3. Open an issue on GitHub

Happy deploying! 🚀
