# Contributing to PolliWall

## Development setup

1. Install dependencies: `npm ci`
2. Start the dev server: `npm start`
3. Run checks before opening a PR:
   - `npm run lint`
   - `npm run typecheck`
   - `npm test -- --watchAll=false --passWithNoTests`
   - `npm run build -- --configuration=production`

## Pull requests

- Keep changes focused and minimal.
- Update relevant docs when behavior changes.
- Ensure CI is green before requesting review.

## Reporting issues

- Use the issue templates in `.github/ISSUE_TEMPLATE`.
- Include reproduction steps and expected behavior.
