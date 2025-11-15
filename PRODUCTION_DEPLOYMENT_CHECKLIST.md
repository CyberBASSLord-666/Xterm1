# Production Deployment Checklist

This checklist ensures all critical security, performance, and operational requirements are met before deploying to production.

## Pre-Deployment Security Checks

- [ ] Run `npm audit` and address all high/critical vulnerabilities
- [ ] Run `scripts/validate-security.sh` and ensure all checks pass
- [ ] Verify no secrets or API keys are committed to repository
- [ ] Confirm `.env` files are properly gitignored
- [ ] Review and update Content Security Policy headers
- [ ] Verify all environment variables are properly configured for production
- [ ] Ensure HTTPS is enforced (no mixed content)
- [ ] Test security headers using https://securityheaders.com

## Build & Performance Verification

- [ ] Run `npm run build` successfully without errors
- [ ] Verify bundle size is within acceptable limits (< 500KB initial)
- [ ] Test production build locally before deployment
- [ ] Confirm service worker configuration is correct
- [ ] Verify all assets are properly optimized (images, fonts, etc.)
- [ ] Test Progressive Web App functionality
- [ ] Confirm lazy-loaded routes work correctly

## Testing Requirements

- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run e2e:headless`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code formatting is consistent (`npm run format:check`)
- [ ] Test coverage meets minimum thresholds
- [ ] Manual testing in production-like environment completed

## Browser & Device Compatibility

- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Test on mobile devices (iOS and Android)
- [ ] Test in different viewport sizes
- [ ] Verify offline functionality (PWA)

## Configuration Verification

- [ ] Environment variables are set correctly
- [ ] API endpoints point to production services
- [ ] Analytics tracking is configured (if applicable)
- [ ] Error reporting/monitoring is enabled
- [ ] Proper CORS configuration
- [ ] Database connections verified (if applicable)
- [ ] CDN configuration verified
- [ ] DNS records are correct

## Documentation & Communication

- [ ] Update CHANGELOG.md with release notes
- [ ] Document any configuration changes
- [ ] Update README if deployment process changed
- [ ] Notify team of deployment schedule
- [ ] Prepare rollback plan
- [ ] Document known issues (if any)

## Post-Deployment Verification

- [ ] Verify application loads correctly
- [ ] Test critical user workflows
- [ ] Check browser console for errors
- [ ] Verify analytics/monitoring is receiving data
- [ ] Test API endpoints respond correctly
- [ ] Verify service worker updates properly
- [ ] Check performance metrics (Lighthouse, Web Vitals)
- [ ] Monitor error logs for issues

## Compliance & Legal

- [ ] Privacy policy is up to date
- [ ] Terms of service are current
- [ ] Cookie consent mechanism works (if applicable)
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] License information is correct
- [ ] Third-party service agreements reviewed

## Rollback Procedures

- [ ] Document rollback steps
- [ ] Test rollback procedure in staging
- [ ] Identify rollback triggers/criteria
- [ ] Ensure database migrations are reversible (if applicable)
- [ ] Have previous stable version tagged and accessible

## Sign-off

- [ ] Security team approval (if applicable)
- [ ] QA team approval
- [ ] Product owner approval
- [ ] Technical lead approval

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Version/Commit:** _______________  
**Environment:** _______________  

## Notes

_Add any deployment-specific notes, issues, or special considerations here._
