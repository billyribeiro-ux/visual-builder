<script lang="ts">
  import Button from './Button.svelte';
  import Container from './Container.svelte';

  interface PricingPlan {
    name: string;
    price: string;
    description: string;
    features: string[];
    ctaText?: string;
    ctaHref?: string;
    isPopular?: boolean;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    plans?: PricingPlan[];
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    sectionEyebrow = 'Transparent Plans',
    sectionTitle = 'Simple, Predictable Pricing',
    sectionDescription = 'Scale seamlessly from individual side-projects to enterprise-grade web applications.',
    plans = [],
    style = '',
    onNavigate
  }: Props = $props();
</script>

<section class="md-pricing" {style}>
  <Container maxWidth="xl">
    <div class="md-pricing__header">
      {#if sectionEyebrow}
        <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">
          {sectionEyebrow}
        </div>
      {/if}
      <h2 style="font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem;">{sectionTitle}</h2>
      {#if sectionDescription}
        <p style="color: var(--md-sys-color-on-surface-variant); font-size: 1rem;">{sectionDescription}</p>
      {/if}
    </div>

    <div class="md-pricing__grid">
      {#each plans as plan (plan.name)}
        <div class="md-card md-pricing__card {plan.isPopular ? 'md-pricing__card--popular' : 'md-card--outlined'}">
          <div>
            {#if plan.isPopular}
              <div class="md-pricing__popular-badge">Most Popular</div>
            {/if}
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">{plan.name}</h3>
            <p style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">{plan.description}</p>
            <div class="md-pricing__price">
              {plan.price}<span style="font-size: 1rem; font-weight: 400; color: var(--md-sys-color-on-surface-variant);">/mo</span>
            </div>
            <ul style="list-style: none; padding: 0; margin: 1.5rem 0; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
              {#each plan.features || [] as feat, fIdx (fIdx)}
                <li style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: var(--md-sys-color-primary); font-weight: 700;">✓</span>
                  <span>{feat}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div style="margin-top: 1.5rem;">
            <Button
              href={plan.ctaHref || '/dashboard'}
              variant={plan.isPopular ? 'filled' : 'outlined'}
              style="width: 100%;"
              {onNavigate}
            >
              {plan.ctaText || 'Select Plan'}
            </Button>
          </div>
        </div>
      {/each}
    </div>
  </Container>
</section>
