# Deployment Guide - PolliWall

<!-- This file will be regenerated during Operation Bedrock Phase 1.2 -->
<!-- Agent: devops-engineer + technical-scribe -->

1. Go to your repository settings on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The deployment workflow will automatically run on pushes to `main`

### Deployment Workflow

The `.github/workflows/deploy.yml` workflow:
- Triggers on pushes to `main` branch
- Builds the production application with base href `/Xterm1/`
- Deploys to GitHub Pages
- URL: `https://cyberbassLord-666.github.io/Xterm1/`

### Manual Deployment

To manually trigger deployment:
1. Go to **Actions** tab in GitHub
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**

## 📦 Production Build

### Local Production Build

```bash
# Build for production
npm run build

# Output will be in dist/app/browser/
```

### Build Configuration

The production build includes:
- ✅ Code minification and optimization
- ✅ Tree shaking for smaller bundle size
- ✅ Service worker for PWA capabilities
- ✅ Lazy loading for optimal performance
- ✅ Asset optimization

### Build Output

```
dist/app/browser/
├── index.html          # Main HTML file
├── main-*.js          # Main application bundle
├── chunk-*.js         # Lazy-loaded chunks
├── styles-*.css       # Optimized styles
├── manifest.webmanifest # PWA manifest
└── ngsw-worker.js     # Service worker
```

## 🌐 Alternative Deployment Options

### Netlify

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/app/browser`
3. Deploy!

### Vercel

1. Import your GitHub repository to Vercel
2. Configure:
   - **Framework Preset**: Angular
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/app/browser`
3. Deploy!

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Configure:
# - Public directory: dist/app/browser
# - Single-page app: Yes
# - Automatic builds: Yes (optional)

# Build and deploy
npm run build
firebase deploy
```

### Static Server (Self-Hosted)

```bash
# Build the application
npm run build

# Serve with any static server
# Example with serve:
npx serve dist/app/browser -s

# Example with nginx:
# Copy dist/app/browser/* to /var/www/html/
```

## 🔧 Configuration for Different Base Paths

If deploying to a subdirectory, configure the base href:

```bash
# Build with custom base href
npm run build -- --base-href=/your-path/

# For GitHub Pages subdomain
npm run build -- --base-href=/repository-name/
```

## ⚙️ Environment Configuration

### API Keys

The application uses environment configuration for API keys:

1. **Development**: Configure in `src/environments/environment.ts`
2. **Production**: Configure in `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  geminiApiKey: 'YOUR_GEMINI_API_KEY' // Configure before deployment
};
```

⚠️ **Security Note**: Never commit API keys to version control. Use GitHub Secrets or environment variables for production.

### Using GitHub Secrets

For GitHub Pages deployment with API keys:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets:
   - `GEMINI_API_KEY`: Your Gemini API key
3. Update workflow to inject secrets during build

## 🔍 Post-Deployment Verification

After deployment, verify:

### ✅ Functionality Checklist
- [ ] Application loads without errors
- [ ] Navigation works correctly
- [ ] Theme toggle functions
- [ ] API integrations work (if configured)
- [ ] Service worker registers (PWA)
- [ ] Lazy-loaded routes work
- [ ] Mobile responsive design
- [ ] Accessibility features active

### 🎯 Performance Verification

Check performance metrics:
```bash
# Run Lighthouse audit
npx lighthouse https://your-deployment-url.com --view
```

Expected scores:
- **Performance**: 90+
- **Accessibility**: 90+
- **Best Practices**: 90+
- **SEO**: 90+

## 🐛 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
rm -rf .angular/
```

### 404 Errors on Refresh

For static hosting (GitHub Pages, Netlify):
- Ensure SPA redirect is configured
- Check base href configuration
- Verify routing uses hash location strategy (already configured)

### Service Worker Issues

```bash
# Clear service worker cache
# In browser DevTools:
# Application → Service Workers → Unregister
# Application → Clear storage → Clear site data
```

### Large Bundle Size

The application is optimized but if you need smaller bundles:

1. Remove unused dependencies
2. Enable advanced optimization in angular.json
3. Use lazy loading for more routes
4. Consider code splitting strategies

## 📊 Monitoring

### Analytics Setup

The application includes analytics infrastructure:

1. Configure your analytics provider
2. Update `src/services/analytics.service.ts`
3. Add tracking ID to environment config

### Error Tracking

Consider integrating error tracking:
- Sentry
- LogRocket
- Rollbar

Update `src/services/error-handler.service.ts` to send errors to your service.

## 🔄 CI/CD Pipeline

The repository includes a complete CI/CD pipeline:

### Continuous Integration (`.github/workflows/ci.yml`)
- ✅ Linting
- ✅ Unit tests
- ✅ Build verification
- ✅ E2E tests
- ✅ Lighthouse audits

### Continuous Deployment (`.github/workflows/deploy.yml`)
- ✅ Automatic deployment on main branch
- ✅ Manual deployment trigger
- ✅ GitHub Pages integration

## 📝 Deployment Checklist

Before deploying to production:

### Pre-Deployment
- [ ] All tests passing
- [ ] Linting passes (0 errors)
- [ ] TypeScript compilation successful
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] API keys secured
- [ ] Documentation updated
- [ ] CHANGELOG updated

### Post-Deployment
- [ ] Verify application loads
- [ ] Test critical user flows
- [ ] Check console for errors
- [ ] Verify API integrations
- [ ] Test on multiple devices
- [ ] Run Lighthouse audit
- [ ] Verify analytics tracking
- [ ] Monitor error rates

## 🎉 Success!

Your PolliWall application is now deployed and ready for use!

For support and updates:
- **Documentation**: See repository README and docs
- **Issues**: GitHub Issues
- **Repository**: https://github.com/CyberBASSLord-666/Xterm1

---

**Last Updated**: 2025-10-15
**Status**: ✅ Production Ready
**Quality**: ⭐⭐⭐⭐⭐ Enterprise Grade
