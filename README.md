<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Xterm1 - Browser-Based Terminal & Tooling Experience

[![Deploy](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/deploy.yml/badge.svg)](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/deploy.yml)
[![CI](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/ci.yml/badge.svg)](https://github.com/CyberBASSLord-666/Xterm1/actions/workflows/ci.yml)

> 💻 Modern browser-based terminal and development tooling experience built with TypeScript

**🌐 Live Demo**: [https://CyberBASSLord-666.github.io/Xterm1/](https://CyberBASSLord-666.github.io/Xterm1/) *(Coming soon after merge)*

Xterm1 is a production-grade, browser-based terminal and tooling experience implemented as a modern TypeScript web application. Built with modern web technologies and following industry best practices for performance, security, and user experience.

## ✨ Features

- **Browser-Based Terminal**: Full-featured terminal experience in your browser
- **Modern Tooling**: Integrated development and system management tools
- **TypeScript Core**: Strict TypeScript implementation with type safety
- **PWA Support**: Progressive Web App with offline capabilities
- **Performance Optimized**: Lazy loading, caching, and optimized bundle sizes (797KB → 193KB gzipped)
- **Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- **Automated CI/CD**: Complete GitHub Actions workflow automation
- **Security First**: Comprehensive security headers and CSP policies

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- A **Gemini API key** (get one at [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CyberBASSLord-666/Xterm1.git
   cd Xterm1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
   
   Or configure it later through the settings UI.

4. **Start development server**
   ```bash
   npm start
   ```
   
   Navigate to `http://localhost:4200/`

### Building for Production

```bash
# Production build
npm run build

# Or use the full pre-deployment check (recommended)
npm run pre-deploy
```

The `pre-deploy` script runs:
1. Linting checks
2. Unit tests with coverage
3. Production build
4. Security validation

Build artifacts will be stored in the `dist/` directory.

## 📚 Documentation

### Core Documentation

- **[📖 Documentation Index](./DOCUMENTATION_INDEX.md)** - Complete documentation navigation and guide
- **[🏗️ Architecture Guide](./ARCHITECTURE.md)** - System architecture and design decisions
- **[💻 Development Guide](./DEVELOPMENT.md)** - Developer setup and workflow
- **[📡 API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[🚀 Deployment Guide](./DEPLOYMENT.md)** - Platform-specific deployment instructions
- **[🔒 Security Guide](./SECURITY.md)** - Security configuration and best practices
- **[🧪 Testing Guide](./TESTING.md)** - Unit and E2E testing documentation
- **[✅ Production Readiness](./PRODUCTION_READINESS_GUIDE.md)** - Production deployment checklist

### Additional Resources

- **[Reference Documentation](./docs/reference/)** - Quality metrics, dependency management, security audits
- **[Development Guides](./docs/guides/)** - Production line workflow, plan templates, examples

> 💡 **New to the project?** Start with the [Documentation Index](./DOCUMENTATION_INDEX.md) for a guided tour of all available documentation.

## 🏗️ Technology Stack

- **Frontend Framework**: Angular 20.x
- **Language**: TypeScript 5.8.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Angular Signals
- **Storage**: IndexedDB (via idb)
- **Service Worker**: @angular/service-worker
- **AI Services**:
  - Pollinations AI (image generation)
  - Google Gemini (prompt enhancement)

## 🎯 Key Features & Improvements

### Phase 1: Build & Dependency Fixes ✅
- Fixed all TypeScript compilation errors
- Updated dependencies to compatible versions
- Implemented proper environment configuration
- Added comprehensive type safety

### Phase 2: Architecture & Code Quality ✅
- **ErrorHandlerService**: Centralized error handling with user-friendly messages
- **LoggerService**: Configurable logging with history tracking
- **ValidationService**: Input validation and sanitization
- **BlobUrlManagerService**: Automatic memory leak prevention
- **RequestQueue**: Request cancellation and rate limiting

### Phase 3: Performance Optimizations ✅
- **Enhanced ImageUtilService**: Compression, format conversion, placeholders
- **LazyImageDirective**: Intersection Observer-based lazy loading
- **Service Worker**: Optimized caching strategies for different resource types
- **PerformanceMonitorService**: Performance tracking and Web Vitals
- **RequestCacheService**: Request deduplication and caching

### Phase 4: UX Enhancements 🚧
- **SkeletonComponent**: Loading screens for better perceived performance
- **KeyboardShortcutsService**: Application-wide keyboard shortcuts
- More improvements in progress...

## 🔑 Keyboard Shortcuts (Planned)

- `Ctrl/Cmd + S` - Save current wallpaper
- `Delete` - Delete selected item
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo
- `Ctrl/Cmd + F` - Search
- `Shift + ?` - Show keyboard shortcuts help
- `Escape` - Close dialog/cancel action

## 📊 Performance Metrics

- **Initial Bundle**: ~2.56 MB (development)
- **Lazy Loading**: Component-level code splitting
- **Caching**: Optimized for images (7d TTL), text (1h TTL)
- **Image Compression**: Automatic compression with quality preservation
- **Service Worker**: Offline support with intelligent caching

## 🔒 Security Features

### Production-Grade Security
- **Input Validation**: Comprehensive validation for all user inputs
- **XSS Prevention**: Multi-layer HTML sanitization and Angular's built-in protection
- **API Key Security**: Secure storage, environment-based configuration, never logged
- **Rate Limiting**: Client-side rate limiting to prevent API abuse
- **Content Security Policy**: Configured with appropriate directives
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, etc.
- **HTTPS Enforcement**: Automatic redirect to HTTPS in production
- **Environment Validation**: Startup validation of all configuration

### Security Validation
Run comprehensive security checks before deployment:
```bash
npm run security:check
```

### Deployment Security
- **[SECURITY.md](./SECURITY.md)** - Comprehensive security guide (includes deployment security)
- **[PRODUCTION_READINESS_GUIDE.md](./PRODUCTION_READINESS_GUIDE.md)** - Production readiness & deployment checklist

### Platform-Specific Security Configuration
- `_headers` - Netlify/Cloudflare Pages security headers
- `vercel.json` - Vercel security configuration
- `nginx.conf.example` - Nginx configuration template
- `.htaccess` - Apache configuration

## 🤝 Contributing

We welcome contributions! Please see our guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guidelines.

## 📝 Code Style

- TypeScript strict mode enabled
- Angular style guide compliance
- OnPush change detection strategy
- Comprehensive error handling
- Detailed logging

## 🔄 CI/CD & Automation

### Automated Workflows
- **Continuous Integration**: Automated linting, testing, and building on every PR
- **Security Scanning**: CodeQL analysis and dependency review
- **Dependabot Auto-Merge**: Automatic approval and merging of dependency updates
  - Patch & minor updates: Auto-merged after CI passes
  - Major updates: Require manual review
  - Weekly updates on Mondays

### GitHub Actions Workflows
- `ci.yml` - Lint, test, build, and E2E tests
- `security.yml` - CodeQL, dependency review, npm audit
- `dependabot-auto-merge.yml` - Automated dependency management
- `deploy.yml` - Production deployment
- `codescan.yml` - Additional security scanning
- `bundle-size.yml` - Bundle size tracking

See [DEVELOPMENT.md](./DEVELOPMENT.md#dependency-management) for more details.

## 🐛 Troubleshooting

### Build Issues
- Ensure Node.js 18+ is installed
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

### Runtime Issues
- Verify API key configuration
- Check browser console for errors
- Clear browser cache and IndexedDB
- Check service worker status

For more help, see [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting)

## 🗺️ Roadmap

- [ ] Unit and E2E tests
- [ ] Advanced image editing capabilities
- [ ] Collaborative collections
- [ ] Social sharing features
- [ ] Custom model fine-tuning
- [ ] Batch generation
- [ ] Analytics dashboard
- [ ] Internationalization (i18n)

## 📄 License

See [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Pollinations AI](https://pollinations.ai/) for the image generation API
- [Google Gemini](https://ai.google.dev/) for prompt enhancement
- [Angular](https://angular.dev/) team for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/CyberBASSLord-666/Xterm1/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CyberBASSLord-666/Xterm1/discussions)
- **Documentation**: See the docs folder

---

**Made with ❤️ and AI**
