<script lang="ts">
  import { getManifest } from '@app-viz/components';
  import { resolveWidgetIcon } from '../../ui/widget-icons.js';

  interface Props {
    componentType: string;
    size?: number;
  }

  let { componentType, size = 14 }: Props = $props();

  const manifest = $derived(getManifest(componentType));
  /** Same icon the widget library and layers panel show for this component type. */
  const Icon = $derived(resolveWidgetIcon(manifest?.icon, manifest?.category ?? componentType.split('/')[0]));
</script>

<Icon {size} />
