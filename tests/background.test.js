describe('background service worker', () => {
  let onInstalledCallback;
  let onStartupCallback;

  beforeEach(() => {
    jest.resetModules();

    onInstalledCallback = null;
    onStartupCallback = null;

    global.chrome = {
      tabs: {
        query: jest.fn()
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue(undefined),
        insertCSS: jest.fn().mockResolvedValue(undefined)
      },
      runtime: {
        onInstalled: {
          addListener: jest.fn(cb => { onInstalledCallback = cb; })
        },
        onStartup: {
          addListener: jest.fn(cb => { onStartupCallback = cb; })
        }
      }
    };
  });

  afterEach(() => {
    delete global.chrome;
  });

  function loadBackground() {
    require('../src/background.js');
  }

  it('registers onInstalled listener', () => {
    loadBackground();
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    expect(typeof onInstalledCallback).toBe('function');
  });

  it('registers onStartup listener', () => {
    loadBackground();
    expect(chrome.runtime.onStartup.addListener).toHaveBeenCalledTimes(1);
    expect(typeof onStartupCallback).toBe('function');
  });

  describe('injectIntoExistingTabs', () => {
    it('queries for GCP tabs', () => {
      loadBackground();
      onInstalledCallback();

      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { url: 'https://console.cloud.google.com/*' },
        expect.any(Function)
      );
    });

    it('injects scripts and CSS into each matching tab', () => {
      loadBackground();

      const tabs = [
        { id: 1 },
        { id: 2 }
      ];
      chrome.tabs.query.mockImplementation((query, callback) => callback(tabs));

      onInstalledCallback();

      expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: ['src/decoder.js', 'src/dom-helpers.js', 'src/content.js']
      });
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 2 },
        files: ['src/decoder.js', 'src/dom-helpers.js', 'src/content.js']
      });

      expect(chrome.scripting.insertCSS).toHaveBeenCalledTimes(2);
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: ['src/styles.css']
      });
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 2 },
        files: ['src/styles.css']
      });
    });

    it('handles no matching tabs', () => {
      loadBackground();
      chrome.tabs.query.mockImplementation((query, callback) => callback([]));

      onInstalledCallback();

      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
      expect(chrome.scripting.insertCSS).not.toHaveBeenCalled();
    });

    it('handles executeScript rejection gracefully', () => {
      loadBackground();

      chrome.scripting.executeScript.mockRejectedValue(new Error('Tab closed'));
      chrome.tabs.query.mockImplementation((query, callback) => callback([{ id: 1 }]));

      // Should not throw
      expect(() => onInstalledCallback()).not.toThrow();
    });

    it('handles insertCSS rejection gracefully', () => {
      loadBackground();

      chrome.scripting.insertCSS.mockRejectedValue(new Error('Tab closed'));
      chrome.tabs.query.mockImplementation((query, callback) => callback([{ id: 1 }]));

      expect(() => onInstalledCallback()).not.toThrow();
    });

    it('works the same for onStartup as onInstalled', () => {
      loadBackground();

      const tabs = [{ id: 42 }];
      chrome.tabs.query.mockImplementation((query, callback) => callback(tabs));

      onStartupCallback();

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 42 },
        files: ['src/decoder.js', 'src/dom-helpers.js', 'src/content.js']
      });
      expect(chrome.scripting.insertCSS).toHaveBeenCalledWith({
        target: { tabId: 42 },
        files: ['src/styles.css']
      });
    });
  });
});
