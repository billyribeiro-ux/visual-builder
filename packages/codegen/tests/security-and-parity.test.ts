import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import {
  createDefaultAcmeSaaSProject,
  createNode,
  type BlueprintNode,
  type PageRoute,
  type ProjectBlueprint
} from '@app-viz/schema';
import { generateFullExport, normalizeRoutePath, normalizeAssetPath, dedupePaths } from '../src/generator.js';
import { generatePageRoute, sanitizeHref, safeJson } from '../src/routes.js';
import { generateAppHtml, generatePackageJson } from '../src/project-files.js';
import { getComponentSources } from '../src/components.js';
import { generateAppCss } from '../src/tokens.js';

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const BRACES = '{alert(1)}';
const QUOTES = '"quotes"';
const SCRIPT_BREAKOUT = '</script><script>alert(1)</script>';
const JS_HREF = 'javascript:alert(1)';

function makePage(path: string, rootNode: BlueprintNode, title = 'Fixture', description = ''): PageRoute {
  return {
    id: globalThis.crypto.randomUUID(),
    path,
    slug: path.replace(/\W+/g, '-') || 'home',
    title,
    description,
    isDynamic: false,
    rootNode,
    seo: {}
  } as PageRoute;
}

function withPages(pages: PageRoute[]): ProjectBlueprint {
  const project = createDefaultAcmeSaaSProject();
  return { ...project, pages: [...project.pages, ...pages] };
}

function maliciousRoot(): BlueprintNode {
  return createNode({
    componentType: 'structure/container',
    name: 'Root',
    props: { maxWidth: 'xl', gap: '1rem; background: url(javascript:alert(1))' },
    styles: {
      base: {
        color: 'red',
        background: 'url(javascript:alert(1))',
        width: '1px}</style><script>alert(1)</script>',
        // eslint-disable-next-line no-script-url
        height: 'expression(alert(1))'
      }
    },
    customClasses: 'safe-class x" onclick="alert(1)',
    interactions: [
      {
        id: 'r1',
        trigger: 'onClick',
        actionType: 'openModal',
        payload: { modalTitle: SCRIPT_BREAKOUT, modalBody: BRACES, path: JS_HREF }
      }
    ],
    children: [
      createNode({
        componentType: 'ui/button',
        name: 'Evil Button',
        props: { text: BRACES, href: JS_HREF, variant: 'primary" onclick="x', size: 'md' }
      }),
      createNode({
        componentType: 'ui/card',
        name: 'Evil Card',
        props: {
          title: QUOTES,
          body: SCRIPT_BREAKOUT,
          eyebrow: BRACES,
          ctaText: BRACES,
          ctaHref: '  JaVaScRiPt:alert(1)'
        }
      }),
      createNode({
        componentType: 'navigation/navbar',
        name: 'Evil Navbar',
        props: {
          brandName: SCRIPT_BREAKOUT,
          logoUrl: 'data:image/svg+xml,<svg onload=alert(1)>',
          links: [
            { label: BRACES, href: JS_HREF },
            { label: 'ok', href: 'vbscript:msgbox(1)' },
            { label: 'data', href: 'data:text/html,<script>alert(1)</script>' }
          ],
          ctaText: QUOTES,
          ctaHref: 'java\tscript:alert(1)'
        }
      }),
      createNode({
        componentType: 'structure/grid',
        name: 'Evil Grid',
        props: { columns: '9); alert(1); (', gap: 'lg' }
      }),
      createNode({
        componentType: 'marketing/feature-grid',
        name: 'Evil Features',
        props: {
          sectionTitle: SCRIPT_BREAKOUT,
          columns: 99,
          features: [{ icon: 'Zap', title: SCRIPT_BREAKOUT, description: '\u2028line\u2029sep' }]
        }
      })
    ]
  });
}

/* -------------------------------------------------------------------------- */
/* Optional: real Svelte compiler (resolved from the studio app)              */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let svelteCompiler: any = null;
try {
  const req = createRequire(new URL('../../../apps/studio/package.json', import.meta.url));
  svelteCompiler = await import(pathToFileURL(req.resolve('svelte/compiler')).href);
} catch {
  svelteCompiler = null;
}

