const { getElementText, findElementToHide } = require('../src/dom-helpers');

describe('getElementText', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns value for textarea elements', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'test content';
    expect(getElementText(textarea)).toBe('test content');
  });

  it('returns empty string for empty textarea', () => {
    const textarea = document.createElement('textarea');
    expect(getElementText(textarea)).toBe('');
  });

  it('returns textContent for div elements', () => {
    const div = document.createElement('div');
    div.textContent = 'div content';
    expect(getElementText(div)).toBe('div content');
  });

  it('returns textContent for pre elements', () => {
    const pre = document.createElement('pre');
    pre.textContent = 'pre content';
    expect(getElementText(pre)).toBe('pre content');
  });

  it('returns textContent for code elements', () => {
    const code = document.createElement('code');
    code.textContent = 'code content';
    expect(getElementText(code)).toBe('code content');
  });

  it('returns empty string for element with no content', () => {
    const div = document.createElement('div');
    expect(getElementText(div)).toBe('');
  });

  it('prefers value over textContent for textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'from value';
    textarea.textContent = 'from textContent';
    expect(getElementText(textarea)).toBe('from value');
  });

  it('returns textContent for input elements', () => {
    const input = document.createElement('input');
    input.value = 'input value';
    expect(getElementText(input)).toBe('');
  });
});

describe('findElementToHide', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the element itself when no cfc wrapper exists', () => {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    expect(findElementToHide(textarea)).toBe(textarea);
  });

  it('returns cfc-code-editor parent when present', () => {
    document.body.innerHTML = `
      <cfc-code-editor>
        <div>
          <textarea id="target"></textarea>
        </div>
      </cfc-code-editor>
    `;
    const textarea = document.getElementById('target');
    const codeEditor = document.querySelector('cfc-code-editor');
    expect(findElementToHide(textarea)).toBe(codeEditor);
  });

  it('returns cfc-code-snippet parent when present', () => {
    document.body.innerHTML = `
      <cfc-code-snippet>
        <pre id="target">content</pre>
      </cfc-code-snippet>
    `;
    const pre = document.getElementById('target');
    const codeSnippet = document.querySelector('cfc-code-snippet');
    expect(findElementToHide(pre)).toBe(codeSnippet);
  });

  it('prefers cfc-code-editor over cfc-code-snippet when both present', () => {
    document.body.innerHTML = `
      <cfc-code-editor>
        <cfc-code-snippet>
          <textarea id="target"></textarea>
        </cfc-code-snippet>
      </cfc-code-editor>
    `;
    const textarea = document.getElementById('target');
    const codeEditor = document.querySelector('cfc-code-editor');
    expect(findElementToHide(textarea)).toBe(codeEditor);
  });

  it('handles deeply nested elements', () => {
    document.body.innerHTML = `
      <cfc-code-editor>
        <div><div><div>
          <textarea id="target"></textarea>
        </div></div></div>
      </cfc-code-editor>
    `;
    const textarea = document.getElementById('target');
    const codeEditor = document.querySelector('cfc-code-editor');
    expect(findElementToHide(textarea)).toBe(codeEditor);
  });
});

describe('GCP dialog structure', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('works with actual Cloud Console DOM structure', () => {
    document.body.innerHTML = `
      <div role="dialog">
        <h1>Task 123456789</h1>
        <div class="mat-tab-body">
          <cfc-code-editor>
            <canvas></canvas>
            <textarea>eyJ3b3JrZXIiOiJUZXN0V29ya2VyIn0=</textarea>
          </cfc-code-editor>
        </div>
      </div>
    `;

    const textarea = document.querySelector('textarea');
    const codeEditor = document.querySelector('cfc-code-editor');

    expect(findElementToHide(textarea)).toBe(codeEditor);
    expect(getElementText(textarea)).toBe('eyJ3b3JrZXIiOiJUZXN0V29ya2VyIn0=');
  });
});
