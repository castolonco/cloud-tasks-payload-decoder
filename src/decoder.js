// Base64 decoding and JSON syntax highlighting for Cloud Tasks payloads

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Decodes base64 JSON, stripping whitespace/newlines that GCP console adds
function tryDecodeBase64Json(text) {
  if (!text || typeof text !== 'string') return null;

  const cleaned = text.replace(/[^A-Za-z0-9+/=]/g, '');
  if (cleaned.length < 20) return null;

  try {
    return JSON.parse(atob(cleaned));
  } catch (e) {
    return null;
  }
}

function syntaxHighlight(obj, indent = 0) {
  const spaces = '  '.repeat(indent);

  if (obj === null) {
    return '<span class="cloudtasker-null">null</span>';
  }

  if (typeof obj === 'boolean') {
    return `<span class="cloudtasker-boolean">${obj}</span>`;
  }

  if (typeof obj === 'number') {
    return `<span class="cloudtasker-number">${obj}</span>`;
  }

  if (typeof obj === 'string') {
    return `<span class="cloudtasker-string">"${escapeHtml(obj)}"</span>`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return '<span class="cloudtasker-bracket">[]</span>';
    }

    const items = obj.map(item => {
      return spaces + '  ' + syntaxHighlight(item, indent + 1);
    });

    return '<span class="cloudtasker-bracket">[</span>\n' +
           items.join(',\n') + '\n' +
           spaces + '<span class="cloudtasker-bracket">]</span>';
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '<span class="cloudtasker-brace">{}</span>';
    }

    const items = keys.map(key => {
      return spaces + '  ' +
             `<span class="cloudtasker-key">"${escapeHtml(key)}"</span>` +
             '<span class="cloudtasker-colon">: </span>' +
             syntaxHighlight(obj[key], indent + 1);
    });

    return '<span class="cloudtasker-brace">{</span>\n' +
           items.join(',\n') + '\n' +
           spaces + '<span class="cloudtasker-brace">}</span>';
  }

  return String(obj);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tryDecodeBase64Json, syntaxHighlight, escapeHtml };
}

if (typeof window !== 'undefined') {
  window.CloudTasksDecoder = { tryDecodeBase64Json, syntaxHighlight };
}
