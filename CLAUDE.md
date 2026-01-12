# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome extension that decodes base64-encoded payloads in the Google Cloud Tasks console UI. Targets job processing libraries like Cloudtasker that encode payloads as base64.

## Commands

```bash
npm test              # Run tests with Jest
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
```

Run a single test file:
```bash
npx jest tests/decoder.test.js
```

## Architecture

This is a Chrome Manifest V3 content script extension. No background scripts or service workers.

**Content script loading order** (defined in manifest.json):
1. `src/decoder.js` - Exports `window.CloudTasksDecoder` with `tryDecodeBase64Json()` and `syntaxHighlight()`
2. `src/dom-helpers.js` - Exports `window.CloudTasksDomHelpers` with DOM utilities
3. `src/content.js` - Main script that uses the above globals, sets up MutationObserver to detect GCP dialogs

**Key flow:**
- MutationObserver watches for `[role="dialog"]` elements (GCP task detail modals)
- Finds `<textarea>`, `<pre>`, `<code>` elements inside dialogs
- Attempts base64 decode → JSON parse on content
- On success, hides original element and injects decoded view with toggle button

**GCP-specific handling:**
- `dom-helpers.js:findElementToHide()` handles GCP's custom `<cfc-code-editor>` and `<cfc-code-snippet>` wrapper components
- Base64 decoder strips whitespace/newlines that GCP console adds to displayed payloads

## Code Style

ESLint with flat config (eslint.config.js):
- 2-space indentation
- Single quotes
- Unix line endings
- Semicolons required

## Testing

Uses Jest with jsdom environment. Tests use CommonJS requires while source uses browser globals pattern (dual export via `module.exports` and `window.*`).
