<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    label?: string;
    /** Completion in percent; clamped to 0–100. */
    value?: number;
    showValue?: boolean;
    tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
    striped?: boolean;
    class?: string;
  }

  let {
    label = 'Onboarding completion',
    value = 72,
    showValue = true,
    tone = 'primary',
    size = 'md',
    striped = false,
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const percent = $derived(typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.min(100, Math.max(0, value))) : 0);

  /** True while the fill waits (at 0 width) for the bar to scroll into view. */
  let waiting = $state(false);

  const fillOnView: Attachment<HTMLElement> = (node) => {
    void percent;
    const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof IntersectionObserver === 'undefined' || reduceMotion) {
      waiting = false;
      return;
    }
    waiting = true;
    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        // One frame at 0 width so the transition always has a start value.
        frame = requestAnimationFrame(() => (waiting = false));
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  };
</script>

<div {...rest} class={['progress', `progress--${size}`, `tone-${tone}`, striped && 'progress--striped', className]}>
  {#if label || showValue}
    <div class="meta">
      {#if label}
        <span class="label" id="{uid}-label" data-prop="label">{label}</span>
      {/if}
      {#if showValue}
        <span class="value" aria-hidden="true">{percent}%</span>
      {/if}
    </div>
  {/if}
  <div
    class="track"
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={percent}
    aria-valuetext="{percent}%"
    aria-labelledby={label ? `${uid}-label` : undefined}
    aria-label={label ? undefined : 'Progress'}
    {@attach fillOnView}
  >
    <div class={['fill', waiting && 'fill--waiting']} style:width="{waiting ? 0 : percent}%"></div>
  </div>
</div>

<style>
  .progress {
    --progress-color: var(--md-sys-color-primary);
    --progress-height: 10px;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    color: var(--md-sys-color-on-surface);
  }
  .progress--sm {
    --progress-height: 6px;
    gap: 0.5rem;
  }
  .progress--lg {
    --progress-height: 16px;
  }

  .tone-success {
    --progress-color: var(--md-sys-color-success, var(--md-sys-color-tertiary));
  }
  .tone-warning {
    --progress-color: var(--md-sys-color-warning, #b45309);
  }
  .tone-danger {
    --progress-color: var(--md-sys-color-error);
  }
  .tone-neutral {
    --progress-color: var(--md-sys-color-on-surface-variant);
  }

  .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .label {
    min-width: 0;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    overflow-wrap: anywhere;
  }
  .value {
    flex: 0 0 auto;
    margin-left: auto;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface-variant);
  }

  .track {
    position: relative;
    width: 100%;
    height: var(--progress-height);
    overflow: hidden;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-high);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
  }
  .fill {
    height: 100%;
    max-width: 100%;
    border-radius: inherit;
    background-color: var(--progress-color);
    transition: width 1s var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }
  .fill--waiting {
    transition: none;
  }

  .progress--striped .fill {
    background-image: linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.2) 25%,
      transparent 25%,
      transparent 50%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0.2) 75%,
      transparent 75%,
      transparent
    );
    background-size: 1rem 1rem;
    animation: progress-stripes 1s linear infinite;
  }
  .progress--sm.progress--striped .fill {
    background-size: 0.75rem 0.75rem;
  }

  @keyframes progress-stripes {
    from {
      background-position: 1rem 0;
    }
    to {
      background-position: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .fill {
      transition: none;
    }
    .progress--striped .fill {
      animation: none;
    }
  }
</style>
