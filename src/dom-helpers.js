// DOM utilities for extracting and manipulating payload elements

function getElementText(element) {
  if (element.tagName === 'TEXTAREA') {
    return element.value || '';
  }
  return element.textContent || '';
}

function findElementToHide(element) {
  // GCP wraps textareas in cfc-code-editor - hide the whole component
  const codeEditor = element.closest('cfc-code-editor') || element.closest('cfc-code-snippet');
  if (codeEditor) {
    return codeEditor;
  }
  return element;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getElementText, findElementToHide };
}

if (typeof window !== 'undefined') {
  window.CloudTasksDomHelpers = { getElementText, findElementToHide };
}
