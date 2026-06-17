# What Changed from the Original

This project is a fork and reimplementation of [Androz2091's Discord Data Package Explorer](https://github.com/Androz2091/discord-data-package-explorer). While we share the same core goal — helping users understand and explore their Discord data package — we have made several considerable changes.

## High-level Differences

| Area                  | Original                          | This Static Edition                          |
|-----------------------|-----------------------------------|----------------------------------------------|
| Build System          | Rollup + Svelte 3                 | Vite + Svelte 4                              |
| Architecture          | Multiple views + routing + stores | Single-file reactive app (mostly in `App.svelte`) |
| Primary Focus         | Statistics & insights (Wrapped-like) | Cross-server message search                  |
| External Dependencies | axios, diswho API, charts, routing | None (pure client-side)                      |
| Network Activity      | Optional external user resolution | Zero network calls during processing         |
| Message Content       | Stripped for stats only           | Full content kept for search                 |
| Deployment            | Self-host or hosted instances     | GitHub Pages (pure static, no backend)       |
| Documentation         | Basic README                      | Multi-language VitePress docs                |

## Notable Changes & Additions

- **Search as a first-class feature**  
  The original focused on aggregate statistics. We added powerful full-text search across *all* servers and DMs, with filters (servers only / DMs only), channel filtering, sorting, and CSV export. This directly addresses the common user need of "finding my old messages across servers."

- **Complete removal of external services**  
  All calls to external APIs (for resolving usernames/avatars) have been removed. This makes the tool truly zero-telemetry and suitable for the most privacy-conscious users.

- **Simpler, more maintainable codebase**  
  We consolidated logic into a single reactive component. This reduces complexity for a tool whose main job is "parse once, explore locally."

- **Modern build toolchain**  
  Switched to Vite for faster development and simpler static export configuration.

- **Strong emphasis on transparency**  
  The entire value proposition is "this is a pure static build on GitHub Pages." We added visible messaging, clear licensing for docs, and separate multi-language documentation.

- **Documentation**  
  Added a proper documentation site (this site) with guides, architecture explanations, and privacy details. Initially available in English and German, with structure prepared for more languages.

## What We Kept

- The excellent streaming ZIP parsing approach using `fflate`
- Support for both old (CSV) and newer (JSON) Discord data package formats
- Core statistics (message counts, hourly activity, top words, etc.)
- Demo data mode for testing without a real package
- Overall "everything runs in the browser" philosophy

## Why These Changes?

The original project is excellent. However, our specific goal was to create a **high-trust, purely static version** that can be hosted on GitHub Pages with zero risk of hidden telemetry or backend processing. This required:

- Eliminating every possible external dependency
- Simplifying the architecture for long-term maintainability as a static artifact
- Prioritizing the search use case that many users actually want

We believe these changes make the tool more aligned with "pure static + maximum transparency" while still delivering real value.