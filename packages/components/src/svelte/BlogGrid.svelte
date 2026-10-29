<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface BlogPost {
    title?: string;
    excerpt?: string;
    imageUrl?: string;
    href?: string;
    category?: string;
    /** ISO 8601 date, e.g. `2026-10-14`. */
    date?: string;
    readTime?: string;
    authorName?: string;
    authorAvatarUrl?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    viewAllText?: string;
    viewAllHref?: string;
    posts?: BlogPost[];
    columns?: number;
    variant?: 'cards' | 'list' | 'featured-first';
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Latest articles',
    sectionDescription = '',
    viewAllText = '',
    viewAllHref = '/blog',
    posts = [],
    columns = 3,
    variant = 'cards',
    class: className = '',
    ...rest
  }: Props = $props();

  /** Fixed locale + UTC: server and browser always print the same string (no hydration mismatch). */
  const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

  /** ISO 8601 date or date-time only; anything else (e.g. "Spring 2026") is shown verbatim. */
  const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

  function parseIso(value: string): number {
    return ISO_DATE.test(value) ? Date.parse(value) : Number.NaN;
  }

  function formatDate(value: string): string {
    const time = parseIso(value);
    return Number.isNaN(time) ? value : DATE_FORMAT.format(time);
  }

  function initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  const cols = $derived(Math.min(3, Math.max(2, Math.round(Number(columns) || 3))));

  const entries = $derived(
    (Array.isArray(posts) ? posts : []).map((post, index) => {
      const date = String(post?.date ?? '').trim();
      const authorName = String(post?.authorName ?? '');
      return {
        index,
        title: String(post?.title ?? ''),
        excerpt: String(post?.excerpt ?? ''),
        image: safeSrc(post?.imageUrl),
        href: String(post?.href ?? ''),
        category: String(post?.category ?? ''),
        date,
        dateLabel: date ? formatDate(date) : '',
        isoDate: Number.isNaN(parseIso(date)) ? undefined : date,
        readTime: String(post?.readTime ?? ''),
        authorName,
        authorInitials: initials(authorName),
        avatar: safeSrc(post?.authorAvatarUrl)
      };
    })
  );
</script>

