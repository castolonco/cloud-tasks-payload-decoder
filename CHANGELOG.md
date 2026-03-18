# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-18

### Fixed

- Payload decoding now works when navigating between pages in the Cloud Console without a full page reload

### Added

- Tests for content script integration (dialog detection, toggle, MutationObserver)
- Tests for background service worker
- Updated README with clearer intro and project structure

## [1.0.0] - 2026-01-12

### Added

- Chrome extension that decodes base64-encoded payloads in the Google Cloud Tasks console UI
- MutationObserver-based detection of GCP task detail dialogs
- Automatic base64 decode and JSON syntax highlighting for payloads
- Toggle button to switch between decoded and raw views
- Support for GCP's `cfc-code-editor` and `cfc-code-snippet` wrapper components
- SPA navigation handling for client-side page transitions
- Background service worker to inject into already-open GCP tabs on install/update
- ESLint configuration and Jest test suite
