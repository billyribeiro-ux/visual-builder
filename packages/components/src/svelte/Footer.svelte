<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface FooterLink {
    label: string;
    href: string;
  }

  interface FooterColumn {
    title: string;
    links: FooterLink[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    brandName?: string;
    tagline?: string;
    copyright?: string;
    /** Shows an email signup under the tagline when set. */
    newsletterTitle?: string;
    newsletterButtonText?: string;
    columns?: FooterColumn[];
    legalLinks?: FooterLink[];
    class?: string;
  }

  let {
    brandName = 'Halden',
    tagline = '',
    copyright = '',
    newsletterTitle = '',
    newsletterButtonText = 'Subscribe',
    columns = [],
    legalLinks = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  let email = $state('');
  let subscribed = $state(false);

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    subscribed = true;
    email = '';
  }
</script>

<footer {...rest} class={['footer', className]}>
  <div class="md-container md-container--xl">
    <div class="grid" style:--link-cols={Math.min(4, Math.max(1, columns.length))}>
      <div class="brand-col">
        <a href="/" class="brand">
          <span class="mark" aria-hidden="true">{brandName.charAt(0)}</span>
          <span class="brand-name" data-prop="brandName">{brandName}</span>
        </a>
        {#if tagline}
          <p class="tagline" data-prop="tagline">{tagline}</p>
        {/if}
        {#if newsletterTitle}
          <div class="newsletter">
            <p class="newsletter-title" id="{uid}-newsletter-title" data-prop="newsletterTitle">{newsletterTitle}</p>
            {#if subscribed}
              <p class="confirmation" role="status">
                <Icon name="CheckCircle" size={16} />
                Thanks — you are on the list.
              </p>
            {:else}
              <form class="newsletter-form" aria-labelledby="{uid}-newsletter-title" onsubmit={handleSubmit}>
                <label class="md-visually-hidden" for="{uid}-email">Email address</label>
                <input
                  id="{uid}-email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="you@company.com"
                  bind:value={email}
                  class="md-input newsletter-input"
                />
                <button type="submit" class="md-btn md-btn--sm md-btn--filled" data-prop="newsletterButtonText">{newsletterButtonText}</button>
              </form>
            {/if}
          </div>
        {/if}
      </div>

      {#each columns as column, columnIndex (columnIndex)}
        <nav class="column" aria-label={column.title || 'Footer links'}>
          <p class="column-title" data-prop={`columns.${columnIndex}.title`}>{column.title}</p>
          <ul class="link-list">
            {#each column.links as link, linkIndex (linkIndex)}
              <li>
                <a href={safeHref(link.href)} class="link" data-prop={`columns.${columnIndex}.links.${linkIndex}.label`}>{link.label}</a>
              </li>
            {/each}
          </ul>
        </nav>
      {/each}
    </div>

    {#if copyright || legalLinks.length > 0}
      <div class="bottom">
        {#if copyright}
          <p class="copyright" data-prop="copyright">{copyright}</p>
        {/if}
        {#if legalLinks.length > 0}
          <ul class="legal">
            {#each legalLinks as link, linkIndex (linkIndex)}
              <li>
                <a href={safeHref(link.href)} class="legal-link" data-prop={`legalLinks.${linkIndex}.label`}>{link.label}</a>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</footer>

<style>
  .footer {
    padding: clamp(3.5rem, 2.5rem + 3vw, 5rem) 0 2rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.5rem 1.5rem;
  }
  .brand-col {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    min-width: 0;
  }
  @media (min-width: 640px) {
    .grid {
      grid-template-columns: repeat(var(--link-cols, 2), minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: minmax(0, 1.6fr) repeat(var(--link-cols, 2), minmax(0, 1fr));
      gap: 3rem;
    }
    .brand-col {
      grid-column: auto;
      padding-right: 2rem;
    }
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    color: var(--md-sys-color-on-surface);
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 60%),
      var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.08),
      0 1px 2px rgba(15, 23, 42, 0.16);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
  }
  .brand-name {
    font-family: var(--md-sys-font-heading);
    font-size: 1.0625rem;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
  }
  .tagline {
    max-width: 22rem;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .newsletter {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    max-width: 24rem;
    margin-top: 0.5rem;
  }
  .newsletter-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .newsletter-form {
    display: flex;
    gap: 0.5rem;
  }
  .newsletter-input {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    min-height: 40px;
    padding-top: 0.4375rem;
    padding-bottom: 0.4375rem;
    font-size: 0.875rem;
  }
  .confirmation {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-success);
  }
  .column {
    min-width: 0;
  }
  .column-title {
    margin-bottom: 0.875rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .link-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .link {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    border-radius: 4px;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover {
    color: var(--md-sys-color-on-surface);
  }
  @media (min-width: 1024px) {
    .link {
      min-height: 32px;
    }
  }
  .bottom {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 3.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  @media (min-width: 768px) {
    .bottom {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  .copyright {
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .legal {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.5rem;
  }
  .legal-link {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .legal-link:hover {
    color: var(--md-sys-color-on-surface);
  }
</style>
