import type { BlueprintNode, PageRoute, ProjectBlueprint } from '@app-viz/schema';
import { cssPropertiesToString } from '@app-viz/engine';

function renderNodeToSvelte(node: BlueprintNode, indent = '  '): string {
  const inlineStyle = cssPropertiesToString(node.styles?.base || {});
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  switch (node.componentType) {
    case 'structure/container': {
      const maxWidth = node.props.maxWidth || 'xl';
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  '))
        .join('\n');
      return `${indent}<Container maxWidth="${maxWidth}"${styleAttr}>\n${inner}\n${indent}</Container>`;
    }

    case 'hero/split-hero': {
      const p = node.props;
      return `${indent}<SplitHero
${indent}  eyebrow=${JSON.stringify(p.eyebrow || '')}
${indent}  title=${JSON.stringify(p.title || '')}
${indent}  subtitle=${JSON.stringify(p.subtitle || '')}
${indent}  primaryCtaText=${JSON.stringify(p.primaryCtaText || 'Get Started')}
${indent}  primaryCtaHref=${JSON.stringify(p.primaryCtaHref || '#')}
${indent}  secondaryCtaText=${JSON.stringify(p.secondaryCtaText || '')}
${indent}  secondaryCtaHref=${JSON.stringify(p.secondaryCtaHref || '#')}
${indent}  badgeText=${JSON.stringify(p.badgeText || '')}${styleAttr}
${indent}/>`;
    }

    case 'marketing/feature-grid': {
      const p = node.props;
      return `${indent}<FeatureGrid
${indent}  sectionEyebrow=${JSON.stringify(p.sectionEyebrow || '')}
${indent}  sectionTitle=${JSON.stringify(p.sectionTitle || '')}
${indent}  sectionDescription=${JSON.stringify(p.sectionDescription || '')}
${indent}  columns={${p.columns || 3}}
${indent}  features={${JSON.stringify(p.features || [])}}${styleAttr}
${indent}/>`;
    }

    case 'marketing/testimonials': {
      const p = node.props;
      return `${indent}<Testimonials
${indent}  sectionEyebrow=${JSON.stringify(p.sectionEyebrow || '')}
${indent}  sectionTitle=${JSON.stringify(p.sectionTitle || '')}
${indent}  testimonials={${JSON.stringify(p.testimonials || [])}}${styleAttr}
${indent}/>`;
    }

    case 'marketing/faq-accordion': {
      const p = node.props;
      return `${indent}<FaqAccordion
${indent}  sectionTitle=${JSON.stringify(p.sectionTitle || '')}
${indent}  items={${JSON.stringify(p.items || [])}}${styleAttr}
${indent}/>`;
    }

    case 'marketing/pricing-table': {
      const p = node.props;
      return `${indent}<PricingTable
${indent}  sectionEyebrow=${JSON.stringify(p.sectionEyebrow || '')}
${indent}  sectionTitle=${JSON.stringify(p.sectionTitle || '')}
${indent}  sectionDescription=${JSON.stringify(p.sectionDescription || '')}
${indent}  plans={${JSON.stringify(p.plans || [])}}${styleAttr}
${indent}/>`;
    }

    case 'marketing/footer': {
      const p = node.props;
      return `${indent}<Footer
${indent}  brandName=${JSON.stringify(p.brandName || '')}
${indent}  tagline=${JSON.stringify(p.tagline || '')}
${indent}  copyright=${JSON.stringify(p.copyright || '')}
${indent}  columns={${JSON.stringify(p.columns || [])}}${styleAttr}
${indent}/>`;
    }

    case 'navigation/navbar': {
      const p = node.props;
      return `${indent}<Navbar
${indent}  brandName=${JSON.stringify(p.brandName || '')}
${indent}  logoUrl=${JSON.stringify(p.logoUrl || '')}
${indent}  links={${JSON.stringify(p.links || [])}}
${indent}  ctaText=${JSON.stringify(p.ctaText || 'Get Started')}
${indent}  ctaHref=${JSON.stringify(p.ctaHref || '/dashboard')}${styleAttr}
${indent}/>`;
    }

    case 'app/dashboard-shell': {
      const p = node.props;
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  '))
        .join('\n');
      return `${indent}<DashboardShell title=${JSON.stringify(p.title || 'Dashboard')} activeNav=${JSON.stringify(p.activeNav || 'dashboard')}>\n${inner}\n${indent}</DashboardShell>`;
    }

    case 'app/kpi-grid': {
      const p = node.props;
      return `${indent}<KpiGrid cards={${JSON.stringify(p.cards || [])}}${styleAttr} />`;
    }

    case 'app/data-table': {
      const p = node.props;
      return `${indent}<DataTable title=${JSON.stringify(p.title || '')} columns={${JSON.stringify(p.columns || [])}} rows={${JSON.stringify(p.rows || [])}}${styleAttr} />`;
    }

    case 'app/settings-form': {
      const p = node.props;
      return `${indent}<SettingsForm initialName=${JSON.stringify(p.initialName || '')} initialEmail=${JSON.stringify(p.initialEmail || '')} notificationsEnabled={${p.notificationsEnabled !== false}}${styleAttr} />`;
    }

    case 'ui/button': {
      const p = node.props;
      return `${indent}<Button variant="${p.variant || 'primary'}" size="${p.size || 'md'}" href="${p.href || ''}"${styleAttr}>${p.text || 'Button'}</Button>`;
    }

    default: {
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  '))
        .join('\n');
      return `${indent}<div${styleAttr}>\n${inner}\n${indent}</div>`;
    }
  }
}

export function generatePageRoute(page: PageRoute): string {
  const content = renderNodeToSvelte(page.rootNode, '  ');

  return `<script lang="ts">
  import Container from '#lib/components/Container.svelte';
  import Button from '#lib/components/Button.svelte';
  import SplitHero from '#lib/components/SplitHero.svelte';
  import FeatureGrid from '#lib/components/FeatureGrid.svelte';
  import PricingTable from '#lib/components/PricingTable.svelte';
  import FaqAccordion from '#lib/components/FaqAccordion.svelte';
  import Testimonials from '#lib/components/Testimonials.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import DashboardShell from '#lib/components/DashboardShell.svelte';
  import KpiGrid from '#lib/components/KpiGrid.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import SettingsForm from '#lib/components/SettingsForm.svelte';
</script>

<svelte:head>
  <title>${page.title}</title>
  <meta name="description" content="${page.description || ''}" />
</svelte:head>

<main class="min-h-screen">
${content}
</main>
`;
}

export function generateRootLayout(blueprint: ProjectBlueprint): string {
  const defaultLayout = blueprint.layouts.find((l) => l.isDefault) || blueprint.layouts[0];

  return `<script lang="ts">
  import '../app.css';
  import Navbar from '#lib/components/Navbar.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
  {@render children?.()}
</div>
`;
}
