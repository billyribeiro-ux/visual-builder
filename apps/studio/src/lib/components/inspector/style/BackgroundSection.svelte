<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import ProhibitIcon from 'phosphor-svelte/lib/ProhibitIcon';
  import PaintBucketIcon from 'phosphor-svelte/lib/PaintBucketIcon';
  import GradientIcon from 'phosphor-svelte/lib/GradientIcon';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Field from '../../../ui/Field.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import ColorField from '../../../ui/ColorField.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import Seg, { type SegOption } from '../controls/Seg.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import StyleColor from '../controls/StyleColor.svelte';
  import StyleSelect from '../controls/StyleSelect.svelte';
  import GradientEditor from '../controls/GradientEditor.svelte';
  import AssetPicker from '../controls/AssetPicker.svelte';
  import PositionGrid from '../controls/PositionGrid.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';
  import { colorSwatches } from '../lib/swatches.js';
  import { cssSafeImageUrl, parseBackgroundImage, serializeBackgroundImage } from '../lib/css-values.js';

  type Fill = 'none' | 'color' | 'gradient' | 'image';

  const s = getStyleTarget();

  const IMAGE_KEYS = ['backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat', 'backgroundAttachment'] as const;
  const KEYS = ['background', 'backgroundColor', ...IMAGE_KEYS] as const;
  const modified = $derived(s.anySet(KEYS));
  const swatches = $derived(colorSwatches(editor.blueprint.tokens?.colors));

  const DEFAULT_GRADIENT = 'linear-gradient(135deg, #2F6BFF 0%, #7A5AF8 100%)';

  /** A legacy `background` shorthand counts as image/gradient or color for detection. */
  const imageValue = $derived(s.effective('backgroundImage') || (/gradient\(|url\(/i.test(s.effective('background')) ? s.effective('background') : ''));
  const colorValue = $derived(s.effective('backgroundColor') || (s.effective('background') && !imageValue ? s.effective('background') : ''));
  const info = $derived(parseBackgroundImage(imageValue));

  const detected = $derived<Fill>(info.kind === 'image' ? 'image' : info.kind === 'gradient' ? 'gradient' : colorValue ? 'color' : 'none');
  /** Chosen fill before any value exists for it (e.g. Image before a URL is picked). */
  let pending = $state<{ bucket: string; fill: Fill } | null>(null);
  const fill = $derived<Fill>(pending && pending.bucket === s.bucket ? pending.fill : detected);
  const fillInherited = $derived(fill === detected && !s.anySet(KEYS) && detected !== 'none');

  const FILLS: SegOption<Fill>[] = [
    { value: 'none', title: 'No fill', icon: ProhibitIcon },
    { value: 'color', title: 'Solid color', icon: PaintBucketIcon },
    { value: 'gradient', title: 'Gradient', icon: GradientIcon },
    { value: 'image', title: 'Image', icon: ImageIcon }
  ];

  const SIZES: SegOption<string>[] = [
    { value: 'cover', label: 'Cover', title: 'Cover — fill the element, cropping if needed' },
    { value: 'contain', label: 'Contain', title: 'Contain — show the whole image' },
    { value: 'auto', label: 'Auto', title: 'Auto — natural image size' }
  ];

  const REPEAT = [
    { value: 'no-repeat', label: "Don't repeat" },
    { value: 'repeat', label: 'Tile' },
    { value: 'repeat-x', label: 'Tile horizontally' },
    { value: 'repeat-y', label: 'Tile vertically' }
  ];

  const ATTACHMENT: SegOption<string>[] = [
    { value: 'scroll', label: 'Scroll', title: 'Scrolls with the page' },
    { value: 'fixed', label: 'Fixed', title: 'Stays fixed while the page scrolls (parallax)' }
  ];

  function chooseFill(next: Fill) {
    if (next === fill) return;
    pending = null;
    if (next === 'none') {
      s.reset(KEYS);
      return;
    }
    if (next === 'color') {
      s.setMany({ background: '', backgroundImage: '', backgroundSize: '', backgroundPosition: '', backgroundRepeat: '', backgroundAttachment: '' });
      if (!colorValue) pending = { bucket: s.bucket, fill: 'color' };
      return;
    }
    if (next === 'gradient') {
      s.setMany({ background: '', backgroundImage: DEFAULT_GRADIENT, backgroundSize: '', backgroundPosition: '', backgroundRepeat: '', backgroundAttachment: '' });
      return;
    }
    pending = { bucket: s.bucket, fill: 'image' };
  }

  function setImage(url: string) {
    if (!url) {
      s.setMany({ backgroundImage: '', background: '' });
      pending = { bucket: s.bucket, fill: 'image' };
      return;
    }
    const safe = cssSafeImageUrl(url);
    if (safe.error) {
      editor.notify('error', safe.error);
      return;
    }
    pending = null;
    s.setMany({
      background: '',
      backgroundImage: serializeBackgroundImage(safe.url, info.overlay),
      backgroundSize: s.effective('backgroundSize') ? s.get('backgroundSize') : 'cover',
      backgroundPosition: s.effective('backgroundPosition') ? s.get('backgroundPosition') : 'center center',
      backgroundRepeat: s.effective('backgroundRepeat') ? s.get('backgroundRepeat') : 'no-repeat'
    });
  }

  function setOverlay(color: string) {
    if (!info.url) return;
    s.set('backgroundImage', serializeBackgroundImage(info.url, color));
  }
</script>

<PanelSection id="style-background" title="Background" defaultOpen={false} {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset background" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => { pending = null; s.reset(KEYS); }} />
    {/if}
  {/snippet}

  <StyleField label="Fill" keys={KEYS}>
    <Seg options={FILLS} value={fill} inherited={fillInherited} iconOnly ariaLabel="Background fill" onchange={chooseFill} />
  </StyleField>

  {#if fill === 'color'}
    <StyleColor prop="backgroundColor" label="Color" />
  {:else if fill === 'gradient'}
    <GradientEditor value={imageValue} {swatches} onchange={(css) => s.setMany({ backgroundImage: css, background: '' })} onend={s.endEdit} />
  {:else if fill === 'image'}
    <Field label="Image" layout="stack">
      <AssetPicker
        value={info.url}
        label="Background image"
        allowDataUrls
        resolveAsset={(asset) => {
          // Reference the asset by path: the canvas maps it to the uploaded file, the export ships it.
          const safe = cssSafeImageUrl(asset.localPath || asset.dataUrl || '');
          return safe.error ? { value: '', error: safe.error } : { value: safe.url };
        }}
        onchange={setImage}
      />
    </Field>
    {#if info.url}
      <StyleField label="Size" keys={['backgroundSize']}>
        <Seg
          options={SIZES}
          value={s.effective('backgroundSize')}
          inherited={!s.isSet('backgroundSize')}
          ariaLabel="Background size"
          onchange={(v) => s.set('backgroundSize', v)}
        />
      </StyleField>
      <StyleField label="Position" keys={['backgroundPosition']}>
        <PositionGrid
          value={s.effective('backgroundPosition')}
          inherited={!s.isSet('backgroundPosition')}
          ariaLabel="Background position"
          onchange={(v) => s.set('backgroundPosition', v)}
        />
      </StyleField>
      <StyleSelect prop="backgroundRepeat" label="Repeat" options={REPEAT} />
      <StyleField label="Attachment" keys={['backgroundAttachment']}>
        <Seg
          options={ATTACHMENT}
          value={s.effective('backgroundAttachment') || 'scroll'}
          inherited={!s.isSet('backgroundAttachment')}
          ariaLabel="Background attachment"
          onchange={(v) => s.set('backgroundAttachment', v)}
        />
      </StyleField>
      <Field label="Overlay">
        <ColorField value={info.overlay} ariaLabel="Overlay color" placeholder="None" {swatches} onchange={setOverlay} />
      </Field>
    {/if}
  {/if}
</PanelSection>
