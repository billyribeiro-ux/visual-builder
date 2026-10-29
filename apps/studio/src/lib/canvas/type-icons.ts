/**
 * Phosphor icons (deep imports — never the barrel) for component types on the canvas chrome,
 * keyed by `manifest.icon`. Site output never uses phosphor; it renders inline SVG via Icon.svelte.
 */
import { getManifest } from '@app-viz/components';
import BoundingBoxIcon from 'phosphor-svelte/lib/BoundingBoxIcon';
import LayoutIcon from 'phosphor-svelte/lib/LayoutIcon';
import GridFourIcon from 'phosphor-svelte/lib/GridFourIcon';
import CurrencyDollarIcon from 'phosphor-svelte/lib/CurrencyDollarIcon';
import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
import ChatCircleTextIcon from 'phosphor-svelte/lib/ChatCircleTextIcon';
import CompassIcon from 'phosphor-svelte/lib/CompassIcon';
import SquareHalfBottomIcon from 'phosphor-svelte/lib/SquareHalfBottomIcon';
import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
import SidebarSimpleIcon from 'phosphor-svelte/lib/SidebarSimpleIcon';
import TrendUpIcon from 'phosphor-svelte/lib/TrendUpIcon';
import TableIcon from 'phosphor-svelte/lib/TableIcon';
import SlidersHorizontalIcon from 'phosphor-svelte/lib/SlidersHorizontalIcon';
import RowsIcon from 'phosphor-svelte/lib/RowsIcon';
import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
import MinusIcon from 'phosphor-svelte/lib/MinusIcon';
import MegaphoneIcon from 'phosphor-svelte/lib/MegaphoneIcon';
import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
import PaperPlaneTiltIcon from 'phosphor-svelte/lib/PaperPlaneTiltIcon';
import LockKeyIcon from 'phosphor-svelte/lib/LockKeyIcon';
import TagIcon from 'phosphor-svelte/lib/TagIcon';
import CardsIcon from 'phosphor-svelte/lib/CardsIcon';
import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
import TabsIcon from 'phosphor-svelte/lib/TabsIcon';
import CubeIcon from 'phosphor-svelte/lib/CubeIcon';

/** Every phosphor icon component shares this type. */
export type CanvasIcon = typeof CubeIcon;

const TYPE_ICONS: Record<string, CanvasIcon> = {
  BoundingBox: BoundingBoxIcon,
  Layout: LayoutIcon,
  GridFour: GridFourIcon,
  CurrencyDollar: CurrencyDollarIcon,
  Question: QuestionIcon,
  ChatCircleText: ChatCircleTextIcon,
  Compass: CompassIcon,
  SquareHalfBottom: SquareHalfBottomIcon,
  CursorClick: CursorClickIcon,
  SidebarSimple: SidebarSimpleIcon,
  TrendUp: TrendUpIcon,
  Table: TableIcon,
  SlidersHorizontal: SlidersHorizontalIcon,
  Rows: RowsIcon,
  SquaresFour: SquaresFourIcon,
  Minus: MinusIcon,
  Megaphone: MegaphoneIcon,
  ChartBar: ChartBarIcon,
  EnvelopeSimple: EnvelopeSimpleIcon,
  PaperPlaneTilt: PaperPlaneTiltIcon,
  LockKey: LockKeyIcon,
  Tag: TagIcon,
  Cards: CardsIcon,
  WarningCircle: WarningCircleIcon,
  Tabs: TabsIcon
};

/** Icon for a registry type; unknown types or unmapped icon names fall back to a cube. */
export function typeIconFor(componentType: string): CanvasIcon {
  const name = getManifest(componentType)?.icon;
  return (name && TYPE_ICONS[name]) || CubeIcon;
}
