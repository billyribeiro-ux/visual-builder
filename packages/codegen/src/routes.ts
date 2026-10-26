import type { BlueprintNode, PageRoute, ProjectBlueprint } from '@app-viz/schema';
import { cssPropertiesToString } from '@app-viz/engine';

function renderNodeToSvelte(
  node: BlueprintNode,
  indent = '  ',
  slotNode?: BlueprintNode
): string {
  if (node.hidden) return '';

  const inlineStyle = cssPropertiesToString(node.styles?.base || {});
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  switch (node.componentType) {
    case 'structure/slot': {
      if (slotNode) {
        return renderNodeToSvelte(slotNode, indent);
      }
      return '';
    }

    case 'structure/container': {
      const maxWidth = node.props.maxWidth || 'xl';
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  ', slotNode))
        .filter(Boolean)
        .join('\n');
      return `${indent}<Container maxWidth="${maxWidth}"${styleAttr}>\n${inner}\n${indent}</Container>`;
    }

    case 'structure/section': {
      const p = node.props;
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  ', slotNode))
        .filter(Boolean)
        .join('\n');
      return `${indent}<Section variant="${p.variant || 'surface'}" paddingY="${p.paddingY || 'lg'}" maxWidth="${p.maxWidth || 'xl'}"${styleAttr}>\n${inner}\n${indent}</Section>`;
    }

    case 'structure/grid': {
      const p = node.props;
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  ', slotNode))
        .filter(Boolean)
        .join('\n');
      return `${indent}<Grid columns={${p.columns || 3}} gap="${p.gap || 'md'}"${styleAttr}>\n${inner}\n${indent}</Grid>`;
    }

    case 'structure/divider': {
      const p = node.props;
      return `${indent}<Divider spacing="${p.spacing || 'md'}" label=${JSON.stringify(p.label || '')}${styleAttr} />`;
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

    case 'marketing/cta-banner': {
      const p = node.props;
      return `${indent}<CtaBanner
${indent}  eyebrow=${JSON.stringify(p.eyebrow || '')}
${indent}  title=${JSON.stringify(p.title || '')}
${indent}  subtitle=${JSON.stringify(p.subtitle || '')}
${indent}  primaryCtaText=${JSON.stringify(p.primaryCtaText || 'Get Started')}
${indent}  primaryCtaHref=${JSON.stringify(p.primaryCtaHref || '/dashboard')}
${indent}  secondaryCtaText=${JSON.stringify(p.secondaryCtaText || '')}
${indent}  secondaryCtaHref=${JSON.stringify(p.secondaryCtaHref || '#')}${styleAttr}
${indent}/>`;
    }

    case 'marketing/stats-bar': {
      const p = node.props;
      return `${indent}<StatsBar stats={${JSON.stringify(p.stats || [])}}${styleAttr} />`;
    }

    case 'marketing/newsletter': {
      const p = node.props;
      return `${indent}<Newsletter
${indent}  title=${JSON.stringify(p.title || '')}
${indent}  subtitle=${JSON.stringify(p.subtitle || '')}
${indent}  placeholder=${JSON.stringify(p.placeholder || 'you@company.com')}
${indent}  buttonText=${JSON.stringify(p.buttonText || 'Subscribe')}${styleAttr}
${indent}/>`;
    }

    case 'marketing/contact-form': {
      const p = node.props;
      return `${indent}<ContactForm
${indent}  sectionEyebrow=${JSON.stringify(p.sectionEyebrow || '')}
${indent}  sectionTitle=${JSON.stringify(p.sectionTitle || '')}
${indent}  sectionSubtitle=${JSON.stringify(p.sectionSubtitle || '')}
${indent}  submitText=${JSON.stringify(p.submitText || 'Send Message')}${styleAttr}
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
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  ', slotNode))
        .filter(Boolean)
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

    case 'app/auth-card': {
      const p = node.props;
      return `${indent}<AuthCard
${indent}  mode=${JSON.stringify(p.mode || 'signin')}
${indent}  brandName=${JSON.stringify(p.brandName || 'Acme Cloud')}
${indent}  title=${JSON.stringify(p.title || 'Welcome back')}
${indent}  subtitle=${JSON.stringify(p.subtitle || '')}
${indent}  redirectHref=${JSON.stringify(p.redirectHref || '/dashboard')}${styleAttr}
${indent}/>`;
    }

    case 'ui/button': {
      const p = node.props;
      return `${indent}<Button variant="${p.variant || 'primary'}" size="${p.size || 'md'}" href="${p.href || ''}"${styleAttr}>${p.text || 'Button'}</Button>`;
    }

    case 'ui/badge': {
      const p = node.props;
      return `${indent}<Badge text=${JSON.stringify(p.text || 'Badge')} tone="${p.tone || 'primary'}"${styleAttr} />`;
    }

    case 'ui/card': {
      const p = node.props;
      return `${indent}<Card
${indent}  variant="${p.variant || 'elevated'}"
${indent}  eyebrow=${JSON.stringify(p.eyebrow || '')}
${indent}  title=${JSON.stringify(p.title || '')}
${indent}  body=${JSON.stringify(p.body || '')}
${indent}  actionText=${JSON.stringify(p.actionText || '')}
${indent}  actionHref=${JSON.stringify(p.actionHref || '#')}${styleAttr}
${indent}/>`;
    }

    case 'ui/alert': {
      const p = node.props;
      return `${indent}<Alert tone="${p.tone || 'info'}" title=${JSON.stringify(p.title || '')} message=${JSON.stringify(p.message || '')} dismissible={${p.dismissible !== false}}${styleAttr} />`;
    }

    case 'ui/tabs': {
      const p = node.props;
      return `${indent}<Tabs tabs={${JSON.stringify(p.tabs || [])}}${styleAttr} />`;
    }

    default: {
      const inner = (node.children || [])
        .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  ', slotNode))
        .filter(Boolean)
        .join('\n');
      return `${indent}<div${styleAttr}>\n${inner}\n${indent}</div>`;
    }
  }
}

export function generatePageRoute(page: PageRoute, blueprint?: ProjectBlueprint): string {
  const layout =
    page.layoutId && blueprint
      ? blueprint.layouts.find((l) => l.id === page.layoutId)
      : undefined;

  const content = layout
    ? renderNodeToSvelte(layout.rootNode, '  ', page.rootNode)
    : renderNodeToSvelte(page.rootNode, '  ');

  return `<script lang="ts">
  import Container from '#lib/components/Container.svelte';
  import Section from '#lib/components/Section.svelte';
  import Grid from '#lib/components/Grid.svelte';
  import Divider from '#lib/components/Divider.svelte';
  import Navbar from '#lib/components/Navbar.svelte';
  import Button from '#lib/components/Button.svelte';
  import Badge from '#lib/components/Badge.svelte';
  import Card from '#lib/components/Card.svelte';
  import Alert from '#lib/components/Alert.svelte';
  import Tabs from '#lib/components/Tabs.svelte';
  import SplitHero from '#lib/components/SplitHero.svelte';
  import FeatureGrid from '#lib/components/FeatureGrid.svelte';
  import PricingTable from '#lib/components/PricingTable.svelte';
  import FaqAccordion from '#lib/components/FaqAccordion.svelte';
  import Testimonials from '#lib/components/Testimonials.svelte';
  import CtaBanner from '#lib/components/CtaBanner.svelte';
  import StatsBar from '#lib/components/StatsBar.svelte';
  import Newsletter from '#lib/components/Newsletter.svelte';
  import ContactForm from '#lib/components/ContactForm.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import DashboardShell from '#lib/components/DashboardShell.svelte';
  import KpiGrid from '#lib/components/KpiGrid.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import SettingsForm from '#lib/components/SettingsForm.svelte';
  import AuthCard from '#lib/components/AuthCard.svelte';
</script>

<svelte:head>
  <title>${page.title}</title>
  <meta name="description" content="${page.description || ''}" />
</svelte:head>

<main style="min-height: 100vh;">
${content}
</main>
`;
}

export function generateRootLayout(_blueprint: ProjectBlueprint): string {
  return `<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
  {@render children?.()}
</div>
`;
}

export function generateErrorRoute(): string {
  return `<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="md-section" style="min-height: 80vh; display: flex; align-items: center; justify-content: center;">
  <div class="md-container md-card md-card-outlined" style="max-width: 32rem; text-align: center; padding: 3rem 2rem;">
    <span class="md-badge" style="margin-bottom: 1rem;">Error {page.status}</span>
    <h1 class="md-headline-large" style="margin: 0 0 0.75rem 0;">{page.error?.message || 'Page Not Found'}</h1>
    <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.75rem 0;">
      The requested route does not exist or encountered an unexpected condition.
    </p>
    <a href="/" class="md-btn md-btn-filled">Return to Home</a>
  </div>
</div>
`;
}
