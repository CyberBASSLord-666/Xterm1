# GitHub Pages Deployment Instructions

## Quick Start

This repository is configured for automatic deployment to GitHub Pages.

### Deployment URL
- **Production**: https://cyberbassLord-666.github.io/Xterm1/

### Automatic Deployment

The site automatically deploys when changes are pushed to the `main` branch.

**Workflow**: `.github/workflows/deploy.yml`

### Manual Deployment Trigger

1. Go to the **Actions** tab in GitHub
2. Select **Deploy to GitHub Pages**
3. Click **Run workflow**
4. Select branch (usually `main`)
5. Click **Run workflow**

## Repository Settings Required

To enable GitHub Pages deployment:

1. Go to repository **Settings**
2. Navigate to **Pages** (left sidebar)
3. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions`
4. Save changes

The deployment will automatically run when you push to `main`.

## Build Configuration

### Base Path
The application is configured to work with the GitHub Pages subdirectory structure:
- Base href: `/Xterm1/`
- This is automatically set during the build process

### Production Build
The workflow builds with production optimizations:
```bash
npm run build -- --configuration=production --base-href=/Xterm1/
```

### Output Directory
- Build output: `dist/app/browser/`
- This directory is deployed to GitHub Pages

## SPA Routing Support

The deployment includes a 404.html fallback to support Angular routing:
- `index.html` is copied to `404.html`
- This ensures deep links work correctly
- Refresh on any route will work properly

## Custom Domain (Optional)

To use a custom domain:

1. Add a file named `CNAME` to the `public/` directory:
   ```
   yourdomain.com
   ```

2. Configure DNS records at your domain provider:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: cyberbassLord-666.github.io
   ```

3. Enable HTTPS in repository settings

## Security Configuration

Security headers are configured via multiple methods:

1. **_headers** - For Netlify/Cloudflare Pages
2. **vercel.json** - For Vercel deployments
3. **nginx.conf.example** - For custom servers
4. **.htaccess** - For Apache servers

GitHub Pages uses default security settings, but these files are included for alternative deployments.

## Troubleshooting

### Build Fails
- Check the Actions tab for error details
- Verify `package.json` is valid
- Ensure all dependencies are properly declared

### 404 Errors
- Verify the base-href is set correctly
- Check that 404.html exists in the deployment
- Ensure the repository name matches the base-href

### Assets Not Loading
- Check browser console for errors
- Verify paths in the application
- Confirm base-href matches repository name

### Service Worker Issues
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check service worker status in DevTools

## Local Testing

To test the production build locally:

```bash
# Build for GitHub Pages
npm run build -- --configuration=production --base-href=/Xterm1/

# Serve the build
npx serve dist/app/browser -s
```

Then open: http://localhost:3000/Xterm1/

## Verification Checklist

After deployment, verify:

- [ ] Site loads at https://cyberbassLord-666.github.io/Xterm1/
- [ ] Navigation works
- [ ] Assets load correctly
- [ ] Deep links work (refresh on any route)
- [ ] Service worker registers
- [ ] PWA features work
- [ ] Mobile responsive
- [ ] Theme toggle works

## CI/CD Pipeline

### Workflows

1. **deploy.yml** - Deploys to GitHub Pages on push to main
2. **ci.yml** - Runs tests, linting, and builds on PRs

### Status Badges

Add to README.md:
```markdown
[![Deploy](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/deploy.yml/badge.svg)](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/deploy.yml)
[![CI](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/ci.yml/badge.svg)](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/ci.yml)
```

## Performance

The production build includes:
- Code minification
- Tree shaking
- Lazy loading
- Service worker caching
- Asset optimization

Expected Lighthouse scores:
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Support

For issues or questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide
- Review [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup
- See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) if available
- Open an issue on GitHub

---

**Last Updated**: 2026-01-18
**Status**: ✅ Production Ready
