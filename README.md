# Discord Data Package Explorer — Static

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-blue?logo=github)](https://didvc.github.io/discord-data-package-explorer-static/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Pure Static](https://img.shields.io/badge/100%25-static%20%7C%20no%20telemetry-success)](https://github.com/)

**Pure static, zero-telemetry, GitHub Pages hosted Discord Data Package Explorer.**

All processing happens 100% in your browser. No backend. No tracking. No data ever leaves your device.

All processing happens 100% in your browser. No backend. No tracking. No data ever leaves your device.

This is a fork/adaptation focused on:
- Maximum transparency and trustworthiness (GitHub Pages = direct mirror of the repo)
- Strong support for cross-server / full-archive search of *your own messages*
- Easy to use without self-hosting friction

## Why?

Discord's native search only works inside one server at a time (`from:me`). The official Data Package is the only way to get a complete cross-server archive of everything you've ever posted.

Hosted versions on custom domains can add analytics or other code. This version is deliberately **static + GH Pages only** so the guarantee is structural: what you see in the repo is exactly what runs.

## Usage

1. Request your data from Discord (Settings → Privacy & Safety → Request all of my data). Make sure to include **Messages**.
2. Wait for the email and download `package.zip`.
3. Go to the GitHub Pages URL: https://didvc.github.io/discord-data-package-explorer-static/ (or build & open `dist/index.html` locally).
4. Drag & drop or select your `package.zip`.
5. Use the **Search Messages** tab to search everything you've ever written.

Demo data is available on the landing screen.

## Features

- Full client-side ZIP parsing (fflate streaming)
- Supports both old (CSV) and current (JSON) Discord data package message formats
- Cross-everything search + filters (servers vs DMs, channel name, sort)
- Export filtered results to CSV
- Basic stats + hourly activity
- Completely offline after the initial page load

## Local development

```bash
npm install
npm run dev
```

## Build & GitHub Pages

```bash
npm run build
```

The `dist/` folder is ready to serve as a static site.

### Recommended GitHub Pages setup

- Use the included GitHub Action (see `.github/workflows/deploy.yml`) **or**
- Push the contents of `dist/` to a `gh-pages` branch
- Or enable "GitHub Pages" → "Deploy from a branch" pointing at the `gh-pages` branch

Set the correct `base` in `vite.config.js` if your site lives at a subpath (e.g. `/discord-data-package-explorer-static/`).

## Privacy & Philosophy

- Nothing is uploaded
- No scripts from third-party analytics
- No external APIs called during processing (usernames shown as-is from package or "Unknown")
- Close the tab = data is gone

## Credits

Original project by Androz2091: https://github.com/Androz2091/discord-data-package-explorer

This static transparent edition exists to give users a high-trust option that can be hosted directly from GitHub with zero surprises.

## License

GPL-3.0 (same as upstream)
