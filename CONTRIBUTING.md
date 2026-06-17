# Contributing to Discord Data Package Explorer (Static)

Thank you for your interest in contributing!

## Quick Start

1. Clone the repo
2. `npm install`
3. `npm run dev` to start local development
4. Make changes, `npm run build` to verify
5. Open a Pull Request

## What We Welcome

- Bug reports (especially with sample packages or reproduction steps)
- Improvements to parsing (new Discord data package formats)
- UI/UX enhancements for the static explorer
- Documentation improvements
- Accessibility and performance fixes

## Guidelines

- Keep everything **client-side only**. No new network calls in core processing.
- Preserve the "pure static / zero telemetry" promise.
- All changes must work when deployed to GitHub Pages.
- English for user-facing text and docs.
- Test with both old (CSV) and new (JSON) message formats when possible.

## Development Notes

- The app is built with Vite + Svelte.
- Message parsing lives primarily in `src/App.svelte` (the `extractPackage` and `parseMessages` logic).
- GitHub Pages deploys automatically from the workflow on push to `main`.

## Reporting Issues

Please use the issue templates and include:

- Discord data package version / date requested (if known)
- Browser + version
- Steps + any console errors
- (Optional) redacted structure dump if it helps

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (GPL-3.0).
