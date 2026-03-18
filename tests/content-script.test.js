const VALID_PAYLOAD = { worker: 'TestWorker', job_args: [1, 2, 3] };
const VALID_BASE64 = btoa(JSON.stringify(VALID_PAYLOAD));

function buildDialog(innerHTML) {
  return `<div role="dialog">${innerHTML}</div>`;
}

// Track MutationObservers so we can disconnect them after each test.
// content.js creates observers inside an IIFE that we can't access directly.
const OriginalMutationObserver = window.MutationObserver;
let activeObservers = [];

describe('content script', () => {
  beforeEach(() => {
    activeObservers = [];
    window.MutationObserver = class extends OriginalMutationObserver {
      constructor(callback) {
        super(callback);
        activeObservers.push(this);
      }
    };

    document.body.innerHTML = '';
    delete window.__cloudTasksDecoderInitialized;
    delete window.CloudTasksDecoder;
    delete window.CloudTasksDomHelpers;
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    activeObservers.forEach(obs => obs.disconnect());
    activeObservers = [];
    window.MutationObserver = OriginalMutationObserver;
    jest.useRealTimers();
  });

  function loadExtension() {
    require('../src/decoder.js');
    require('../src/dom-helpers.js');
    require('../src/content.js');
  }

  describe('payload decoding in dialogs', () => {
    it('decodes base64 payload in a textarea', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      const container = document.querySelector('.cloudtasker-decoder-container');
      expect(container).not.toBeNull();
      expect(container.querySelector('.cloudtasker-decoded-view').textContent)
        .toContain('TestWorker');
    });

    it('decodes base64 payload in a pre element', () => {
      document.body.innerHTML = buildDialog(
        `<pre>${VALID_BASE64}</pre>`
      );
      loadExtension();

      expect(document.querySelector('.cloudtasker-decoder-container')).not.toBeNull();
    });

    it('decodes base64 payload in a code element', () => {
      document.body.innerHTML = buildDialog(
        `<code>${VALID_BASE64}</code>`
      );
      loadExtension();

      expect(document.querySelector('.cloudtasker-decoder-container')).not.toBeNull();
    });

    it('hides the original element when no cfc wrapper exists', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      expect(document.querySelector('textarea').style.display).toBe('none');
    });

    it('hides cfc-code-editor wrapper instead of the textarea', () => {
      document.body.innerHTML = buildDialog(`
        <cfc-code-editor>
          <textarea>${VALID_BASE64}</textarea>
        </cfc-code-editor>
      `);
      loadExtension();

      const editor = document.querySelector('cfc-code-editor');
      expect(editor.style.display).toBe('none');
      // Decoded display is inserted after the wrapper
      expect(editor.nextSibling.className).toBe('cloudtasker-decoder-container');
    });

    it('hides cfc-code-snippet wrapper', () => {
      document.body.innerHTML = buildDialog(`
        <cfc-code-snippet>
          <pre>${VALID_BASE64}</pre>
        </cfc-code-snippet>
      `);
      loadExtension();

      expect(document.querySelector('cfc-code-snippet').style.display).toBe('none');
      expect(document.querySelector('.cloudtasker-decoder-container')).not.toBeNull();
    });
  });

  describe('skips invalid content', () => {
    it('ignores non-base64 content', () => {
      document.body.innerHTML = buildDialog(
        '<textarea>this is plain text, not base64 encoded content</textarea>'
      );
      loadExtension();

      expect(document.querySelector('.cloudtasker-decoder-container')).toBeNull();
    });

    it('ignores text shorter than 20 characters', () => {
      document.body.innerHTML = buildDialog(
        '<textarea>short</textarea>'
      );
      loadExtension();

      expect(document.querySelector('.cloudtasker-decoder-container')).toBeNull();
    });

    it('ignores elements outside of dialogs', () => {
      document.body.innerHTML = `<textarea>${VALID_BASE64}</textarea>`;
      loadExtension();

      expect(document.querySelector('.cloudtasker-decoder-container')).toBeNull();
    });

    it('ignores valid base64 that is not JSON', () => {
      const notJson = btoa('this is plain text not json at all');
      document.body.innerHTML = buildDialog(
        `<textarea>${notJson}</textarea>`
      );
      loadExtension();

      expect(document.querySelector('.cloudtasker-decoder-container')).toBeNull();
    });
  });

  describe('toggle button', () => {
    it('shows decoded view by default with "Show Raw Base64" button', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      const btn = document.querySelector('.cloudtasker-toggle-btn');
      expect(btn.textContent).toBe('Show Raw Base64');
      expect(btn.type).toBe('button');

      const decoded = document.querySelector('.cloudtasker-decoded-view');
      const raw = document.querySelector('.cloudtasker-raw-view');
      expect(decoded.style.display).not.toBe('none');
      expect(raw.style.display).toBe('none');
    });

    it('toggles to raw view on first click', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      const btn = document.querySelector('.cloudtasker-toggle-btn');
      btn.click();

      expect(btn.textContent).toBe('Show Decoded JSON');
      expect(document.querySelector('.cloudtasker-decoded-view').style.display).toBe('none');
      expect(document.querySelector('.cloudtasker-raw-view').style.display).toBe('block');
    });

    it('toggles back to decoded view on second click', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      const btn = document.querySelector('.cloudtasker-toggle-btn');
      btn.click();
      btn.click();

      expect(btn.textContent).toBe('Show Raw Base64');
      expect(document.querySelector('.cloudtasker-decoded-view').style.display).toBe('block');
      expect(document.querySelector('.cloudtasker-raw-view').style.display).toBe('none');
    });

    it('raw view contains the original base64 text', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      const raw = document.querySelector('.cloudtasker-raw-view');
      expect(raw.textContent).toBe(VALID_BASE64);
    });
  });

  describe('duplicate processing prevention', () => {
    it('marks processed elements with data attribute', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      const textarea = document.querySelector('textarea');
      expect(textarea.getAttribute('data-cloudtasker-decoded')).toBe('true');
    });

    it('marks cfc wrapper with data attribute', () => {
      document.body.innerHTML = buildDialog(`
        <cfc-code-editor>
          <textarea>${VALID_BASE64}</textarea>
        </cfc-code-editor>
      `);
      loadExtension();

      const editor = document.querySelector('cfc-code-editor');
      expect(editor.getAttribute('data-cloudtasker-decoded')).toBe('true');
    });

    it('does not create duplicate containers for already-processed dialog', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      expect(document.querySelectorAll('.cloudtasker-decoder-container')).toHaveLength(1);
    });
  });

  describe('initialization guard', () => {
    it('sets the initialization flag on window', () => {
      loadExtension();
      expect(window.__cloudTasksDecoderInitialized).toBe(true);
    });

    it('prevents duplicate initialization when script is loaded twice', () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      expect(document.querySelectorAll('.cloudtasker-decoder-container')).toHaveLength(1);

      // Simulate second injection (e.g. from background service worker)
      jest.resetModules();
      require('../src/content.js');

      // Still only one container — second load was a no-op
      expect(document.querySelectorAll('.cloudtasker-decoder-container')).toHaveLength(1);
    });
  });

  describe('MutationObserver', () => {
    it('processes dialogs added after initial load', async () => {
      loadExtension();
      expect(document.querySelector('.cloudtasker-decoder-container')).toBeNull();

      // Add a dialog after the script is loaded
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.innerHTML = `<textarea>${VALID_BASE64}</textarea>`;
      document.body.appendChild(dialog);

      // Flush microtasks (MutationObserver callback)
      await Promise.resolve();
      // Advance past the 100ms debounce
      jest.advanceTimersByTime(100);

      expect(document.querySelector('.cloudtasker-decoder-container')).not.toBeNull();
    });

    it('debounces rapid DOM mutations', async () => {
      document.body.innerHTML = buildDialog(
        `<textarea>${VALID_BASE64}</textarea>`
      );
      loadExtension();

      // Remove the container to allow reprocessing
      document.querySelector('.cloudtasker-decoder-container').remove();
      document.querySelector('textarea').removeAttribute('data-cloudtasker-decoded');

      // Trigger multiple rapid mutations
      for (let i = 0; i < 5; i++) {
        const span = document.createElement('span');
        document.body.appendChild(span);
      }

      // Flush microtasks
      await Promise.resolve();
      // Only 100ms needed — debounce resets on each mutation
      jest.advanceTimersByTime(100);

      // Should still only produce one container
      expect(document.querySelectorAll('.cloudtasker-decoder-container')).toHaveLength(1);
    });
  });
});
