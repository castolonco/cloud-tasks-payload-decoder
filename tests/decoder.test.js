const { tryDecodeBase64Json, syntaxHighlight, escapeHtml } = require('../src/decoder');

describe('tryDecodeBase64Json', () => {
  describe('valid base64 JSON', () => {
    it('decodes a simple cloudtasker payload', () => {
      const payload = {
        worker: 'MyWorker',
        job_queue: 'default',
        job_id: '123-456-789',
        job_meta: {},
        job_args: [1, 2, 3]
      };
      const encoded = btoa(JSON.stringify(payload));
      expect(tryDecodeBase64Json(encoded)).toEqual(payload);
    });

    it('decodes base64 with newlines', () => {
      const payload = { worker: 'TestWorker', job_args: [] };
      const encoded = btoa(JSON.stringify(payload));
      const withNewlines = encoded.match(/.{1,64}/g).join('\n');
      expect(tryDecodeBase64Json(withNewlines)).toEqual(payload);
    });

    it('decodes base64 with spaces and tabs', () => {
      const payload = { worker: 'TestWorker' };
      const encoded = btoa(JSON.stringify(payload));
      const withWhitespace = `  ${encoded.slice(0, 10)}  \t  ${encoded.slice(10)}  `;
      expect(tryDecodeBase64Json(withWhitespace)).toEqual(payload);
    });

    it('decodes complex nested payload', () => {
      const payload = {
        worker: 'Payments::ProcessRefund',
        job_queue: 'payments-high',
        job_id: 'abc-123',
        job_meta: {
          'cloudtasker/cron/job/schedule_id': 'daily_cleanup',
          'cloudtasker/cron/job/time_at': '2026-01-18T01:00:00-06:00'
        },
        job_args: [{ user_id: 123, amount: 99.99 }]
      };
      const encoded = btoa(JSON.stringify(payload));
      expect(tryDecodeBase64Json(encoded)).toEqual(payload);
    });
  });

  describe('invalid input', () => {
    it('returns null for null input', () => {
      expect(tryDecodeBase64Json(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(tryDecodeBase64Json(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(tryDecodeBase64Json('')).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(tryDecodeBase64Json(123)).toBeNull();
      expect(tryDecodeBase64Json({})).toBeNull();
      expect(tryDecodeBase64Json([])).toBeNull();
    });

    it('returns null for string too short', () => {
      expect(tryDecodeBase64Json('abc')).toBeNull();
    });

    it('returns null for invalid base64', () => {
      expect(tryDecodeBase64Json('not-valid-base64!!!')).toBeNull();
    });

    it('returns null for valid base64 but not JSON', () => {
      const encoded = btoa('this is plain text, not JSON');
      expect(tryDecodeBase64Json(encoded)).toBeNull();
    });
  });
});

describe('syntaxHighlight', () => {
  describe('primitive values', () => {
    it('highlights null', () => {
      expect(syntaxHighlight(null)).toBe('<span class="cloudtasker-null">null</span>');
    });

    it('highlights boolean true', () => {
      expect(syntaxHighlight(true)).toBe('<span class="cloudtasker-boolean">true</span>');
    });

    it('highlights boolean false', () => {
      expect(syntaxHighlight(false)).toBe('<span class="cloudtasker-boolean">false</span>');
    });

    it('highlights numbers', () => {
      expect(syntaxHighlight(42)).toBe('<span class="cloudtasker-number">42</span>');
      expect(syntaxHighlight(3.14)).toBe('<span class="cloudtasker-number">3.14</span>');
      expect(syntaxHighlight(-100)).toBe('<span class="cloudtasker-number">-100</span>');
    });

    it('highlights strings with quotes', () => {
      expect(syntaxHighlight('hello')).toBe('<span class="cloudtasker-string">"hello"</span>');
    });

    it('escapes HTML in strings', () => {
      const result = syntaxHighlight('<script>alert("xss")</script>');
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('arrays', () => {
    it('highlights empty array', () => {
      expect(syntaxHighlight([])).toBe('<span class="cloudtasker-bracket">[]</span>');
    });

    it('highlights array with items', () => {
      const result = syntaxHighlight([1, 2, 3]);
      expect(result).toContain('<span class="cloudtasker-bracket">[</span>');
      expect(result).toContain('<span class="cloudtasker-bracket">]</span>');
      expect(result).toContain('<span class="cloudtasker-number">1</span>');
    });
  });

  describe('objects', () => {
    it('highlights empty object', () => {
      expect(syntaxHighlight({})).toBe('<span class="cloudtasker-brace">{}</span>');
    });

    it('highlights object with properties', () => {
      const result = syntaxHighlight({ name: 'test', count: 5 });
      expect(result).toContain('<span class="cloudtasker-brace">{</span>');
      expect(result).toContain('<span class="cloudtasker-brace">}</span>');
      expect(result).toContain('<span class="cloudtasker-key">"name"</span>');
      expect(result).toContain('<span class="cloudtasker-string">"test"</span>');
      expect(result).toContain('<span class="cloudtasker-number">5</span>');
    });

    it('escapes HTML in object keys', () => {
      const result = syntaxHighlight({ '<script>': 'value' });
      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('nested structures', () => {
    it('highlights nested objects and arrays', () => {
      const result = syntaxHighlight({
        worker: 'Test',
        args: [1, { nested: true }]
      });
      expect(result).toContain('<span class="cloudtasker-key">"worker"</span>');
      expect(result).toContain('<span class="cloudtasker-key">"args"</span>');
      expect(result).toContain('<span class="cloudtasker-key">"nested"</span>');
      expect(result).toContain('<span class="cloudtasker-boolean">true</span>');
    });

    it('applies correct indentation', () => {
      const result = syntaxHighlight({ outer: { inner: 'value' } });
      const lines = result.split('\n');
      expect(lines[0]).toBe('<span class="cloudtasker-brace">{</span>');
      expect(lines[1]).toMatch(/^ {2}<span class="cloudtasker-key">"outer"<\/span>/);
      expect(lines[2]).toMatch(/^ {4}<span class="cloudtasker-key">"inner"<\/span>/);
    });
  });

  describe('edge cases', () => {
    it('handles undefined by converting to string', () => {
      expect(syntaxHighlight(undefined)).toBe('undefined');
    });

    it('handles functions by converting to string', () => {
      expect(syntaxHighlight(function test() {})).toContain('function');
    });
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes less than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes greater than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes all special characters together', () => {
    expect(escapeHtml('<div class="test">A & B</div>'))
      .toBe('&lt;div class=&quot;test&quot;&gt;A &amp; B&lt;/div&gt;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns string with no special chars unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});
