<script lang="ts">
  import { tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    /** Address or place name (Google Maps search; shown in the address bar). */
    query?: string;
    provider?: 'openstreetmap' | 'google';
    /** Required for OpenStreetMap (no geocoding without an API). */
    lat?: number;
    lng?: number;
    zoom?: number;
    /** Map height in px. */
    height?: number;
    /** Accessible map title, also the heading of the address bar. */
    title?: string;
    showAddress?: boolean;
    class?: string;
  }

  let {
    query = '',
    provider = 'openstreetmap',
    lat,
    lng,
    zoom = 15,
    height = 400,
    title = 'Our office',
    showAddress = true,
    class: className = '',
    ...rest
  }: Props = $props();

  const z = $derived(Math.min(19, Math.max(1, Math.round(Number(zoom) || 15))));
  const mapHeight = $derived(Math.min(900, Math.max(200, Math.round(Number(height) || 400))));
  const coords = $derived(
    typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 85 && Math.abs(lng) <= 180
      ? { lat, lng }
      : null
  );
  const place = $derived(String(query ?? '').trim());
  const useGoogle = $derived(provider === 'google');

  /** Bounding box around the point that roughly matches a web-map zoom level for a ~900px wide frame. */
  function bbox(point: { lat: number; lng: number }, level: number): string {
    const halfLng = (360 / 2 ** level) * 1.25;
    const halfLat = halfLng * Math.cos((point.lat * Math.PI) / 180) * 0.6;
    const f = (n: number) => n.toFixed(6);
    return [f(point.lng - halfLng), f(point.lat - halfLat), f(point.lng + halfLng), f(point.lat + halfLat)].join(',');
  }

  /** Only numbers and encodeURIComponent output ever reach the iframe URL. */
  const embedSrc = $derived.by(() => {
    if (useGoogle) {
      const q = place || (coords ? `${coords.lat},${coords.lng}` : '');
      return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${z}&output=embed` : '';
    }
    if (!coords) return '';
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox(coords, z)}&layer=mapnik&marker=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
  });

  const directionsHref = $derived.by(() => {
    if (useGoogle || !coords) {
      const q = place || (coords ? `${coords.lat},${coords.lng}` : '');
      return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
    }
    const la = coords.lat.toFixed(6);
    const lo = coords.lng.toFixed(6);
    return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=${z}/${la}/${lo}`;
  });

  const frameTitle = $derived(title ? `Map: ${title}` : place ? `Map: ${place}` : 'Map');

  /** The map stays inert until clicked, so page scrolling never gets captured by the embed. */
  let activated = $state(false);

  async function activate(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
    const frame = event.currentTarget.parentElement?.querySelector('iframe');
    activated = true;
    await tick();
    frame?.focus();
  }
</script>

<div {...rest} class={['map', className]}>
  <div class="frame" style:height="{mapHeight}px">
    {#if embedSrc}
      <iframe
        class="embed"
        src={embedSrc}
        title={frameTitle}
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        inert={!activated}
      ></iframe>
      {#if !activated}
        <button type="button" class="shield" onclick={activate} aria-label={`Interact with ${frameTitle.toLowerCase()}`}>
          <span class="shield-hint" aria-hidden="true">
            <Icon name="CursorClick" size={16} />
            Click to interact
          </span>
        </button>
      {/if}
    {:else}
      <div class="empty" role="note">
        <span class="empty-icon"><Icon name="MapTrifold" size={24} /></span>
        <span class="empty-title">Map location needed</span>
        <span class="empty-hint">
          {useGoogle ? 'Add an address or place name to show the map.' : 'OpenStreetMap needs a latitude and longitude. Add them, or switch the provider to Google Maps to search by address.'}
        </span>
      </div>
    {/if}
  </div>
  {#if showAddress && (title || place)}
    <div class="details">
      <span class="pin" aria-hidden="true"><Icon name="MapPin" size={20} /></span>
      <div class="address">
        {#if title}
          <p class="title" data-prop="title">{title}</p>
        {/if}
        {#if place}
          <p class="query" data-prop="query">{place}</p>
        {/if}
      </div>
      {#if directionsHref}
        <a href={safeHref(directionsHref)} class="directions" target="_blank" rel="noopener noreferrer">
          Get directions
          <Icon name="ArrowUpRight" size={16} />
          <span class="visually-hidden">(opens in a new tab)</span>
        </a>
      {/if}
    </div>
  {/if}
</div>

<style>
  .map {
    width: 100%;
    overflow: hidden;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .frame {
    position: relative;
    width: 100%;
    background-color: var(--md-sys-color-surface-container-low);
  }
  .embed {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .shield {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
    background: transparent;
    cursor: pointer;
  }
  .shield-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgb(255, 255, 255);
    background-color: rgba(17, 17, 20, 0.78);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .shield:hover .shield-hint,
  .shield:focus-visible .shield-hint {
    opacity: 1;
    transform: translateY(0);
  }
  .shield:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    height: 100%;
    padding: 1.5rem;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
    background-image: radial-gradient(color-mix(in srgb, var(--md-sys-color-outline) 22%, transparent) 1px, transparent 1.5px);
    background-size: 18px 18px;
  }
  .empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .empty-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .empty-hint {
    max-width: 44ch;
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  .details {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .pin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    color: var(--md-sys-color-primary);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
  }
  .address {
    flex: 1 1 auto;
    min-width: 0;
    line-height: 1.45;
  }
  .title {
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .query {
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
    overflow-wrap: anywhere;
  }
  .directions {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 0;
    min-height: 40px;
    padding: 0 1rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid var(--md-sys-color-outline-variant);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    white-space: nowrap;
    transition:
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .directions:hover {
    background-color: var(--md-sys-color-surface-container-low);
    border-color: var(--md-sys-color-outline);
  }
  .directions:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 479px) {
    .details {
      flex-wrap: wrap;
    }
    .directions {
      width: 100%;
      justify-content: center;
    }
  }
</style>
