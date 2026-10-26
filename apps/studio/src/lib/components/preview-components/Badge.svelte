<script lang="ts">
  interface Props {
    text?: string;
    tone?: 'primary' | 'secondary' | 'tertiary' | 'error';
    style?: string;
  }

  let { text = 'Badge', tone = 'primary', style = '' }: Props = $props();

  const toneStyles: Record<string, string> = {
    primary: 'background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);',
    secondary: 'background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container);',
    tertiary: 'background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);',
    error: 'background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);'
  };
</script>

<span class="md-badge" style="{toneStyles[tone] || toneStyles.primary} {style}">{text}</span>
