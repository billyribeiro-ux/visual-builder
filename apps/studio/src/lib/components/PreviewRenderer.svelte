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
</script>

<div
  data-node-id={node.id}
  data-node-type={node.componentType}
  onclick={handleClick}
  role="region"
  aria-label={node.name}
  class="relative transition-all duration-150 {!isInteractiveMode ? 'hover:outline hover:outline-1 hover:outline-blue-400' : ''} {isSelected && !isInteractiveMode ? 'outline outline-2 outline-blue-600 shadow-lg z-10' : ''}"
  style={inlineStyle}
>
  {#if isSelected && !isInteractiveMode}
    <div class="absolute -top-5 left-0 bg-blue-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-t font-semibold z-20 pointer-events-none">
      {node.name}
    </div>
  {/if}

  {#if node.componentType === 'structure/container'}
    <Container maxWidth={node.props.maxWidth || 'xl'}>
      {#each node.children || [] as child}
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
      {#each node.children || [] as child}
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
      {#each node.children || [] as child}
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
