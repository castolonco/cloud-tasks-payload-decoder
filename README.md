# Cloud Tasks Payload Decoder

Job processing libraries like [Cloudtasker](https://github.com/keypup-io/cloudtasker) encode Cloud Tasks payloads as base64, making them unreadable in the Cloud Console. This Chrome extension decodes the payloads inline.

**Before:**
```
eyJ3b3JrZXIiOiJNeVdvcmtlciIsImpvYl9xdWV1ZSI6ImRlZmF1bHQi...
```

**After:**
```json
{
  "worker": "MyWorker",
  "job_queue": "default",
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "job_args": ["arg1", "arg2"]
}
```

## Installation

This extension is not on the Chrome Web Store. Install it manually:

1. Clone the repo:
   ```bash
   git clone https://github.com/castolonco/cloud-tasks-payload-decoder.git
   ```

2. Go to `chrome://extensions` and enable **Developer mode**

3. Click **Load unpacked** and select the cloned directory

## Usage

1. Open the [Cloud Tasks UI](https://console.cloud.google.com/cloudtasks)
2. Click on any task to open its details
3. The payload is automatically decoded and syntax-highlighted
4. Click **Show Raw Base64** to toggle views

## Features

- Works with any base64-encoded JSON payload, not just Cloudtasker
- Automatic base64 JSON decoding
- Syntax highlighting (keys, strings, numbers, booleans)
- Toggle between decoded and raw views
- Dark mode support

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
├── background.js   # Service worker - injects into existing GCP tabs on install
├── content.js      # Content script - detects dialogs, injects decoded view
├── decoder.js      # Base64 decoding and JSON syntax highlighting
├── dom-helpers.js  # DOM utilities
└── styles.css      # Styling
tests/
├── background.test.js
├── content.test.js
├── content-script.test.js
└── decoder.test.js
```

## Contributing

PRs welcome. Please run `npm test && npm run lint` before submitting.

## License

MIT
