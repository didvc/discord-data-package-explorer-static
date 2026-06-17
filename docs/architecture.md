# Architecture

This page explains the high-level design of the static Discord Data Package Explorer.

## Core Principles

- **Everything runs in the browser**  
  No backend, no API calls, no data leaving the user's device.

- **Simplicity over features**  
  We deliberately chose a simpler architecture than the original to make the codebase easier to audit and maintain as a static artifact.

- **Search-first design**  
  While statistics are still available, the primary value is being able to search your own messages across every server and DM.

## High-level Data Flow

1. User drops or selects `package.zip`
2. Streaming unzip using `fflate` (memory-efficient even for large packages)
3. Detection of message root, account info, and format version (old CSV vs new JSON)
4. Parsing of channel index + individual message files
5. In-memory data structure containing full message content
6. Reactive UI (Svelte) for filtering, searching, and displaying results

All steps happen entirely client-side.

## Why a Single-File Architecture?

The original project used a more traditional structure with separate views, components, and stores. We consolidated most logic into `src/App.svelte`.

Reasons:

- Reduces the surface area users need to understand when auditing the code.
- Easier to deploy as a pure static site.
- For this scope (parse once → explore locally), complex routing and state management were not necessary.
- Faster iteration while keeping the bundle small.

Important parts of the logic (ZIP handling, message parsing, statistics calculation) remain clearly separated as functions inside the component.

## Parsing Approach

We adapted the excellent streaming parser logic from the original project:

- Supports packages with and without the `c` prefix on channel folders.
- Handles both legacy CSV message files and modern JSON.
- Uses `DecodeUTF8` from `fflate` for efficient text decoding during streaming.
- Keeps **full message content** (unlike the original, which stripped content for stats-only use).

This change was necessary to power the cross-server search feature.

## State Management

We use Svelte's built-in reactivity (`let` declarations + `$:` reactive statements) instead of a separate store system. This keeps the code approachable while still providing responsive updates when filtering or searching.

## Deployment Model

The application is designed exclusively for static hosting:

- GitHub Pages (primary)
- Any other static host (Netlify, Vercel, Cloudflare Pages, etc.)

Because there is no server component, the only "backend" is the user's browser.

## Documentation

Separate from the application, we maintain documentation using VitePress. This allows:

- Richer explanations (architecture, data formats, privacy)
- Multi-language support without bloating the main app
- Clear separation between the tool and its documentation

The documentation itself is licensed under CC-BY-SA 4.0 (see the docs `LICENSE` file).

## Trade-offs

This architecture makes some things easier and others harder:

- Easier: Auditing, static deployment, search performance, transparency
- Harder: Adding complex UI flows, heavy visualizations, or multi-page navigation

We believe this trade-off is correct for the stated goal of a pure, trustworthy, static data package explorer.