<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';

  type Ratio = '16:9' | '4:3' | '1:1' | '9:16' | '21:9';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    /** YouTube, Vimeo or direct .mp4 / .webm / .ogg URL. */
    url?: string;
    posterUrl?: string;
    /** WebVTT captions for direct video files. */
    captionsUrl?: string;
    aspectRatio?: Ratio;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    /** Accessible title of the player (also shown on the preview). */
    title?: string;
    class?: string;
  }

  let {
    url = '',
    posterUrl = '',
    captionsUrl = '',
    aspectRatio = '16:9',
    autoplay = false,
    muted = false,
    loop = false,
    controls = true,
    title = 'Product walkthrough',
    class: className = '',
    ...rest
  }: Props = $props();

  type Source =
    | { kind: 'youtube'; id: string; start: number }
    | { kind: 'vimeo'; id: string; hash: string; start: number }
    | { kind: 'file'; src: string; mime: string }
    | { kind: 'empty' }
    | { kind: 'unsupported' };

  const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com', 'www.youtube-nocookie.com']);
  const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);
  const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
  const VIMEO_ID = /^\d{1,12}$/;
  const VIMEO_HASH = /^[0-9a-f]{6,24}$/i;
  const FILE_TYPES: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', ogv: 'video/ogg', ogg: 'video/ogg' };
  const RATIOS: Record<Ratio, string> = { '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1', '9:16': '9 / 16', '21:9': '21 / 9' };

  /** `90`, `90s`, `1m30s`, `1h2m3s` → seconds; anything else → 0. */
  function parseStart(value: string | null): number {
    if (!value) return 0;
    if (/^\d{1,6}$/.test(value)) return Number(value);
    const match = /^(?:(\d{1,2})h)?(?:(\d{1,3})m)?(?:(\d{1,5})s)?$/.exec(value);
    if (!match || !match[0]) return 0;
    return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  }

  /** Strict parser: only allow-listed hosts and well-formed IDs are ever embedded. */
  function parseVideo(raw: string): Source {
    const value = String(raw ?? '').trim();
    if (!value) return { kind: 'empty' };
    let parsed: URL;
    try {
      parsed = new URL(value, 'https://relative.invalid');
    } catch {
      return { kind: 'unsupported' };
    }
    const absolute = /^https?:\/\//i.test(value);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (absolute) {
      const host = parsed.hostname.toLowerCase();
      if (YOUTUBE_HOSTS.has(host)) {
        let id = '';
        if (host === 'youtu.be') id = segments[0] ?? '';
        else if (segments[0] === 'watch') id = parsed.searchParams.get('v') ?? '';
        else if (['embed', 'shorts', 'live', 'v'].includes(segments[0] ?? '')) id = segments[1] ?? '';
        const start = parseStart(parsed.searchParams.get('t') ?? parsed.searchParams.get('start'));
        return YOUTUBE_ID.test(id) ? { kind: 'youtube', id, start } : { kind: 'unsupported' };
      }
      if (VIMEO_HOSTS.has(host)) {
        const index = host === 'player.vimeo.com' ? (segments[0] === 'video' ? 1 : -1) : segments.findIndex((s) => VIMEO_ID.test(s));
        const id = index >= 0 ? (segments[index] ?? '') : '';
        const hashCandidate = parsed.searchParams.get('h') ?? segments[index + 1] ?? '';
        const start = parseStart(/^#t=(.+)$/.exec(parsed.hash)?.[1] ?? null);
        return VIMEO_ID.test(id)
          ? { kind: 'vimeo', id, hash: VIMEO_HASH.test(hashCandidate) ? hashCandidate : '', start }
          : { kind: 'unsupported' };
      }
    }
    const ext = /\.([a-z0-9]+)$/i.exec(parsed.pathname)?.[1]?.toLowerCase() ?? '';
    const src = safeSrc(value);
    return src && FILE_TYPES[ext] ? { kind: 'file', src, mime: FILE_TYPES[ext] } : { kind: 'unsupported' };
  }

  const source = $derived(parseVideo(url));
  const ratio = $derived(RATIOS[aspectRatio] ?? RATIOS['16:9']);
  const poster = $derived(
    safeSrc(posterUrl) || (source.kind === 'youtube' ? `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg` : '')
  );
  const captions = $derived(safeSrc(captionsUrl));
  const providerName = $derived(source.kind === 'youtube' ? 'YouTube' : source.kind === 'vimeo' ? 'Vimeo' : '');
  /** Identity of the current embed; the player loads once the visitor clicks this exact video. */
  const embedKey = $derived(source.kind === 'youtube' || source.kind === 'vimeo' ? `${source.kind}:${source.id}` : '');
  let activatedKey = $state('');
  let failedPoster = $state('');
  const playerVisible = $derived(embedKey !== '' && (autoplay || activatedKey === embedKey));
  // Browsers only allow autoplay without sound.
  const startMuted = $derived(muted || autoplay);

  const embedSrc = $derived.by(() => {
    if (source.kind === 'youtube') {
      const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
      if (startMuted) params.set('mute', '1');
      if (loop) {
        params.set('loop', '1');
        params.set('playlist', source.id);
      }
      if (!controls) params.set('controls', '0');
      if (source.start > 0) params.set('start', String(source.start));
      return `https://www.youtube-nocookie.com/embed/${source.id}?${params.toString()}`;
    }
    if (source.kind === 'vimeo') {
      const params = new URLSearchParams({ autoplay: '1', dnt: '1' });
      if (source.hash) params.set('h', source.hash);
      if (startMuted) params.set('muted', '1');
      if (loop) params.set('loop', '1');
      if (!controls) params.set('controls', '0');
      return `https://player.vimeo.com/video/${source.id}?${params.toString()}${source.start > 0 ? `#t=${source.start}s` : ''}`;
    }
    return '';
  });

  const playLabel = $derived(`Play video${title ? `: ${title}` : ''}${providerName ? ` (loads ${providerName})` : ''}`);

  /** Moves focus into the player after the visitor activates it, so keyboard users keep their place. */
  const focusOnLoad: Attachment<HTMLIFrameElement> = (frame) => {
    if (activatedKey === embedKey && !autoplay) frame.focus();
  };
