# Cloud Tasks Payload Decoder

A Chrome extension that automatically decodes base64-encoded payloads in the Google Cloud Tasks UI.

## The Problem

Job processing libraries like [Cloudtasker](https://github.com/keypup-io/cloudtasker) encode payloads as base64 when sending them to Google Cloud Tasks. In the Cloud Tasks UI, you see:

```
eyJ3b3JrZXIiOiJNeVdvcmtlciIsImpvYl9xdWV1ZSI6ImRlZmF1bHQi...
```

Instead of:

```json
{
  "worker": "MyWorker",
  "job_queue": "default",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_args": ["arg1", "arg2"]
}
```

## Installation

1. Clone and open Chrome extensions:
   ```bash
   git clone https://github.com/YOUR_USERNAME/cloud-tasks-payload-decoder.git
   ```

2. Go to `chrome://extensions`, enable **Developer mode**

3. Click **Load unpacked** and select the cloned directory

## Usage

1. Open the [Cloud Tasks UI](https://console.cloud.google.com/cloudtasks)
2. Click on any task to open its details
3. The payload is automatically decoded and syntax-highlighted
4. Click **Show Raw Base64** to toggle views

## Features

- Automatic base64 JSON decoding
- Syntax highlighting (keys, strings, numbers, booleans)
- Toggle between decoded/raw views
- Dark mode support
- Works with any base64-encoded JSON, not just Cloudtasker

## Development

Requires Node.js 20+.

```bash
npm install
npm test              # Run tests
npm run test:coverage # With coverage
npm run lint          # Check code style
```

### Project Structure

```
src/
├── content.js      # Content script - detects dialogs, injects decoded view
├── decoder.js      # Base64 decoding and JSON syntax highlighting
├── dom-helpers.js  # DOM utilities
└── styles.css      # Styling
tests/
├── decoder.test.js
└── content.test.js
```

## Contributing

PRs welcome. Please run `npm test && npm run lint` before submitting.

## License

MIT
