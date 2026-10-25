<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import { cssPropertiesToString } from '@app-viz/engine';
  import Container from './preview-components/Container.svelte';
  import Button from './preview-components/Button.svelte';
  import Navbar from './preview-components/Navbar.svelte';
  import SplitHero from './preview-components/SplitHero.svelte';
  import FeatureGrid from './preview-components/FeatureGrid.svelte';
  import PricingTable from './preview-components/PricingTable.svelte';
  import FaqAccordion from './preview-components/FaqAccordion.svelte';
  import Testimonials from './preview-components/Testimonials.svelte';
  import Footer from './preview-components/Footer.svelte';
  import DashboardShell from './preview-components/DashboardShell.svelte';
  import KpiGrid from './preview-components/KpiGrid.svelte';
  import DataTable from './preview-components/DataTable.svelte';
  import SettingsForm from './preview-components/SettingsForm.svelte';
  import PreviewRenderer from './PreviewRenderer.svelte';

  interface Props {
    node: BlueprintNode;
    selectedNodeId: string | null;
    isInteractiveMode: boolean;
    onSelectNode?: (id: string) => void;
    onNavigate?: (path: string) => void;
  }

  let {
    node,
    selectedNodeId,
    isInteractiveMode,
    onSelectNode,
    onNavigate
  }: Props = $props();

  const isSelected = $derived(selectedNodeId === node.id);
  const inlineStyle = $derived(cssPropertiesToString(node.styles?.base || {}));

  function handleClick(e: MouseEvent) {
    if (!isInteractiveMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
    }
  }
  function handleKeyDown(e: KeyboardEvent) {
    if (!isInteractiveMode && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
    }
  }
</script>

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
    <div class="preview-node__badge">
      {node.name}
    </div>
  {/if}

  {#if node.componentType === 'structure/container'}
    <Container maxWidth={node.props.maxWidth || 'xl'}>
      {#each node.children || [] as child (child.id)}
        <PreviewRenderer
          node={child}
          {selectedNodeId}
          {isInteractiveMode}
          {onSelectNode}
          {onNavigate}
        />
      {/each}
    </Container>
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
          {selectedNodeId}
          {isInteractiveMode}
          {onSelectNode}
          {onNavigate}
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
  {:else if node.componentType === 'ui/button'}
    <Button
      variant={node.props.variant}
      size={node.props.size}
      href={node.props.href}
      {onNavigate}
    >
      {node.props.text || 'Button'}
    </Button>
  {:else}
    <div>
      {#each node.children || [] as child (child.id)}
        <PreviewRenderer
          node={child}
          {selectedNodeId}
          {isInteractiveMode}
          {onSelectNode}
          {onNavigate}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .preview-node {
    position: relative;
    transition: outline var(--md-sys-motion-duration-short);
  }
  .preview-node--editable:hover {
    outline: 1px dashed var(--md-sys-color-primary, #A8C7FA);
  }
  .preview-node--selected {
    outline: 2px solid var(--md-sys-color-primary, #A8C7FA) !important;
    box-shadow: var(--md-sys-elevation-level2);
    z-index: 10;
  }
  .preview-node__badge {
    position: absolute;
    top: -20px;
    left: 0;
    background-color: var(--md-sys-color-primary, #A8C7FA);
    color: var(--md-sys-color-on-primary, #003063);
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    padding: 2px 6px;
    border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0;
    font-weight: 700;
    z-index: 20;
    pointer-events: none;
    white-space: nowrap;
  }
</style>
