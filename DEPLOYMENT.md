# Deployment Guide - PolliWall

> **Regenerated during Operation Bedrock Phase 1.2**  
> **DevOps Engineer + Technical Scribe**  
> **Date**: 2025-11-10

---

## Executive Summary

This comprehensive guide covers deploying PolliWall to multiple hosting platforms including GitHub Pages, Vercel, Netlify, and custom servers. Each deployment target includes step-by-step instructions, configuration files, and troubleshooting guidance.

**Supported Platforms**:
- ✅ GitHub Pages (Primary - Automated CI/CD)
- ✅ Vercel (Recommended - Zero config)
- ✅ Netlify (Alternative - Great DX)
- ✅ Custom Server (Nginx - Full control)

---

## Prerequisites

### Required Software

- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher  
- **Git**: Latest version
- **Angular CLI**: Version 20.x (installed locally)

### Build Requirements

```bash
# Verify versions
node --version    # v20.x.x
npm --version     # 10.x.x
git --version     # 2.x.x
```

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Security headers tested
- [ ] API keys secured (not in code)
- [ ] Service worker configured
- [ ] Base href set correctly
- [ ] Analytics configured (if enabled)

---

## Platform 1: GitHub Pages (Primary)

### Overview

**Status**: ✅ Automated Deployment via GitHub Actions  
**URL**: `https://username.github.io/Xterm1/`  
**Cost**: Free  
**CDN**: GitHub's global CDN  
**SSL**: Automatic (Let's Encrypt)

### Automatic Deployment

**Trigger**: Push to `main` branch

**Workflow**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build -- --configuration=production --base-href=/Xterm1/

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: './dist/app'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Manual Deployment

```bash
# Build for GitHub Pages
npm run build -- --configuration=production --base-href=/Xterm1/

# Install GitHub Pages deployment tool
npm install -g angular-cli-ghpages

# Deploy
npx angular-cli-ghpages --dir=dist/app/browser
```

### Configuration

**Repository Settings**:
1. Go to: `Settings` → `Pages`
2. Source: `GitHub Actions`
3. Branch: `main`
4. Path: `/` (root)

**Custom Domain** (Optional):
1. Add `CNAME` file to `public/` directory:
   ```
   polliwall.app
   ```
2. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: username.github.io
   ```

### Troubleshooting

**Issue**: 404 errors on refresh
```javascript
// Solution: Handled by Angular routing + 404.html fallback
// index.html copied to 404.html during build
```

**Issue**: Assets not loading
```bash
# Verify base-href is correct
cat dist/app/browser/index.html | grep base
# Should show: <base href="/Xterm1/">
```

---

## Platform 2: Vercel (Recommended)

### Overview

**Status**: ✅ Zero-config deployment  
**URL**: `https://project-name.vercel.app`  
**Cost**: Free tier (hobby), $20/month (pro)  
**CDN**: Global Edge Network  
**SSL**: Automatic

### Deployment Methods

#### Method 1: GitHub Integration (Recommended)

1. **Connect Repository**:
   - Go to https://vercel.com/new
   - Import Git Repository
   - Select `CyberBASSLord-666/Xterm1`
   - Authorize Vercel

2. **Configure Project**:
   ```
   Framework Preset: Angular
   Build Command: npm run build
   Output Directory: dist/app/browser
   Install Command: npm ci
   ```

3. **Environment Variables**:
   ```
   GEMINI_API_KEY=your-api-key-here
   NODE_VERSION=20
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for build (~2-3 minutes)
   - Access at generated URL

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Configuration

**File**: `vercel.json`

```json
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://aistudiocdn.com https://next.esm.sh https://esm.sh; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://image.pollinations.ai; connect-src 'self' https://image.pollinations.ai https://text.pollinations.ai https://generativelanguage.googleapis.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Custom Domain

1. **Add Domain**: Vercel Dashboard → Domains
2. **Configure DNS**:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
3. **SSL**: Automatic via Let's Encrypt

---

## Platform 3: Netlify

### Overview

**Status**: ✅ Excellent developer experience  
**URL**: `https://project-name.netlify.app`  
**Cost**: Free tier, $19/month (pro)  
**CDN**: Global CDN  
**SSL**: Automatic

### Deployment

#### Method 1: Git Integration

1. **New Site**: https://app.netlify.com/start
2. **Connect**: Link GitHub repository
3. **Build Settings**:
   ```
   Base directory: (leave empty)
   Build command: npm run build
   Publish directory: dist/app/browser
   ```
4. **Advanced Build Settings**:
   ```bash
   NPM_FLAGS=""
   NODE_VERSION=20
   ```

#### Method 2: Netlify CLI

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy

# Production
netlify deploy --prod
```

### Configuration

**File**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist/app/browser"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://image.pollinations.ai; connect-src 'self' https://image.pollinations.ai; frame-ancestors 'none'"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Alternative**: `_headers` file (see DEPLOYMENT_SECURITY.md)

---

## Platform 4: Custom Server (Nginx)

### Overview

**Use Case**: Maximum control, enterprise deployment  
**Requirements**: VPS/dedicated server, root access  
**OS**: Ubuntu 22.04 LTS (recommended)

### Server Setup

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
nginx -v
certbot --version
node --version
```

#### 2. Build Application

```bash
# Clone repository
git clone https://github.com/CyberBASSLord-666/Xterm1.git
cd Xterm1

# Install dependencies
npm ci

# Build for production
npm run build -- --configuration=production

# Create deployment directory
sudo mkdir -p /var/www/polliwall
sudo cp -r dist/app/browser/* /var/www/polliwall/

# Set permissions
sudo chown -R www-data:www-data /var/www/polliwall
sudo chmod -R 755 /var/www/polliwall
```

#### 3. Configure Nginx

**File**: `/etc/nginx/sites-available/polliwall`

```nginx
server {
    listen 80;
    server_name polliwall.app www.polliwall.app;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name polliwall.app www.polliwall.app;
    
    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/polliwall.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/polliwall.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Document Root
    root /var/www/polliwall;
    index index.html;
    
    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://image.pollinations.ai; connect-src 'self' https://image.pollinations.ai; frame-ancestors 'none'" always;
    
    # SPA Routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static Assets - Long Cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Service Worker - No Cache
    location = /ngsw-worker.js {
        expires 0;
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }
    
    # Manifest
    location = /manifest.webmanifest {
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
```

#### 4. Enable Site & SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/polliwall /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d polliwall.app -d www.polliwall.app

# Test auto-renewal
sudo certbot renew --dry-run
```

### Deployment Script

**File**: `deploy.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Deploying PolliWall..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Run tests
npm test

# Build production
npm run build -- --configuration=production

# Backup current deployment
sudo cp -r /var/www/polliwall /var/www/polliwall.backup.$(date +%Y%m%d_%H%M%S)

# Deploy new build
sudo rm -rf /var/www/polliwall/*
sudo cp -r dist/app/browser/* /var/www/polliwall/

# Set permissions
sudo chown -R www-data:www-data /var/www/polliwall
sudo chmod -R 755 /var/www/polliwall

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Environment Variables

### Development

**File**: `.env.local` (NOT committed)

```bash
GEMINI_API_KEY=your-development-key
ANALYTICS_ID=your-dev-analytics-id
```

### Production

**Platform-Specific**:

**Vercel**:
```bash
vercel env add GEMINI_API_KEY production
```

**Netlify**:
```bash
netlify env:set GEMINI_API_KEY "your-key"
```

**Custom Server**:
```bash
# /etc/environment
export GEMINI_API_KEY="your-key"
```

---

## Monitoring & Analytics

### Performance Monitoring

**Lighthouse CI**:
```yaml
# .github/workflows/lighthouse.yml
- uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://polliwall.app
    uploadArtifacts: true
```

**Web Vitals**:
- Monitor via Google Analytics
- Track: LCP, FID, CLS

### Error Tracking

**Sentry** (Optional):
```typescript
import * as Sentry from "@sentry/angular";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

---

## Rollback Procedures

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Netlify

```bash
# Via Web UI: Deploys → Select previous → Publish
```

### Custom Server

```bash
# Restore from backup
sudo rm -rf /var/www/polliwall
sudo cp -r /var/www/polliwall.backup.YYYYMMDD_HHMMSS /var/www/polliwall
sudo systemctl reload nginx
```

---

## Troubleshooting

### Build Failures

**Issue**: `npm ci` fails
```bash
# Solution: Reinstall dependencies cleanly
npm ci
```

**Issue**: Build timeout
```bash
# Solution: Increase memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Runtime Errors

**Issue**: White screen / blank page
```javascript
// Check browser console for errors
// Verify base-href in index.html
// Check CSP violations
```

**Issue**: Assets 404
```bash
# Verify output directory structure
ls -la dist/app/browser/
```

---

*This deployment guide is the definitive reference for deploying PolliWall to production.*  
*Last Updated: 2025-11-10 | Operation Bedrock Phase 1.2*

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