</script>

<div {...rest} class={['video', aspectRatio === '9:16' && 'video--portrait', className]}>
  <div class="frame" style:aspect-ratio={ratio}>
    {#if source.kind === 'file'}
      <video
        class="native"
        src={source.src}
        poster={poster || undefined}
        {controls}
        autoplay={autoplay || undefined}
        muted={startMuted}
        {loop}
        playsinline
        preload="metadata"
        aria-label={title || 'Video'}
      >
        {#if captions}
          <track kind="captions" src={captions} srclang="en" label="Captions" default />
        {/if}
      </video>
    {:else if playerVisible}
      <iframe
        class="player"
        src={embedSrc}
        title={title || `${providerName} video`}
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowfullscreen
        {@attach focusOnLoad}
      ></iframe>
    {:else if source.kind === 'youtube' || source.kind === 'vimeo'}
      <button type="button" class="facade" aria-label={playLabel} onclick={() => (activatedKey = embedKey)}>
        {#if poster && failedPoster !== poster}
          <img class="poster" src={poster} alt="" width="1280" height="720" loading="lazy" decoding="async" onerror={() => (failedPoster = poster)} />
        {/if}
        <span class="scrim" aria-hidden="true"></span>
        {#if title}
          <span class="title" data-prop="title">{title}</span>
        {/if}
        <span class="play" aria-hidden="true"></span>
        <span class="provider" aria-hidden="true">{providerName}</span>
      </button>
    {:else}
      <div class="empty" role="note">
        <span class="empty-icon"><Icon name={source.kind === 'unsupported' ? 'WarningCircle' : 'VideoCamera'} size={24} /></span>
        {#if source.kind === 'unsupported'}
          <span class="empty-title">Unsupported video URL</span>
          <span class="empty-hint">Use a YouTube, Vimeo, .mp4 or .webm link.</span>
        {:else}
          <span class="empty-title" data-prop="title">{title || 'Video'}</span>
          <span class="empty-hint">Add a YouTube, Vimeo or .mp4 link to show the video.</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .video {
    width: 100%;
  }
  .video--portrait .frame {
    max-width: 360px;
    margin-left: auto;
    margin-right: auto;
  }
  .frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 8%, rgb(14, 15, 19));
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.08),
      0 20px 48px -24px rgba(0, 0, 0, 0.4);
    isolation: isolate;
  }
  .native,
  .player {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    background-color: rgb(0, 0, 0);
  }
  .facade {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    color: rgb(255, 255, 255);
    text-align: left;
    cursor: pointer;
  }
  .poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .facade:hover .poster {
    transform: scale(1.015);
  }
  .scrim {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.12) 34%, rgba(0, 0, 0, 0) 55%),
      radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0) 60%);
  }
  .title {
    position: absolute;
    top: 1rem;
    left: 1.25rem;
    right: 1.25rem;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  }
  .play {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 72px;
    height: 72px;
    transform: translate(-50%, -50%);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: rgba(255, 255, 255, 0.94);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.3),
      0 0 0 8px rgba(255, 255, 255, 0.16);
    transition:
      transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .play::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-36%, -50%);
    border-style: solid;
    border-width: 12px 0 12px 20px;
    border-color: transparent transparent transparent rgb(17, 17, 20);
  }
  .facade:hover .play {
    transform: translate(-50%, -50%) scale(1.06);
    box-shadow:
      0 10px 28px rgba(0, 0, 0, 0.34),
      0 0 0 10px rgba(255, 255, 255, 0.2);
  }
  .facade:focus-visible {
    outline: none;
  }
  .facade:focus-visible .play {
    box-shadow:
      0 0 0 3px rgb(17, 17, 20),
      0 0 0 6px rgb(255, 255, 255);
  }
  .provider {
    position: absolute;
    right: 0.875rem;
    bottom: 0.875rem;
    padding: 0.25rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: rgba(0, 0, 0, 0.6);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 1.5rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.92);
    background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1.5px);
    background-size: 20px 20px;
  }
  .empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  }
  .empty-title {
    font-size: 1rem;
    font-weight: 600;
  }
  .empty-hint {
    max-width: 36ch;
    text-wrap: balance;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.66);
  }
  @media (max-width: 767px) {
    .play {
      width: 60px;
      height: 60px;
    }
    .frame {
      border-radius: var(--md-sys-shape-corner-medium, 12px);
    }
  }
</style>
