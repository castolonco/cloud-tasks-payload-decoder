// Inject content scripts into already-open GCP tabs on install/update/enable.
// Content scripts declared in manifest.json only run on new page loads,
// so existing tabs need manual injection.

function injectIntoExistingTabs() {
  chrome.tabs.query({ url: 'https://console.cloud.google.com/*' }, (tabs) => {
    for (const tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/decoder.js', 'src/dom-helpers.js', 'src/content.js']
      }).catch(() => {
        // Tab may have been closed or is not injectable — ignore
      });
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['src/styles.css']
      }).catch(() => {});
    }
  });
}

chrome.runtime.onInstalled.addListener(injectIntoExistingTabs);
chrome.runtime.onStartup.addListener(injectIntoExistingTabs);
