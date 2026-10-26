<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
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

  interface Props {
    node: BlueprintNode;
    slotNode?: BlueprintNode;
    activeBreakpoint?: 'mobile' | 'tablet' | 'desktop' | 'wide';
    selectedNodeId: string | null;
    isInteractiveMode: boolean;
    onSelectNode?: (id: string) => void;
    onNavigate?: (path: string) => void;
    onNodeAction?: (nodeId: string, action: 'up' | 'down' | 'duplicate' | 'delete') => void;
  }

  let {
    node,
    slotNode,
    activeBreakpoint = 'desktop',
    selectedNodeId,
    isInteractiveMode,
    onSelectNode,
    onNavigate,
    onNodeAction
  }: Props = $props();

  const isSelected = $derived(selectedNodeId === node.id);
  const effectiveCss = $derived(resolveEffectiveStyles(node.styles, activeBreakpoint));
  const inlineStyle = $derived(cssPropertiesToString(effectiveCss));

  function handleClick(e: MouseEvent) {
    if (!isInteractiveMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
      return;
    }

    // In interactive mode, execute declarative onClick interaction rules if configured
    const clickRule = (node.interactions || []).find((r) => r.trigger === 'onClick');
    if (clickRule && clickRule.actionType === 'navigate' && typeof clickRule.payload?.path === 'string') {
      e.preventDefault();
      e.stopPropagation();
      onNavigate?.(clickRule.payload.path);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isInteractiveMode && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
    }
  }

  function triggerAction(e: MouseEvent, action: 'up' | 'down' | 'duplicate' | 'delete') {
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
      />
    {/if}
  {:else}
    <div
      data-node-id={node.id}
      data-node-type={node.componentType}
      onclick={handleClick}
      onkeydown={handleKeyDown}
      role="button"
      tabindex="0"
      aria-label={node.name}
      class="preview-node {!isInteractiveMode ? 'preview-node--editable' : ''} {isSelected && !isInteractiveMode ? 'preview-node--selected' : ''}"
      style={inlineStyle}
    >
      {#if isSelected && !isInteractiveMode}
        <div class="preview-node__toolbar">
          <span class="preview-node__badge-text">{node.name}</span>
          {#if onNodeAction && !node.locked}
            <div class="preview-node__actions">
              <button
                type="button"
                class="preview-node__action-btn"
                title="Move Up"
                aria-label="Move node up"
                onclick={(e) => triggerAction(e, 'up')}
              >↑</button>
              <button
                type="button"
                class="preview-node__action-btn"
                title="Move Down"
                aria-label="Move node down"
                onclick={(e) => triggerAction(e, 'down')}
              >↓</button>
              <button
                type="button"
                class="preview-node__action-btn"
                title="Duplicate"
                aria-label="Duplicate node"
                onclick={(e) => triggerAction(e, 'duplicate')}
              >⧉</button>
              <button
                type="button"
                class="preview-node__action-btn preview-node__action-btn--danger"
                title="Delete"
                aria-label="Delete node"
                onclick={(e) => triggerAction(e, 'delete')}
              >✕</button>
            </div>
          {/if}
        </div>
      {/if}

      {#if node.componentType === 'structure/container'}
        <Container maxWidth={node.props.maxWidth || 'xl'}>
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
            />
          {/each}
        </Container>
      {:else if node.componentType === 'structure/section'}
        <Section
          variant={node.props.variant}
          paddingY={node.props.paddingY}
          maxWidth={node.props.maxWidth}
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
            />
          {/each}
        </Section>
      {:else if node.componentType === 'structure/grid'}
        <Grid columns={node.props.columns} gap={node.props.gap}>
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
            />
          {/each}
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
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
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
  .preview-node__toolbar {
    position: absolute;
    top: -26px;
    left: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background-color: var(--md-sys-color-primary, #0B57D0);
    color: var(--md-sys-color-on-primary, #FFFFFF);
    font-size: 0.6875rem;
    font-family: var(--md-sys-font-mono, monospace);
    padding: 2px 6px;
    border-radius: 6px 6px 0 0;
    font-weight: 600;
    z-index: 30;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
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
</style>
