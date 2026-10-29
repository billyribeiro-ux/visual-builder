<script lang="ts">
  import '@app-viz/components/svelte/runtime.css';
  import type { Component } from 'svelte';
  import { createNode, type BlueprintNode, type DesignTokens } from '@app-viz/schema';
  import { getManifest, isLayoutInnerType } from '@app-viz/components';
  import { compileNodeCss, sanitizeCssValue } from '@app-viz/engine';
  import { editor } from '#lib/state/editor.svelte.js';
  import ThumbNode from './ThumbNode.svelte';
  import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';

  /**
   * Live, non-interactive miniature of a blueprint subtree (or a registry component with its
   * default props), rendered with the canonical site components at the real design width and
   * scaled down to the card. Renders only once the card scrolls near the viewport.
   */
  interface Props {
    node?: BlueprintNode;
    componentType?: string;
    /** Box height / width. */
    ratio?: number;
    /** Width the content is laid out at before scaling. */
    designWidth?: number;
    /** Tokens to theme the miniature with (defaults to the open project's). */
    tokens?: DesignTokens;
    /** Shown while the preview is out of view, and when it cannot be rendered. */
    icon?: Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;
  }

  let { node, componentType, ratio = 0.625, designWidth = 1280, tokens, icon: Icon = SquaresFourIcon }: Props = $props();

  const TOKEN_NAME_RE = /^[a-zA-Z0-9-]+$/;
  const uid = $props.id();
  const scope = `thumb-${uid.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  let visible = $state(false);
  let width = $state(0);
  /** Centering / zoom applied when the content is shorter or much smaller than the box. */
  let fit = $state({ x: 0, y: 0, z: 1, filled: 0 });


  const subject = $derived.by<BlueprintNode | null>(() => {
    if (node) return node;
    const manifest = componentType ? getManifest(componentType) : undefined;
    if (!manifest) return null;
    return createNode({ componentType: manifest.type, name: manifest.displayName, props: structuredClone(manifest.defaultProps) });
  });

  /** Same custom property names the site runtime and `compileTokenCss` use. */
  const tokenStyle = $derived.by(() => {
    const t = tokens ?? editor.blueprint.tokens;
    const out: string[] = [];
    const group = (prefix: string, record: Record<string, string> | undefined) => {
      for (const [key, raw] of Object.entries(record ?? {})) {
        if (!TOKEN_NAME_RE.test(key)) continue;
        const value = sanitizeCssValue(raw);
        if (value) out.push(`--${prefix}-${key}: ${value}`);
      }
    };
    group('md-sys-color', t.colors);
    for (const key of ['heading', 'body', 'mono'] as const) {
      const value = sanitizeCssValue(t.fonts?.[key]);
      if (value) out.push(`--md-sys-font-${key}: ${value}`);
    }
    group('md-sys-shape-corner', t.radii);
    group('md-sys-elevation', t.shadows);
    group('md-sys-spacing', t.spacing);
    return out.join('; ');
  });

  /** Node styles, nested under this thumbnail's scope so they can never reach other elements. */
  const nodeCss = $derived(visible && subject ? `.${scope} {\n${compileNodeCss([subject], { layoutInner: isLayoutInnerType })}\n}` : '');
  const scale = $derived(width > 0 ? width / designWidth : 0);
  const empty = $derived(
    Boolean(subject && getManifest(subject.componentType)?.isContainer && !subject.children.some((c) => !c.hidden))
  );

  function lazy(el: HTMLElement) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          visible = true;
          io.disconnect();
        }
      },
      { rootMargin: '240px' }
    );
    io.observe(el);
    const ro = new ResizeObserver((entries) => {
      width = entries[0]?.contentRect.width ?? 0;
    });
    ro.observe(el);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }

  /** Measures the rendered component (in design pixels) and frames it inside the box. */
  function framing(el: HTMLElement) {
    const boxH = designWidth * ratio;
    const measure = () => {
      const child = el.firstElementChild as HTMLElement | null;
      if (!child) return;
      const cw = Math.max(1, child.offsetWidth);
      const ch = Math.max(1, child.offsetHeight);
      const small = cw < designWidth * 0.6 && ch < boxH * 0.6;
      const z = small ? Math.min(3, (designWidth * 0.6) / cw, (boxH * 0.55) / ch) : 1;
      fit = {
        x: small ? (designWidth - cw * z) / 2 : 0,
        y: Math.max(0, (boxH - ch * z) / 2),
        z,
        filled: Math.min(1, (ch * z) / boxH)
      };
    };
    const ro = new ResizeObserver(measure);
    const watch = () => {
      ro.disconnect();
      ro.observe(el);
      if (el.firstElementChild) ro.observe(el.firstElementChild);
      measure();
    };
    const mo = new MutationObserver(watch);
    mo.observe(el, { childList: true });
    watch();
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }

  function sheet(el: HTMLElement) {
    const style = document.createElement('style');
    style.textContent = nodeCss;
    el.replaceChildren(style);
  }
</script>

<div class="thumb" style:aspect-ratio="1 / {ratio}" aria-hidden="true" {@attach lazy}>
  {#if visible && subject && scale > 0}
    <svelte:boundary>
      <div class="thumb__css" hidden {@attach sheet}></div>
      <div
        class={['site-root', 'thumb__site', scope]}
        inert
        style={tokenStyle}
        style:width="{designWidth}px"
        style:height="{designWidth * ratio}px"
        style:transform="scale({scale})"
      >
        <div class="thumb__content" style:transform="translate({fit.x}px, {fit.y}px) scale({fit.z})" {@attach framing}>
          <ThumbNode node={subject} />
        </div>
      </div>
      {#if empty}
        <span class={['thumb__empty', fit.filled > 0.3 && 'thumb__empty--pill']}><span>Empty container</span></span>
      {/if}
      {#snippet failed()}
        <span class="thumb__fallback"><Icon size={20} weight="light" /> Preview unavailable</span>
      {/snippet}
    </svelte:boundary>
  {:else}
    <span class="thumb__fallback thumb__fallback--idle"><Icon size={20} weight="light" /></span>
  {/if}
</div>

<style>
  .thumb {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: var(--sx-subtle);
    contain: strict;
    pointer-events: none;
    user-select: none;
  }
  .thumb__site {
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
    transform-origin: 0 0;
    background: var(--md-sys-color-surface, #fff);
  }
  .thumb__content {
    transform-origin: 0 0;
  }
  .thumb__empty {
    position: absolute;
    inset: 12%;
    display: grid;
    place-items: center;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    border: 1.5px dashed var(--sx-border-strong);
    border-radius: var(--sx-radius-md);
  }
  .thumb__empty--pill {
    inset: auto 8px 8px auto;
    padding: 2px 8px;
    font-size: var(--sx-text-xs);
    font-weight: 500;
    color: var(--sx-text-2);
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    border-radius: 999px;
    box-shadow: var(--sx-shadow-sm);
  }
  .thumb__fallback {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
  }
  .thumb__fallback--idle {
    color: var(--sx-border-strong);
  }
</style>