<section {...rest} class={['blog', `blog--${variant}`, `cols-${cols}`, className]}>
  <div class="md-container md-container--xl">
    <div class="header">
      <div class="header-copy">
        {#if sectionEyebrow}
          <p class="md-eyebrow eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
        {/if}
        <h2 class="heading" data-prop="sectionTitle">{sectionTitle}</h2>
        {#if sectionDescription}
          <p class="description" data-prop="sectionDescription">{sectionDescription}</p>
        {/if}
      </div>
      {#if viewAllText}
        <a href={safeHref(viewAllHref)} class="view-all">
          <span data-prop="viewAllText">{viewAllText}</span>
          <Icon name="ArrowRight" size={16} />
        </a>
      {/if}
    </div>

    <ul class="posts">
      {#each entries as post (post.index)}
        <li class={['post', variant === 'featured-first' && post.index === 0 && 'post--featured']}>
          <article class="post-inner">
            <div class={['media', `tone-${post.index % 3}`]}>
              {#if post.image}
                <img src={post.image} alt="" width="800" height="450" loading="lazy" />
              {:else}
                <div class="placeholder" aria-hidden="true">
                  <span class="placeholder-icon"><Icon name="Article" size={22} /></span>
                </div>
              {/if}
            </div>
            <div class="body">
              <div class="meta">
                {#if post.category}
                  <span class="category" data-prop={`posts.${post.index}.category`}>{post.category}</span>
                {/if}
                {#if post.dateLabel}
                  <time datetime={post.isoDate} class="meta-item">{post.dateLabel}</time>
                {/if}
                {#if post.readTime}
                  <span class="meta-item meta-item--sep" data-prop={`posts.${post.index}.readTime`}>{post.readTime}</span>
                {/if}
              </div>
              <h3 class="title">
                <a href={safeHref(post.href)} class="title-link" data-prop={`posts.${post.index}.title`}>{post.title}</a>
              </h3>
              {#if post.excerpt}
                <p class="excerpt" data-prop={`posts.${post.index}.excerpt`}>{post.excerpt}</p>
              {/if}
              {#if post.authorName}
                <div class="author">
                  {#if post.avatar}
                    <img src={post.avatar} alt="" width="32" height="32" class="avatar" loading="lazy" />
                  {:else}
                    <span class="avatar avatar--initials" aria-hidden="true">{post.authorInitials}</span>
                  {/if}
                  <span class="author-name" data-prop={`posts.${post.index}.authorName`}>{post.authorName}</span>
                </div>
              {/if}
            </div>
          </article>
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .blog {
    padding: 6rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem 2rem;
    margin-bottom: 3rem;
  }
  .header-copy {
    max-width: 40rem;
  }
  .eyebrow {
    margin-bottom: 0.75rem;
  }
  .heading {
    font-size: clamp(1.875rem, 1.3rem + 1.9vw, 2.75rem);
    line-height: 1.12;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  .description {
    margin-top: 0.875rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .view-all {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    padding: 0 1rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    font-size: 0.875rem;
    font-weight: 600;
    white-space: nowrap;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .view-all:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }

  /* ---------------------------------------------------------------- layout */
  .posts {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
    list-style: none;
  }
  @media (min-width: 768px) {
    .blog--cards .posts,
    .blog--featured-first .posts {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1024px) {
    .blog--cards.cols-3 .posts,
    .blog--featured-first.cols-3 .posts {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 2.5rem 2rem;
    }
  }
  .post {
    min-width: 0;
  }
  .post-inner {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    height: 100%;
  }

  /* featured first: the first post spans the row as a horizontal card */
  .post--featured {
    grid-column: 1 / -1;
  }
  @media (min-width: 768px) {
    .post--featured .post-inner {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
      gap: 2.5rem;
      align-items: center;
    }
    .post--featured .title {
      font-size: 1.75rem;
      line-height: 1.25;
      letter-spacing: -0.025em;
    }
    .post--featured .excerpt {
      font-size: 1.0625rem;
      -webkit-line-clamp: 4;
      line-clamp: 4;
    }
  }

  /* list: image left, text right */
  .blog--list .posts {
    gap: 0;
  }
  .blog--list .post + .post {
    border-top: 1px solid var(--md-sys-color-surface-variant);
  }
  .blog--list .post-inner {
    padding: 1.75rem 0;
  }
  @media (min-width: 768px) {
    .blog--list .post-inner {
      display: grid;
      grid-template-columns: 18rem minmax(0, 1fr);
      gap: 2rem;
      align-items: center;
    }
  }

  /* ---------------------------------------------------------------- media */
  .media {
    position: relative;
    overflow: hidden;
    aspect-ratio: 16 / 10;
    border-radius: 16px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .post-inner:hover .media img {
    transform: scale(1.03);
  }
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-image:
      radial-gradient(ellipse 70% 80% at 100% 0%, color-mix(in srgb, var(--tone) 22%, transparent), transparent 70%),
      radial-gradient(ellipse 60% 70% at 0% 100%, color-mix(in srgb, var(--tone) 12%, transparent), transparent 70%),
      linear-gradient(to right, color-mix(in srgb, var(--md-sys-color-outline-variant) 35%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--md-sys-color-outline-variant) 35%, transparent) 1px, transparent 1px);
    background-size: auto, auto, 32px 32px, 32px 32px;
  }
  .tone-0 {
    --tone: var(--md-sys-color-primary);
  }
  .tone-1 {
    --tone: var(--md-sys-color-tertiary);
  }
  .tone-2 {
    --tone: var(--md-sys-color-secondary);
  }
  .placeholder-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    color: color-mix(in srgb, var(--tone) 80%, var(--md-sys-color-on-surface));
    box-shadow: 0 10px 24px -12px rgba(0, 0, 0, 0.25);
  }

  /* ---------------------------------------------------------------- body */
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.25rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .category {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent);
    color: var(--md-sys-color-primary);
    font-weight: 600;
  }
  .meta-item--sep::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 3px;
    margin-right: 0.75rem;
    vertical-align: middle;
    border-radius: 50%;
    background-color: currentColor;
    opacity: 0.6;
  }
  .meta .category + .meta-item--sep::before {
    display: none;
  }
  .title {
    font-size: 1.1875rem;
    line-height: 1.35;
    font-weight: 650;
    letter-spacing: -0.015em;
    text-wrap: balance;
  }
  .title-link {
    color: var(--md-sys-color-on-surface);
  }
  /* The whole card is clickable through the title link (one link per card, accessible name = title). */
  .title-link::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: 16px;
  }
  .title-link:focus-visible {
    outline: none;
  }
  .title-link:focus-visible::after {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 4px;
  }
  .post-inner:hover .title-link {
    color: var(--md-sys-color-primary);
  }
  .excerpt {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .author {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-top: 0.25rem;
  }
  .avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
  .avatar--initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--md-sys-color-primary) 22%, var(--md-sys-color-surface-container-lowest)),
      color-mix(in srgb, var(--md-sys-color-tertiary) 22%, var(--md-sys-color-surface-container-lowest))
    );
    color: var(--md-sys-color-on-surface);
    font-size: 0.75rem;
    font-weight: 700;
  }
  .author-name {
    font-size: 0.875rem;
    font-weight: 600;
  }

  @media (max-width: 767px) {
    .blog {
      padding: 4rem 0;
    }
    .header {
      margin-bottom: 2rem;
    }
    .view-all {
      min-height: 44px;
    }
  }
</style>
