<script lang="ts">
  import type { BlueprintNode, InteractionRule } from '@app-viz/schema';
  import { cssPropertiesToString, resolveEffectiveStyles } from '@app-viz/engine';
  import Container from './preview-components/Container.svelte';
  import Section from './preview-components/Section.svelte';
  import Grid from './preview-components/Grid.svelte';
  import Divider from './preview-components/Divider.svelte';
  import Button from './preview-components/Button.svelte';
  import Badge from './preview-components/Badge.svelte';
  import Card from './preview-components/Card.svelte';
  import Alert from './preview-components/Alert.svelte';
  import Tabs from './preview-components/Tabs.svelte';
  import Navbar from './preview-components/Navbar.svelte';
  import SplitHero from './preview-components/SplitHero.svelte';
  import FeatureGrid from './preview-components/FeatureGrid.svelte';
  import PricingTable from './preview-components/PricingTable.svelte';
  import FaqAccordion from './preview-components/FaqAccordion.svelte';
  import Testimonials from './preview-components/Testimonials.svelte';
  import CtaBanner from './preview-components/CtaBanner.svelte';
  import StatsBar from './preview-components/StatsBar.svelte';
  import Newsletter from './preview-components/Newsletter.svelte';
  import ContactForm from './preview-components/ContactForm.svelte';
  import Footer from './preview-components/Footer.svelte';
  import DashboardShell from './preview-components/DashboardShell.svelte';
  import KpiGrid from './preview-components/KpiGrid.svelte';
  import DataTable from './preview-components/DataTable.svelte';
  import SettingsForm from './preview-components/SettingsForm.svelte';
  import AuthCard from './preview-components/AuthCard.svelte';
  import PreviewRenderer from './PreviewRenderer.svelte';

  export type NodeQuickAction =
    | 'up'
    | 'down'
    | 'duplicate'
    | 'delete'
    | 'wrap-section'
    | 'wrap-container'
    | 'unwrap'
    | 'copy'
    | 'paste'
    | 'copy-style'
    | 'paste-style'
    | 'reset-style'
    | 'save-symbol'
    | 'hide';

  interface Props {
    node: BlueprintNode;
    slotNode?: BlueprintNode;
    activeBreakpoint?: 'mobile' | 'tablet' | 'desktop' | 'wide';
    selectedNodeId: string | null;
    isInteractiveMode: boolean;
    onSelectNode?: (id: string) => void;
    onNavigate?: (path: string) => void;
    onNodeAction?: (nodeId: string, action: NodeQuickAction) => void;
    onDropItem?: (
      payload: { componentType?: string; nodeId?: string },
      targetNodeId: string,
      position: 'before' | 'inside' | 'after'
    ) => void;
    onContextMenuNode?: (node: BlueprintNode, x: number, y: number) => void;
    onInlinePropEdit?: (nodeId: string, propKey: string, value: string) => void;
    onResizeNodeStyle?: (nodeId: string, styles: Record<string, string>) => void;
    onTriggerInteraction?: (rule: InteractionRule, sourceNode: BlueprintNode) => void;
  }

  let {
    node,
    slotNode,
    activeBreakpoint = 'desktop',
    selectedNodeId,
    isInteractiveMode,
    onSelectNode,
    onNavigate,
    onNodeAction,
    onDropItem,
    onContextMenuNode,
    onInlinePropEdit,
    onResizeNodeStyle,
    onTriggerInteraction
  }: Props = $props();

  const isSelected = $derived(selectedNodeId === node.id);
  const effectiveCss = $derived(resolveEffectiveStyles(node.styles, activeBreakpoint));
  const inlineStyle = $derived(cssPropertiesToString(effectiveCss));
  const isContainer = $derived(
    node.componentType === 'structure/container' ||
      node.componentType === 'structure/section' ||
      node.componentType === 'structure/grid' ||
      node.componentType === 'app/dashboard-shell'
  );

  const editableTextProps = $derived.by<Array<{ key: string; val: string }>>(() => {
    const entries: Array<{ key: string; val: string }> = [];
    const skipKeys = new Set([
      'variant',
      'size',
      'tone',
      'mode',
      'maxWidth',
      'paddingY',
      'gap',
      'spacing',
      'activeNav',
      'primaryCtaHref',
      'secondaryCtaHref',
      'ctaHref',
      'actionHref',
      'redirectHref',
      'href',
      'logoUrl'
    ]);
    for (const [k, v] of Object.entries(node.props || {})) {
      if (typeof v === 'string' && !skipKeys.has(k)) {
        entries.push({ key: k, val: v });
      }
    }
    return entries;
  });

  let dropZone = $state<'before' | 'inside' | 'after' | null>(null);
  let showInlineEditor = $state(false);
  let isResizingPadding = $state(false);
  let livePaddingPx = $state<number | null>(null);

  function handleClick(e: MouseEvent) {
    if (!isInteractiveMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
      return;
    }

    const clickRule = (node.interactions || []).find(
      (r) => r.trigger === 'onClick' || r.trigger === 'click'
    );
    if (clickRule) {
      e.preventDefault();
      e.stopPropagation();
      if (onTriggerInteraction) {
        onTriggerInteraction(clickRule, node);
      } else if (
        clickRule.actionType === 'navigate' &&
        typeof clickRule.payload?.path === 'string'
      ) {
        onNavigate?.(clickRule.payload.path);
      }
    }
  }

  function handleDblClick(e: MouseEvent) {
    if (isInteractiveMode || node.locked) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectNode?.(node.id);
    if (editableTextProps.length > 0) {
      showInlineEditor = true;
    }
  }

  function startPaddingResize(e: MouseEvent) {
    if (isInteractiveMode || node.locked) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const currentRaw = String(effectiveCss.paddingBottom || effectiveCss.paddingTop || '24px');
    const parsedStart = parseInt(currentRaw, 10);
    const startPx = Number.isFinite(parsedStart) ? parsedStart : 24;

    isResizingPadding = true;
    livePaddingPx = startPx;

    function onMove(moveEvent: MouseEvent) {
      const delta = Math.round((moveEvent.clientY - startY) / 2);
      const nextPx = Math.max(0, Math.min(200, startPx + delta));
      livePaddingPx = nextPx;
      onResizeNodeStyle?.(node.id, {
        paddingTop: `${nextPx}px`,
        paddingBottom: `${nextPx}px`
      });
    }

    function onUp() {
      isResizingPadding = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function handleContextMenu(e: MouseEvent) {
    if (isInteractiveMode) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectNode?.(node.id);
    onContextMenuNode?.(node, e.clientX, e.clientY);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isInteractiveMode && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
    }
  }

  function handleDragStart(e: DragEvent) {
    if (isInteractiveMode || node.locked) return;
    e.stopPropagation();
    e.dataTransfer?.setData('application/x-app-viz-node-id', node.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: DragEvent) {
    if (isInteractiveMode) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const ratio = rect.height > 0 ? relY / rect.height : 0.5;

    if (isContainer && ratio > 0.22 && ratio < 0.78) {
      dropZone = 'inside';
    } else if (ratio < 0.5) {
      dropZone = 'before';
    } else {
      dropZone = 'after';
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.stopPropagation();
    dropZone = null;
  }

  function handleDrop(e: DragEvent) {
    if (isInteractiveMode) return;
    e.preventDefault();
    e.stopPropagation();
    const targetZone = dropZone || (isContainer ? 'inside' : 'after');
    dropZone = null;

    const componentType = e.dataTransfer?.getData('application/x-app-viz-component');
    const draggedNodeId = e.dataTransfer?.getData('application/x-app-viz-node-id');

    if (componentType) {
      onDropItem?.({ componentType }, node.id, targetZone);
    } else if (draggedNodeId && draggedNodeId !== node.id) {
      onDropItem?.({ nodeId: draggedNodeId }, node.id, targetZone);
    }
  }

  function triggerAction(e: MouseEvent, action: NodeQuickAction) {
    e.preventDefault();
    e.stopPropagation();
    onNodeAction?.(node.id, action);
  }
</script>

{#if !node.hidden}
  {#if node.componentType === 'structure/slot'}
    {#if slotNode}
      <PreviewRenderer
        node={slotNode}
        {activeBreakpoint}
        {selectedNodeId}
        {isInteractiveMode}
        {onSelectNode}
        {onNavigate}
        {onNodeAction}
        {onDropItem}
        {onContextMenuNode}
        {onInlinePropEdit}
        {onResizeNodeStyle}
        {onTriggerInteraction}
      />
    {/if}
  {:else}
    <div
      data-node-id={node.id}
      data-node-type={node.componentType}
      draggable={!isInteractiveMode && !node.locked && !showInlineEditor}
      ondragstart={handleDragStart}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      onclick={handleClick}
      ondblclick={handleDblClick}
      oncontextmenu={handleContextMenu}
      onkeydown={handleKeyDown}
      role="button"
      tabindex="0"
      aria-label={node.name}
      class="preview-node {!isInteractiveMode ? 'preview-node--editable' : ''} {isSelected && !isInteractiveMode ? 'preview-node--selected' : ''} {dropZone ? `preview-node--drop-${dropZone}` : ''} {node.customClasses || ''}"
      style={inlineStyle}
    >
      {#if dropZone && !isInteractiveMode}
        <div class="drop-indicator drop-indicator--{dropZone}">
          {dropZone === 'inside' ? `Drop inside ${node.name}` : `Insert ${dropZone} ${node.name}`}
        </div>
      {/if}

      {#if isSelected && !isInteractiveMode}
        <div class="preview-node__toolbar">
          <span class="preview-node__badge-text">{node.name}</span>
          {#if onNodeAction && !node.locked}
            <div class="preview-node__actions">
              {#if editableTextProps.length > 0}
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Inline Text Edit (Double-Click)"
                  aria-label="Inline edit text"
                  onclick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showInlineEditor = !showInlineEditor;
                  }}
                >✏️</button>
              {/if}
              <button
                type="button"
                class="preview-node__action-btn"
                title="Move Up (Alt+↑)"
                aria-label="Move node up"
                onclick={(e) => triggerAction(e, 'up')}
              >↑</button>
              <button
                type="button"
                class="preview-node__action-btn"
                title="Move Down (Alt+↓)"
                aria-label="Move node down"
                onclick={(e) => triggerAction(e, 'down')}
              >↓</button>
              <button
                type="button"
                class="preview-node__action-btn"
                title="Wrap in Section"
                aria-label="Wrap node in section"
                onclick={(e) => triggerAction(e, 'wrap-section')}
              >📦</button>
              <button
                type="button"
                class="preview-node__action-btn"
                title="Duplicate (Cmd+D)"
                aria-label="Duplicate node"
                onclick={(e) => triggerAction(e, 'duplicate')}
              >⧉</button>
              <button
                type="button"
                class="preview-node__action-btn preview-node__action-btn--danger"
                title="Delete (Backspace)"
                aria-label="Delete node"
                onclick={(e) => triggerAction(e, 'delete')}
              >✕</button>
            </div>
          {/if}
        </div>

        {#if showInlineEditor && editableTextProps.length > 0}
          <!-- On-Canvas Inline Quick Text Editor Popover -->
          <div
            class="inline-editor-popover"
            role="region"
            aria-label="Inline text editor"
          >
            <div class="inline-editor-header">
              <span>✏️ Inline Copy Editor ({node.name})</span>
              <button
                type="button"
                class="inline-editor-close"
                onclick={(e) => {
                  e.stopPropagation();
                  showInlineEditor = false;
                }}
              >Done</button>
            </div>
            <div class="inline-editor-fields">
              {#each editableTextProps as item (item.key)}
                <label class="inline-editor-field">
                  <span class="inline-editor-label">{item.key}</span>
                  <input
                    type="text"
                    value={item.val}
                    onclick={(e) => e.stopPropagation()}
                    onkeydown={(e) => e.stopPropagation()}
                    oninput={(e) =>
                      onInlinePropEdit?.(node.id, item.key, (e.target as HTMLInputElement).value)}
                    class="inline-editor-input"
                  />
                </label>
              {/each}
            </div>
          </div>
        {/if}

        {#if !node.locked}
          <!-- Interactive On-Canvas Vertical Spacing Drag Handle -->
          <button
            type="button"
            class="resize-padding-handle"
            title="Drag vertically to resize top & bottom padding"
            onmousedown={startPaddingResize}
            onclick={(e) => e.stopPropagation()}
          >
            ↕ {isResizingPadding && livePaddingPx !== null
              ? `Padding: ${livePaddingPx}px`
              : effectiveCss.paddingBottom || 'Drag Padding'}
          </button>
        {/if}
      {/if}

      {#if node.componentType === 'structure/container'}
        <Container maxWidth={node.props.maxWidth || 'xl'}>
          {#if (!node.children || node.children.length === 0) && !isInteractiveMode}
            <div class="el-empty-column-slot">
              <span class="el-empty-column-plus">+</span>
              <span class="el-empty-column-text">{node.name} — Drag widget here</span>
            </div>
          {:else}
            {#each node.children || [] as child (child.id)}
              <PreviewRenderer
                node={child}
                {slotNode}
                {activeBreakpoint}
                {selectedNodeId}
                {isInteractiveMode}
                {onSelectNode}
                {onNavigate}
                {onNodeAction}
                {onDropItem}
                {onContextMenuNode}
                {onInlinePropEdit}
                {onResizeNodeStyle}
                {onTriggerInteraction}
              />
            {/each}
          {/if}
        </Container>
      {:else if node.componentType === 'structure/section'}
        <Section
          variant={node.props.variant}
          paddingY={node.props.paddingY}
          maxWidth={node.props.maxWidth}
        >
          {#if (!node.children || node.children.length === 0) && !isInteractiveMode}
            <div class="el-empty-column-slot">
              <span class="el-empty-column-plus">+</span>
              <span class="el-empty-column-text">{node.name} — Drag widget here</span>
            </div>
          {:else}
            {#each node.children || [] as child (child.id)}
              <PreviewRenderer
                node={child}
                {slotNode}
                {activeBreakpoint}
                {selectedNodeId}
                {isInteractiveMode}
                {onSelectNode}
                {onNavigate}
                {onNodeAction}
                {onDropItem}
                {onContextMenuNode}
                {onInlinePropEdit}
                {onResizeNodeStyle}
                {onTriggerInteraction}
              />
            {/each}
          {/if}
        </Section>
      {:else if node.componentType === 'structure/grid'}
        <Grid columns={node.props.columns} gap={node.props.gap}>
          {#if (!node.children || node.children.length === 0) && !isInteractiveMode}
            <div class="el-empty-column-slot">
              <span class="el-empty-column-plus">+</span>
              <span class="el-empty-column-text">{node.name} — Drag widget here</span>
            </div>
          {:else}
            {#each node.children || [] as child (child.id)}
              <PreviewRenderer
                node={child}
                {slotNode}
                {activeBreakpoint}
                {selectedNodeId}
                {isInteractiveMode}
                {onSelectNode}
                {onNavigate}
                {onNodeAction}
                {onDropItem}
                {onContextMenuNode}
                {onInlinePropEdit}
                {onResizeNodeStyle}
                {onTriggerInteraction}
              />
            {/each}
          {/if}
        </Grid>
      {:else if node.componentType === 'structure/divider'}
        <Divider spacing={node.props.spacing} label={node.props.label} />
      {:else if node.componentType === 'hero/split-hero'}
        <SplitHero
          eyebrow={node.props.eyebrow}
          title={node.props.title}
          subtitle={node.props.subtitle}
          primaryCtaText={node.props.primaryCtaText}
          primaryCtaHref={node.props.primaryCtaHref}
          secondaryCtaText={node.props.secondaryCtaText}
          secondaryCtaHref={node.props.secondaryCtaHref}
          badgeText={node.props.badgeText}
          {onNavigate}
        />
      {:else if node.componentType === 'marketing/feature-grid'}
        <FeatureGrid
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          sectionDescription={node.props.sectionDescription}
          columns={node.props.columns}
          features={node.props.features}
        />
      {:else if node.componentType === 'marketing/pricing-table'}
        <PricingTable
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          sectionDescription={node.props.sectionDescription}
          plans={node.props.plans}
          {onNavigate}
        />
      {:else if node.componentType === 'marketing/faq-accordion'}
        <FaqAccordion
          sectionTitle={node.props.sectionTitle}
          items={node.props.items}
        />
      {:else if node.componentType === 'marketing/testimonials'}
        <Testimonials
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          testimonials={node.props.testimonials}
        />
      {:else if node.componentType === 'marketing/cta-banner'}
        <CtaBanner
          eyebrow={node.props.eyebrow}
          title={node.props.title}
          subtitle={node.props.subtitle}
          primaryCtaText={node.props.primaryCtaText}
          primaryCtaHref={node.props.primaryCtaHref}
          secondaryCtaText={node.props.secondaryCtaText}
          secondaryCtaHref={node.props.secondaryCtaHref}
          {onNavigate}
        />
      {:else if node.componentType === 'marketing/stats-bar'}
        <StatsBar stats={node.props.stats} />
      {:else if node.componentType === 'marketing/newsletter'}
        <Newsletter
          title={node.props.title}
          subtitle={node.props.subtitle}
          placeholder={node.props.placeholder}
          buttonText={node.props.buttonText}
        />
      {:else if node.componentType === 'marketing/contact-form'}
        <ContactForm
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          sectionSubtitle={node.props.sectionSubtitle}
          submitText={node.props.submitText}
        />
      {:else if node.componentType === 'marketing/footer'}
        <Footer
          brandName={node.props.brandName}
          tagline={node.props.tagline}
          copyright={node.props.copyright}
          columns={node.props.columns}
          {onNavigate}
        />
      {:else if node.componentType === 'navigation/navbar'}
        <Navbar
          brandName={node.props.brandName}
          logoUrl={node.props.logoUrl}
          links={node.props.links}
          ctaText={node.props.ctaText}
          ctaHref={node.props.ctaHref}
          {onNavigate}
        />
      {:else if node.componentType === 'app/dashboard-shell'}
        <DashboardShell
          title={node.props.title}
          activeNav={node.props.activeNav}
          {onNavigate}
        >
          {#each node.children || [] as child (child.id)}
            <PreviewRenderer
              node={child}
              {slotNode}
              {activeBreakpoint}
              {selectedNodeId}
              {isInteractiveMode}
              {onSelectNode}
              {onNavigate}
              {onNodeAction}
              {onDropItem}
              {onContextMenuNode}
              {onInlinePropEdit}
              {onResizeNodeStyle}
              {onTriggerInteraction}
            />
          {/each}
        </DashboardShell>
      {:else if node.componentType === 'app/kpi-grid'}
        <KpiGrid cards={node.props.cards} />
      {:else if node.componentType === 'app/data-table'}
        <DataTable
          title={node.props.title}
          columns={node.props.columns}
          rows={node.props.rows}
        />
      {:else if node.componentType === 'app/settings-form'}
        <SettingsForm
          initialName={node.props.initialName}
          initialEmail={node.props.initialEmail}
          notificationsEnabled={node.props.notificationsEnabled}
        />
      {:else if node.componentType === 'app/auth-card'}
        <AuthCard
          mode={node.props.mode}
          brandName={node.props.brandName}
          title={node.props.title}
          subtitle={node.props.subtitle}
          redirectHref={node.props.redirectHref}
          {onNavigate}
        />
      {:else if node.componentType === 'ui/button'}
        <Button
          variant={node.props.variant}
          size={node.props.size}
          href={node.props.href}
          {onNavigate}
        >
          {node.props.text || 'Button'}
        </Button>
      {:else if node.componentType === 'ui/badge'}
        <Badge text={node.props.text} tone={node.props.tone} />
      {:else if node.componentType === 'ui/card'}
        <Card
          variant={node.props.variant}
          eyebrow={node.props.eyebrow}
          title={node.props.title}
          body={node.props.body}
          actionText={node.props.actionText}
          actionHref={node.props.actionHref}
          {onNavigate}
        />
      {:else if node.componentType === 'ui/alert'}
        <Alert
          tone={node.props.tone}
          title={node.props.title}
          message={node.props.message}
          dismissible={node.props.dismissible}
        />
      {:else if node.componentType === 'ui/tabs'}
        <Tabs tabs={node.props.tabs} />
      {:else}
        <div>
          {#each node.children || [] as child (child.id)}
            <PreviewRenderer
              node={child}
              {slotNode}
              {activeBreakpoint}
              {selectedNodeId}
              {isInteractiveMode}
              {onSelectNode}
              {onNavigate}
              {onNodeAction}
              {onDropItem}
              {onContextMenuNode}
              {onInlinePropEdit}
              {onResizeNodeStyle}
              {onTriggerInteraction}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .inline-editor-popover {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 60;
    width: min(24rem, 92vw);
    background: #1D2024;
    color: #E2E2E6;
    border: 1px solid #0B57D0;
    border-radius: 10px;
    padding: 0.625rem;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
  }
  .inline-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    color: #A8C7FA;
    margin-bottom: 0.5rem;
  }
  .inline-editor-close {
    background: #0B57D0;
    color: #FFFFFF;
    border: none;
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.6875rem;
    font-weight: 600;
    cursor: pointer;
  }
  .inline-editor-fields {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    max-height: 13rem;
    overflow-y: auto;
  }
  .inline-editor-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .inline-editor-label {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono, monospace);
    color: #8E9199;
    text-transform: uppercase;
  }
  .inline-editor-input {
    background: #111316;
    border: 1px solid #44474F;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.75rem;
  }
  .resize-padding-handle {
    position: absolute;
    bottom: -11px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 35;
    background: #0B57D0;
    color: #FFFFFF;
    border: 1px solid #FFFFFF;
    border-radius: 9999px;
    padding: 1px 10px;
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono, monospace);
    font-weight: 600;
    cursor: ns-resize;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }
  .preview-node {
    position: relative;
    transition: outline 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  .preview-node--editable:hover {
    outline: 1px dashed var(--md-sys-color-primary, #0B57D0);
  }
  .preview-node--selected {
    outline: 2px solid var(--md-sys-color-primary, #0B57D0) !important;
    z-index: 10;
  }
  .preview-node--drop-before {
    box-shadow: inset 0 4px 0 0 #0B57D0;
  }
  .preview-node--drop-after {
    box-shadow: inset 0 -4px 0 0 #0B57D0;
  }
  .preview-node--drop-inside {
    outline: 2px dashed #146C2E !important;
    background-color: rgba(20, 108, 46, 0.04);
  }
  .drop-indicator {
    position: absolute;
    left: 12px;
    z-index: 40;
    background-color: #0B57D0;
    color: #FFFFFF;
    font-size: 0.6875rem;
    font-family: var(--md-sys-font-mono, monospace);
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 9999px;
    pointer-events: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }
  .drop-indicator--before {
    top: -10px;
  }
  .drop-indicator--after {
    bottom: -10px;
  }
  .drop-indicator--inside {
    top: 8px;
    background-color: #146C2E;
  }
  .preview-node__toolbar {
    position: absolute;
    top: -28px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #0B57D0;
    color: #FFFFFF;
    font-size: 0.72rem;
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
    padding: 3px 10px;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    z-index: 30;
    white-space: nowrap;
    box-shadow: 0 -2px 10px rgba(11, 87, 208, 0.28);
  }
  .preview-node__badge-text {
    padding-right: 4px;
  }
  .preview-node__actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    padding-left: 4px;
  }
  .preview-node__action-btn {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 0.6875rem;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
  }
  .preview-node__action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .preview-node__action-btn--danger:hover {
    background: #B3261E;
    color: #FFFFFF;
  }
  .el-empty-column-slot {
    min-height: 92px;
    border: 1.5px dashed rgba(11, 87, 208, 0.45);
    border-radius: 10px;
    background: rgba(11, 87, 208, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 1rem;
    color: #0B57D0;
    transition: background-color 140ms ease, border-color 140ms ease;
  }
  .el-empty-column-slot:hover {
    border-color: #0B57D0;
    background: rgba(11, 87, 208, 0.07);
  }
  .el-empty-column-plus {
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    background: rgba(11, 87, 208, 0.12);
    color: #0B57D0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .el-empty-column-text {
    font-size: 0.72rem;
    font-weight: 600;
    opacity: 0.85;
  }
</style>
