/**
 * Tiny, dependency-free syntax highlighter for read-only code views.
 *
 * Safety contract: the tokenizer never produces markup. It returns `[className | null, text]`
 * pairs, and `paintTokens` turns them into DOM nodes with `textContent`, so user-authored text
 * (page titles, props, custom CSS, SVG markup inside JSON, ...) is never parsed as HTML.
 */

export type CodeLang = 'svelte' | 'html' | 'ts' | 'css' | 'json' | 'markdown' | 'text';

type Classifier = string | ((match: string) => string | null);
interface Rule {
  re: RegExp;
  cls: Classifier;
}

/** Inputs above this size are escaped but not tokenized (keeps the dialog responsive). */
const MAX_HIGHLIGHT_CHARS = 400_000;

const JS_KEYWORDS = new Set([
  'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return', 'if', 'else',
  'for', 'of', 'in', 'while', 'switch', 'case', 'break', 'continue', 'new', 'class', 'extends',
  'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'interface', 'type',
  'as', 'satisfies', 'void', 'this', 'each', 'snippet', 'render', 'html', 'const', 'key'
]);
const JS_LITERALS = new Set(['true', 'false', 'null', 'undefined']);

const rule = (re: RegExp, cls: Classifier): Rule => ({ re: new RegExp(re.source, `${re.flags.replace('y', '')}y`), cls });

const STRING_DQ = /"(?:[^"\\\n]|\\.)*"/;

const RULES: Record<Exclude<CodeLang, 'text'>, Rule[]> = {
  json: [
    rule(/"(?:[^"\\\n]|\\.)*"(?=\s*:)/, 'key'),
    rule(STRING_DQ, 'str'),
    rule(/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'num'),
    rule(/(?:true|false|null)\b/, 'lit'),
    rule(/[{}[\],:]/, 'punc')
  ],
  css: [
    rule(/\/\*[\s\S]*?\*\//, 'com'),
    rule(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, 'str'),
    rule(/@[\w-]+/, 'kw'),
    rule(/--[\w-]+/, 'var'),
    rule(/[a-zA-Z-]+(?=\s*:[^;{}]*[;}])/, 'prop'),
    rule(/[\w-]+(?=\()/, 'fn'),
    rule(/#[0-9a-fA-F]{3,8}(?![\w-])/, 'num'),
    rule(/-?(?:\d*\.)?\d+(?:px|rem|em|%|vh|vw|vmin|vmax|ms|s|fr|deg|ch)?/, 'num'),
    rule(/[\w-]+/, () => null),
    rule(/[{}();:,]/, 'punc')
  ],
  svelte: [
    rule(/<!--[\s\S]*?-->/, 'com'),
    rule(/(?<![:\w"'/])\/\/[^\n]*/, 'com'),
    rule(/\/\*[\s\S]*?\*\//, 'com'),
    rule(/<\/?[A-Za-z][\w.:-]*/, 'tag'),
    rule(/\/?>/, 'tag'),
    rule(/\{[#:/@][a-z]+/, 'kw'),
    rule(/"(?:[^"\\]|\\.)*"|(?<!\w)'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/, 'str'),
    rule(/[\w:@|-]+(?==)/, 'attr'),
    rule(/\$[a-z]+(?:\.[a-z]+)?/, 'fn'),
    rule(/[A-Za-z_][\w$]*/, (m) => (JS_KEYWORDS.has(m) ? 'kw' : JS_LITERALS.has(m) ? 'lit' : null)),
    rule(/\d+(?:\.\d+)?/, 'num'),
    rule(/[{}]/, 'punc')
  ],
  html: [],
  ts: [],
  markdown: [
    rule(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/m, 'code'),
    rule(/^#{1,6} [^\n]*/m, 'head'),
    rule(/^>[^\n]*/m, 'com'),
    rule(/^[ \t]*(?:[-*+]|\d+\.)(?= )/m, 'kw'),
    rule(/^(?:-{3,}|\*{3,})[ \t]*$/m, 'punc'),
    rule(/`[^`\n]+`/, 'code'),
    rule(/\*\*[^*\n]+\*\*/, 'strong'),
    rule(/\[[^\]\n]+\]\([^)\n]+\)/, 'link'),
    rule(/\|/, 'punc'),
    rule(/[^\s`*[|#>\-\d]+/, () => null)
  ]
};
RULES.html = RULES.svelte;
RULES.ts = RULES.svelte.filter((r) => r.cls !== 'tag' && r.cls !== 'attr');

export type Token = [cls: string | null, text: string];

function tokenize(code: string, rules: Rule[]): Token[] {
  const out: Token[] = [];
  let plain = '';
  let i = 0;
  const n = code.length;
  outer: while (i < n) {
    for (const r of rules) {
      r.re.lastIndex = i;
      const m = r.re.exec(code);
      if (m && m[0].length > 0) {
        const cls = typeof r.cls === 'function' ? r.cls(m[0]) : r.cls;
        if (cls) {
          if (plain) {
            out.push([null, plain]);
            plain = '';
          }
          out.push([cls, m[0]]);
        } else {
          plain += m[0];
        }
        i += m[0].length;
        continue outer;
      }
    }
    plain += code[i];
    i += 1;
  }
  if (plain) out.push([null, plain]);
  return out;
}

/** Splits code into classified tokens. Concatenating every token's text yields `code` exactly. */
export function tokenizeCode(code: string, lang: CodeLang): Token[] {
  if (lang === 'text' || code.length > MAX_HIGHLIGHT_CHARS) return [[null, code]];
  return tokenize(code, RULES[lang]);
}

/** Replaces `el`'s children with token spans built via `textContent` (no HTML parsing). */
export function paintTokens(el: HTMLElement, tokens: Token[]): void {
  const frag = document.createDocumentFragment();
  for (const [cls, text] of tokens) {
    if (cls) {
      const span = document.createElement('span');
      span.className = `tk-${cls}`;
      span.textContent = text;
      frag.append(span);
    } else {
      frag.append(text);
    }
  }
  el.replaceChildren(frag);
}

/** Picks a language from a file name. */
export function langFromFilename(name: string): CodeLang {
  const lower = name.toLowerCase();
  if (lower.endsWith('.svelte')) return 'svelte';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.md')) return 'markdown';
  if (/\.(ts|js|mjs|cjs|tsx|jsx)$/.test(lower)) return 'ts';
  return 'text';
}