interface AttrInfo {
  element: string;
  name: string;
  kind: 'static' | 'expression' | 'other';
  literal?: unknown;
  raw: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectAttributes(node: any, source: string, out: AttrInfo[] = []): AttrInfo[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const n of node) collectAttributes(n, source, out);
    return out;
  }
  if (Array.isArray(node.attributes)) {
    for (const attr of node.attributes) {
      if (attr.type !== 'Attribute') continue;
      const raw = source.slice(attr.start, attr.end);
      const value = attr.value;
      if (value === true) {
        out.push({ element: node.name, name: attr.name, kind: 'static', raw });
      } else if (!Array.isArray(value) && value?.type === 'ExpressionTag') {
        const expr = value.expression;
        out.push({
          element: node.name,
          name: attr.name,
          kind: 'expression',
          literal: expr.type === 'Literal' ? expr.value : undefined,
          raw
        });
      } else if (Array.isArray(value) && value.every((v: { type: string }) => v.type === 'Text')) {
        out.push({ element: node.name, name: attr.name, kind: 'static', raw });
      } else {
        out.push({ element: node.name, name: attr.name, kind: 'other', raw });
      }
    }
  }
  for (const key of ['fragment', 'nodes', 'children', 'body', 'consequent', 'alternate']) {
    if (node[key]) collectAttributes(node[key], source, out);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* (a) Injection safety                                                       */
/* -------------------------------------------------------------------------- */

describe('codegen output safety', () => {
  const page = makePage(
    '/evil',
    maliciousRoot(),
    `</title><script>alert(1)</script>${BRACES}`,
    `"><script>alert(1)</script>${BRACES}`
  );
  const project = withPages([page]);
  const out = generatePageRoute(page, project);

  it('never emits javascript:/vbscript:/data: URLs', () => {
    expect(out.toLowerCase()).not.toContain('javascript:');
    expect(out.toLowerCase()).not.toContain('java\tscript:');
    expect(out.toLowerCase()).not.toContain('vbscript:');
    expect(out.toLowerCase()).not.toContain('data:');
    expect(out).toContain('ctaHref={"#"}');
    expect(out).toContain('href={"#"}');
  });

  it('cannot break out of <script>: exactly one </script> and no raw "<script>alert"', () => {
    expect(out.match(/<\/script/gi)?.length).toBe(1);
    expect(out).not.toContain('<script>alert');
    const script = out.slice(0, out.indexOf('</script>'));
    const rulesLine = script.split('\n').find((l) => l.includes('const interactionRules ='));
    expect(rulesLine).toBeDefined();
    expect(rulesLine).not.toContain('<');
    expect(rulesLine).toContain('\\u003c/script>');
    // navigate path inside the runtime payload is sanitized too
    expect(rulesLine).toContain('"path":"#"');
  });

  it('emits every text prop only inside {"..."} JS string expressions', () => {
    // Exact, escaped forms.
    expect(out).toContain(`title={${JSON.stringify(QUOTES)}}`);
    expect(out).toContain(`>{${JSON.stringify(BRACES)}}</Button>`);
    expect(out).toContain(`eyebrow={${JSON.stringify(BRACES)}}`);
    expect(out).toContain('body={"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}');

    // Never a quoted attribute carrying user data.
    expect(out).not.toMatch(/=\s*"[^"]*\{alert/);
    expect(out).not.toMatch(/\w+="\\"/);
    expect(out).not.toContain('title="');

    // Strip head (HTML-escaped separately), JS string expressions and JSON blobs:
    // nothing user-controlled may remain.
    const body = out
      .replace(/<svelte:head>[\s\S]*?<\/svelte:head>/, '')
      .replace(/const interactionRules = .*;/, '')
      .replace(/\{"(?:[^"\\]|\\.)*"\}/g, '{STR}')
      .replace(/=\{\[.*\]\}/g, '={JSON}');
    expect(body).not.toContain('alert(1)');
    expect(body).not.toContain('quotes');
  });

  it('HTML-escapes <svelte:head> title/description and neutralizes braces', () => {
    const head = out.slice(out.indexOf('<svelte:head>'), out.indexOf('</svelte:head>'));
    expect(head).toContain('<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;&#123;alert(1)&#125;</title>');
    expect(head).toContain('content="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;&#123;alert(1)&#125;"');
    expect(head).not.toContain('{alert');
  });

  it('sanitizes class, style, enums and numbers', () => {
    expect(out).toContain('class="safe-class x onclickalert1"');
    expect(out).not.toContain('onclick="');
    // dangerous style values dropped, safe ones kept, emitted as an expression
    expect(out).toContain('style={"color: red;"}');
    expect(out).not.toContain('expression(');
    expect(out).not.toContain('</style>');
    // unsafe gap dropped entirely
    expect(out).not.toMatch(/gap=\{"1rem;/);
    // enum fallback
    expect(out).toContain('variant={"primary"}');
    // numeric clamp / coercion
    expect(out).toContain('columns={3}'); // NaN → default
    expect(out).toContain('columns={4}'); // 99 → clamped
    // U+2028/2029 escaped
    expect(out).not.toMatch(/[\u2028\u2029]/);
    expect(out).toContain('\\u2028line\\u2029sep');
  });

  it('HTML-escapes app.html metadata', () => {
    const p = createDefaultAcmeSaaSProject();
    const html = generateAppHtml({
      ...p,
      meta: { ...p.meta, name: '</title><script>alert(1)</script>', description: '" onload="alert(1)' }
    });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('content="&quot; onload=&quot;alert(1)"');
  });

  it.skipIf(!svelteCompiler)('compiles with the real Svelte compiler; user data only in literal expressions', () => {
    // Throws on any syntax error (e.g. an unescaped brace or quote).
    svelteCompiler.compile(out, { generate: 'server', filename: 'Evil.svelte' });
    const ast = svelteCompiler.parse(out, { modern: true });
    const attrs = collectAttributes(ast.fragment, out);
    const componentAttrs = attrs.filter((a) => /^[A-Z]/.test(a.element));
    expect(componentAttrs.length).toBeGreaterThan(10);
    for (const a of componentAttrs) {
      expect(a.kind, `${a.element}.${a.name} must be an expression: ${a.raw}`).toBe('expression');
    }
    for (const a of attrs.filter((x) => x.kind === 'static')) {
      expect(a.raw).not.toMatch(/[{}]|<script|javascript:/i);
    }
    const cardTitle = componentAttrs.find((a) => a.element === 'Card' && a.name === 'title');
    expect(cardTitle?.literal).toBe(QUOTES);
    const cardBody = componentAttrs.find((a) => a.element === 'Card' && a.name === 'body');
    expect(cardBody?.literal).toBe(SCRIPT_BREAKOUT);
    const btnHref = componentAttrs.find((a) => a.element === 'Button' && a.name === 'href');
    expect(btnHref?.literal).toBe('#');
  });

  it.skipIf(!svelteCompiler)('every generated library component compiles', () => {
    for (const [file, source] of Object.entries(getComponentSources())) {
      expect(() => svelteCompiler.compile(source, { generate: 'client', filename: file }), file).not.toThrow();
    }
  });
});

describe('sanitizeHref / safeJson', () => {
  it.each([
    ['/pricing', '/pricing'],
    ['#features', '#features'],
    ['?tab=2', '?tab=2'],
    ['https://example.com/a', 'https://example.com/a'],
    ['http://example.com', 'http://example.com'],
    ['mailto:hi@example.com', 'mailto:hi@example.com'],
    ['tel:+15551234', 'tel:+15551234'],
    ['features', 'features'],
    ['javascript:alert(1)', '#'],
    [' JAVASCRIPT:alert(1)', '#'],
    ['java\nscript:alert(1)', '#'],
    ['data:text/html,x', '#'],
    ['vbscript:x', '#'],
    ['//evil.example', '#'],
    ['/\\evil.example', '#'],
    ['foo:bar/baz', '#']
  ])('%j → %j', (input, expected) => {
    expect(sanitizeHref(input)).toBe(expected);
  });

  it('safeJson escapes < and line separators', () => {
    expect(safeJson('</script>')).toBe('"\\u003c/script>"');
    expect(safeJson('a\u2028b\u2029')).toBe('"a\\u2028b\\u2029"');
    expect(JSON.parse(safeJson({ a: '</script>\u2028' }))).toEqual({ a: '</script>\u2028' });
  });
});

/* -------------------------------------------------------------------------- */
/* (b) Path safety                                                            */
/* -------------------------------------------------------------------------- */

describe('normalizeRoutePath', () => {
  it.each([
    ['/', ''],
    ['', ''],
    ['/pricing', 'pricing'],
    ['/pricing/', 'pricing'],
    ['//dashboard//settings//', 'dashboard/settings'],
    ['/../../etc/passwd', 'etc/passwd'],
    ['/a/./b/../c', 'a/b/c'],
    ['..', ''],
    ['/About Us', 'about-us'],
    ['/Blog/Hello World!!', 'blog/hello-world'],
    ['/blog/[slug]', 'blog/[slug]'],
    ['/docs/[...rest]', 'docs/[...rest]'],
    ['/shop/[[lang]]', 'shop/[[lang]]'],
    ['/x/[bad name]', 'x/[bad_name]'],
    ['/x/[a]b]', 'x/ab'],
    ['\\..\\windows\\system32', 'windows/system32'],
    ['/p?q=1#h', 'p'],
    ['/émoji/🚀', 'moji'],
    ['/under_score-dash', 'under_score-dash']
  ])('%j → %j', (input, expected) => {
    expect(normalizeRoutePath(input)).toBe(expected);
  });

  it('never produces traversal or absolute segments', () => {
    for (const p of ['../../x', '/..', '/./.', 'a/../../..', '/%2e%2e/x']) {
      const r = normalizeRoutePath(p);
      expect(r.startsWith('/')).toBe(false);
      expect(r.split('/')).not.toContain('..');
      expect(r.split('/')).not.toContain('.');
    }
  });

  it('dedupePaths suffixes collisions deterministically', () => {
    expect(dedupePaths(['pricing', 'pricing', 'pricing', 'pricing-2'])).toEqual([
      'pricing',
      'pricing-2',
      'pricing-3',
      'pricing-2-2'
    ]);
    expect(dedupePaths(['', ''])).toEqual(['', 'index-2']);
    expect(dedupePaths(['assets/logo.svg', 'assets/logo.svg'], true)).toEqual([
      'assets/logo.svg',
      'assets/logo-2.svg'
    ]);
  });

  it('normalizeAssetPath strips traversal and hidden files', () => {
    expect(normalizeAssetPath('/assets/Logo.svg')).toBe('assets/Logo.svg');
    expect(normalizeAssetPath('../../.ssh/id_rsa')).toBe('ssh/id_rsa');
    expect(normalizeAssetPath('assets//a b<c>.svg')).toBe('assets/a-b-c-.svg');
  });

  it('generateFullExport never overwrites pages that normalize to the same route and keeps zip paths safe', () => {
    const mk = (path: string, label: string) =>
      makePage(
        path,
        createNode({
          componentType: 'ui/badge',
          name: label,
          props: { text: label }
        })
      );
    const base = createDefaultAcmeSaaSProject();
    const project: ProjectBlueprint = {
      ...base,
      pages: [
        ...base.pages,
        mk('/Pricing/', 'dup-pricing'),
        mk('/../../../etc/evil', 'traversal'),
        mk('//features//', 'dup-features')
      ],
      assets: [
        ...(base.assets || []),
        { ...(base.assets || [])[0], id: globalThis.crypto.randomUUID(), localPath: '../../../evil.svg' }
      ]
    };
    const { files } = generateFullExport(project);
    const keys = Object.keys(files);
    for (const k of keys) {
      expect(k.split('/')).not.toContain('..');
      expect(k.startsWith('/')).toBe(false);
    }
    // Original pricing page preserved, duplicate suffixed.
    expect(files['generated-app/src/routes/pricing/+page.svelte']).toContain('<PricingTable');
    expect(files['generated-app/src/routes/pricing-2/+page.svelte']).toContain('"dup-pricing"');
    expect(files['generated-app/src/routes/features-2/+page.svelte']).toContain('"dup-features"');
    expect(files['generated-app/src/routes/etc/evil/+page.svelte']).toContain('"traversal"');
    expect(files['generated-app/static/evil.svg']).toBeDefined();
    const routes = JSON.parse(files['blueprint/routes.json']) as Array<{ path: string }>;
    expect(routes.map((r) => r.path)).toContain('/pricing-2');
  });
});

/* -------------------------------------------------------------------------- */
/* (c) Prop parity round-trip                                                 */
/* -------------------------------------------------------------------------- */

describe('canonical prop round-trip into generated markup', () => {
  const root = createNode({
    componentType: 'structure/section',
    name: 'Tone Section',
    props: {
      surfaceTone: 'primary-container',
      paddingY: 'xl',
      maxWidth: 'lg',
      direction: 'row',
      justify: 'space-between',
      align: 'center',
      textAlign: 'center',
      gap: '2rem'
    },
    styles: { base: { display: 'grid', gridTemplateColumns: '1fr 1fr', paddingTop: '10px' } },
    children: [
      createNode({
        componentType: 'ui/card',
        name: 'Card',
        props: { title: 'Card Title', ctaText: 'Read the docs', ctaHref: '/docs', align: 'center' }
      }),
      createNode({
        componentType: 'ui/card',
        name: 'Legacy Card',
        props: { title: 'Legacy', actionText: 'Legacy action', actionHref: '/legacy' }
      }),
      createNode({
        componentType: 'structure/divider',
        name: 'Divider',
        props: { spacing: 'lg', label: 'OR CONTINUE WITH' }
      }),
      createNode({
        componentType: 'marketing/contact-form',
        name: 'Contact',
        props: {
          sectionEyebrow: 'Reach out',
          sectionTitle: 'Talk to sales',
          sectionSubtitle: 'We reply within a day',
          submitText: 'Send it'
        }
      }),
      createNode({
        componentType: 'app/auth-card',
        name: 'Auth',
        props: { mode: 'signup', brandName: 'Globex', title: 'Join Globex', subtitle: '', redirectHref: '/app' }
      }),
      createNode({
        componentType: 'ui/alert',
        name: 'Alert',
        props: { tone: 'warning', title: 'Heads up', message: 'Careful', dismissible: true }
      }),
      createNode({
        componentType: 'marketing/cta-banner',
        name: 'CTA',
        props: { eyebrow: 'Limited offer', title: 'Go', primaryCtaText: 'Start', primaryCtaHref: '/start' }
      }),
      createNode({
        componentType: 'hero/split-hero',
        name: 'Hero',
        props: { title: 'Centered', align: 'center' }
      }),
      createNode({
        componentType: 'structure/grid',
        name: 'Grid',
        props: { columns: 2, gap: 'lg', alignItems: 'center' }
      }),
      createNode({
        componentType: 'app/dashboard-shell',
        name: 'Shell',
        props: { title: 'Ops', activeNav: 'settings' },
        styles: { base: { minHeight: '50vh' } }
      })
    ]
  });
  const page = makePage('/parity', root);
  const out = generatePageRoute(page, withPages([page]));

  it('Section surfaceTone + layout props + contentStyle', () => {
    expect(out).toContain('surfaceTone={"primary-container"}');
    expect(out).not.toMatch(/<Section[^>]*\bvariant=/);
    expect(out).toContain('paddingY={"xl"}');
    expect(out).toContain('maxWidth={"lg"}');
    expect(out).toContain('direction={"row"}');
    expect(out).toContain('justify={"space-between"}');
    expect(out).toContain('align={"center"}');
    expect(out).toContain('textAlign={"center"}');
    expect(out).toContain('gap={"2rem"}');
    expect(out).toContain('contentStyle={"display: grid; grid-template-columns: 1fr 1fr;"}');
    expect(out).toContain('style={"display: grid; grid-template-columns: 1fr 1fr; padding-top: 10px;"}');
  });

  it('Card ctaText/ctaHref/align (and legacy actionText alias)', () => {
    expect(out).toContain('ctaText={"Read the docs"}');
    expect(out).toContain('ctaHref={"/docs"}');
    expect(out).toContain('ctaText={"Legacy action"}');
    expect(out).toContain('ctaHref={"/legacy"}');
    expect(out).not.toContain('actionText=');
  });

  it('Divider spacing/label', () => {
    expect(out).toContain('<Divider');
    expect(out).toContain('spacing={"lg"}');
    expect(out).toContain('label={"OR CONTINUE WITH"}');
  });

  it('ContactForm section* props', () => {
    expect(out).toContain('sectionEyebrow={"Reach out"}');
    expect(out).toContain('sectionTitle={"Talk to sales"}');
    expect(out).toContain('sectionSubtitle={"We reply within a day"}');
    expect(out).toContain('submitText={"Send it"}');
  });

  it('AuthCard, Alert, CtaBanner, SplitHero, Grid, DashboardShell props', () => {
    expect(out).toContain('mode={"signup"}');
    expect(out).toContain('brandName={"Globex"}');
    expect(out).toContain('tone={"warning"}');
    expect(out).toContain('dismissible={true}');
    expect(out).toContain('eyebrow={"Limited offer"}');
    expect(out).toContain('align={"center"}');
    expect(out).toMatch(/<Grid[\s\S]*?columns=\{2\}[\s\S]*?gap=\{"lg"\}/);
    expect(out).toMatch(/<DashboardShell[\s\S]*?style=\{"min-height: 50vh;"\}/);
  });

  it('generated components accept the canonical props', () => {
    const c = getComponentSources();
    const section = c['src/lib/components/Section.svelte'];
    expect(section).toContain('surfaceTone');
    expect(section).toContain('contentStyle');
    const card = c['src/lib/components/Card.svelte'];
    expect(card).toContain('ctaText');
    expect(card).toContain('actionText');
    expect(card).toContain("align === 'center'");
    const divider = c['src/lib/components/Divider.svelte'];
    expect(divider).toContain("spacing?: 'sm' | 'md' | 'lg'");
    expect(divider).toContain('{label}');
    const contact = c['src/lib/components/ContactForm.svelte'];
    for (const prop of ['sectionEyebrow', 'sectionTitle', 'sectionSubtitle', 'submitText']) {
      expect(contact).toContain(`{${prop}}`);
    }
    const auth = c['src/lib/components/AuthCard.svelte'];
    expect(auth).toContain("mode?: 'signin' | 'signup'");
    expect(auth).toContain('{brandName}');
    const alert = c['src/lib/components/Alert.svelte'];
    expect(alert).toContain('warning:');
    expect(alert).toContain('{#if dismissible}');
    const grid = c['src/lib/components/Grid.svelte'];
    expect(grid).toContain('md-grid-cols-{cols}');
    expect(grid).toContain("lg: '2.5rem'");
    expect(c['src/lib/components/CtaBanner.svelte']).toContain('{#if eyebrow}');
    expect(c['src/lib/components/SplitHero.svelte']).toContain("align === 'center'");
    expect(c['src/lib/components/DashboardShell.svelte']).toContain('class="md-dashboard" {style}');
  });

  it('app.css contains every md-grid-cols-* class the Grid can emit', () => {
    const css = generateAppCss(createDefaultAcmeSaaSProject().tokens);
    for (let n = 1; n <= 4; n++) expect(css).toContain(`.md-grid-cols-${n}`);
  });
});

describe('generated package.json', () => {
  it('pins the 2026-10-28 toolchain and drops unused runtime deps', () => {
    const pkg = JSON.parse(generatePackageJson(createDefaultAcmeSaaSProject()));
    expect(pkg.devDependencies).toMatchObject({
      svelte: '^5.57.3',
      '@sveltejs/kit': '^3.1.0',
      '@sveltejs/vite-plugin-svelte': '^7.3.1',
      '@sveltejs/adapter-auto': '^8.0.0',
      'svelte-check': '^4.7.7',
      typescript: '^6.0.3',
      vite: '^8.3.5',
      '@types/node': '^26.6.6'
    });
    expect(pkg.engines.node).toBe('>=26.13.0');
    const all = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const dep of ['bits-ui', 'clsx', 'lucide-svelte']) expect(all[dep]).toBeUndefined();
  });
});
