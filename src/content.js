// Content script that detects Cloud Tasks dialogs and decodes base64 payloads

(function() {
  'use strict';

  const PROCESSED_ATTR = 'data-cloudtasker-decoded';
  const { getElementText, findElementToHide } = window.CloudTasksDomHelpers;

  function createDecodedDisplay(rawText, decodedJson) {
    const container = document.createElement('div');
    container.className = 'cloudtasker-decoder-container';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'cloudtasker-toggle-btn';
    toggleBtn.textContent = 'Show Raw Base64';
    toggleBtn.type = 'button';

    const decodedView = document.createElement('pre');
    decodedView.className = 'cloudtasker-decoded-view';
    decodedView.innerHTML = CloudTasksDecoder.syntaxHighlight(decodedJson);

    const rawView = document.createElement('pre');
    rawView.className = 'cloudtasker-raw-view';
    rawView.style.display = 'none';
    rawView.textContent = rawText;

    let showingDecoded = true;
    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      showingDecoded = !showingDecoded;

      if (showingDecoded) {
        decodedView.style.display = 'block';
        rawView.style.display = 'none';
        toggleBtn.textContent = 'Show Raw Base64';
      } else {
        decodedView.style.display = 'none';
        rawView.style.display = 'block';
        toggleBtn.textContent = 'Show Decoded JSON';
      }
    });

    container.appendChild(toggleBtn);
    container.appendChild(decodedView);
    container.appendChild(rawView);

    return container;
  }

  let isProcessing = false;

  function processPayloadElement(element) {
    if (element.hasAttribute(PROCESSED_ATTR)) return;

    const elementToHide = findElementToHide(element);
    if (elementToHide.hasAttribute(PROCESSED_ATTR)) return;
    if (elementToHide.parentNode.querySelector('.cloudtasker-decoder-container')) return;

    const text = getElementText(element);
    const decoded = CloudTasksDecoder.tryDecodeBase64Json(text);

    if (decoded) {
      element.setAttribute(PROCESSED_ATTR, 'true');
      elementToHide.setAttribute(PROCESSED_ATTR, 'true');

      const display = createDecodedDisplay(text, decoded);
      elementToHide.style.display = 'none';
      elementToHide.parentNode.insertBefore(display, elementToHide.nextSibling);
    }
  }

  function findAndProcessPayloads() {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return;
      if (dialog.querySelector('.cloudtasker-decoder-container')) return;

      const candidates = dialog.querySelectorAll('textarea, pre, code');

      candidates.forEach(el => {
        if (el.hasAttribute(PROCESSED_ATTR)) return;

        const text = getElementText(el).trim();
        if (text.length > 20) {
          processPayloadElement(el);
        }
      });
    } finally {
      isProcessing = false;
    }
  }

  function setupObserver() {
    const observer = new MutationObserver(function() {
      clearTimeout(observer._timeout);
      observer._timeout = setTimeout(findAndProcessPayloads, 100);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    findAndProcessPayloads();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }

  // Handle SPA navigation
  let lastUrl = location.href;
  new MutationObserver(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(findAndProcessPayloads, 500);
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
