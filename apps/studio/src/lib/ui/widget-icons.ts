/**
 * Explicit phosphor icon map for widget tiles, layers and manifest `icon` names.
 * Deep imports keep Vite dev fast (the phosphor barrel re-exports ~3000 icons).
 * Only icons that exist in phosphor-svelte 3.1.1 are listed.
 */
import type { Component } from 'svelte';
import RowsIcon from 'phosphor-svelte/lib/RowsIcon';
import ColumnsIcon from 'phosphor-svelte/lib/ColumnsIcon';
import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
import SquareIcon from 'phosphor-svelte/lib/SquareIcon';
import SquareHalfIcon from 'phosphor-svelte/lib/SquareHalfIcon';
import GridFourIcon from 'phosphor-svelte/lib/GridFourIcon';
import LayoutIcon from 'phosphor-svelte/lib/LayoutIcon';
import TextHOneIcon from 'phosphor-svelte/lib/TextHOneIcon';
import TextHTwoIcon from 'phosphor-svelte/lib/TextHTwoIcon';
import TextTIcon from 'phosphor-svelte/lib/TextTIcon';
import TextAaIcon from 'phosphor-svelte/lib/TextAaIcon';
import ParagraphIcon from 'phosphor-svelte/lib/ParagraphIcon';
import ArticleIcon from 'phosphor-svelte/lib/ArticleIcon';
import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
import ImagesIcon from 'phosphor-svelte/lib/ImagesIcon';
import ImageSquareIcon from 'phosphor-svelte/lib/ImageSquareIcon';
import VideoCameraIcon from 'phosphor-svelte/lib/VideoCameraIcon';
import YoutubeLogoIcon from 'phosphor-svelte/lib/YoutubeLogoIcon';
import PlayCircleIcon from 'phosphor-svelte/lib/PlayCircleIcon';
import StarIcon from 'phosphor-svelte/lib/StarIcon';
import StarHalfIcon from 'phosphor-svelte/lib/StarHalfIcon';
import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUpIcon';
import ChartPieIcon from 'phosphor-svelte/lib/ChartPieIcon';
import GaugeIcon from 'phosphor-svelte/lib/GaugeIcon';
import TimerIcon from 'phosphor-svelte/lib/TimerIcon';
import ClockIcon from 'phosphor-svelte/lib/ClockIcon';
import HourglassIcon from 'phosphor-svelte/lib/HourglassIcon';
import QuotesIcon from 'phosphor-svelte/lib/QuotesIcon';
import ChatCircleTextIcon from 'phosphor-svelte/lib/ChatCircleTextIcon';
import ChatsCircleIcon from 'phosphor-svelte/lib/ChatsCircleIcon';
import ChatCenteredTextIcon from 'phosphor-svelte/lib/ChatCenteredTextIcon';
import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
import CurrencyDollarIcon from 'phosphor-svelte/lib/CurrencyDollarIcon';
import CreditCardIcon from 'phosphor-svelte/lib/CreditCardIcon';
import TagIcon from 'phosphor-svelte/lib/TagIcon';
import MegaphoneIcon from 'phosphor-svelte/lib/MegaphoneIcon';
import EnvelopeSimpleIcon from 'phosphor-svelte/lib/EnvelopeSimpleIcon';
import EnvelopeIcon from 'phosphor-svelte/lib/EnvelopeIcon';
import PhoneCallIcon from 'phosphor-svelte/lib/PhoneCallIcon';
import MapPinIcon from 'phosphor-svelte/lib/MapPinIcon';
import MapTrifoldIcon from 'phosphor-svelte/lib/MapTrifoldIcon';
import CompassIcon from 'phosphor-svelte/lib/CompassIcon';
import ListIcon from 'phosphor-svelte/lib/ListIcon';
import ListBulletsIcon from 'phosphor-svelte/lib/ListBulletsIcon';
import ListChecksIcon from 'phosphor-svelte/lib/ListChecksIcon';
import ListNumbersIcon from 'phosphor-svelte/lib/ListNumbersIcon';
import ListDashesIcon from 'phosphor-svelte/lib/ListDashesIcon';
import NavigationArrowIcon from 'phosphor-svelte/lib/NavigationArrowIcon';
import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';
import AppWindowIcon from 'phosphor-svelte/lib/AppWindowIcon';
import SidebarSimpleIcon from 'phosphor-svelte/lib/SidebarSimpleIcon';
import TableIcon from 'phosphor-svelte/lib/TableIcon';
import GearIcon from 'phosphor-svelte/lib/GearIcon';
import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
import LockKeyIcon from 'phosphor-svelte/lib/LockKeyIcon';
import SignInIcon from 'phosphor-svelte/lib/SignInIcon';
import UserCircleIcon from 'phosphor-svelte/lib/UserCircleIcon';
import UsersIcon from 'phosphor-svelte/lib/UsersIcon';
import UsersThreeIcon from 'phosphor-svelte/lib/UsersThreeIcon';
import IdentificationCardIcon from 'phosphor-svelte/lib/IdentificationCardIcon';
import CursorIcon from 'phosphor-svelte/lib/CursorIcon';
import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
import LinkIcon from 'phosphor-svelte/lib/LinkIcon';
import LinkSimpleIcon from 'phosphor-svelte/lib/LinkSimpleIcon';
import ShareNetworkIcon from 'phosphor-svelte/lib/ShareNetworkIcon';
import HeartIcon from 'phosphor-svelte/lib/HeartIcon';
import ThumbsUpIcon from 'phosphor-svelte/lib/ThumbsUpIcon';
import BellIcon from 'phosphor-svelte/lib/BellIcon';
import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
import RocketIcon from 'phosphor-svelte/lib/RocketIcon';
import TrophyIcon from 'phosphor-svelte/lib/TrophyIcon';
import MedalIcon from 'phosphor-svelte/lib/MedalIcon';
import SealCheckIcon from 'phosphor-svelte/lib/SealCheckIcon';
import CardsIcon from 'phosphor-svelte/lib/CardsIcon';
import StackIcon from 'phosphor-svelte/lib/StackIcon';
import KanbanIcon from 'phosphor-svelte/lib/KanbanIcon';
import CalendarIcon from 'phosphor-svelte/lib/CalendarIcon';
import CalendarBlankIcon from 'phosphor-svelte/lib/CalendarBlankIcon';
import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
import CodeBlockIcon from 'phosphor-svelte/lib/CodeBlockIcon';
import MinusIcon from 'phosphor-svelte/lib/MinusIcon';
import ArrowsVerticalIcon from 'phosphor-svelte/lib/ArrowsVerticalIcon';
import ArrowsOutLineVerticalIcon from 'phosphor-svelte/lib/ArrowsOutLineVerticalIcon';
import SpinnerGapIcon from 'phosphor-svelte/lib/SpinnerGapIcon';
import FunnelIcon from 'phosphor-svelte/lib/FunnelIcon';
import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
import TabsIcon from 'phosphor-svelte/lib/TabsIcon';
import CaretCircleDownIcon from 'phosphor-svelte/lib/CaretCircleDownIcon';
import ToggleLeftIcon from 'phosphor-svelte/lib/ToggleLeftIcon';
import SlidersHorizontalIcon from 'phosphor-svelte/lib/SlidersHorizontalIcon';
import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrowIcon';
import PathIcon from 'phosphor-svelte/lib/PathIcon';
import BuildingsIcon from 'phosphor-svelte/lib/BuildingsIcon';
import BriefcaseIcon from 'phosphor-svelte/lib/BriefcaseIcon';
import GlobeIcon from 'phosphor-svelte/lib/GlobeIcon';
import PaletteIcon from 'phosphor-svelte/lib/PaletteIcon';
import LightbulbIcon from 'phosphor-svelte/lib/LightbulbIcon';
import TargetIcon from 'phosphor-svelte/lib/TargetIcon';
import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
import CubeIcon from 'phosphor-svelte/lib/CubeIcon';
import PackageIcon from 'phosphor-svelte/lib/PackageIcon';
import ShoppingCartIcon from 'phosphor-svelte/lib/ShoppingCartIcon';
import ShoppingBagIcon from 'phosphor-svelte/lib/ShoppingBagIcon';
import StorefrontIcon from 'phosphor-svelte/lib/StorefrontIcon';
import ReceiptIcon from 'phosphor-svelte/lib/ReceiptIcon';
import WalletIcon from 'phosphor-svelte/lib/WalletIcon';
import TrendUpIcon from 'phosphor-svelte/lib/TrendUpIcon';
import PresentationIcon from 'phosphor-svelte/lib/PresentationIcon';
import NewspaperIcon from 'phosphor-svelte/lib/NewspaperIcon';
import BookOpenIcon from 'phosphor-svelte/lib/BookOpenIcon';
import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
import CloudIcon from 'phosphor-svelte/lib/CloudIcon';
import DatabaseIcon from 'phosphor-svelte/lib/DatabaseIcon';
import PlugIcon from 'phosphor-svelte/lib/PlugIcon';
import PuzzlePieceIcon from 'phosphor-svelte/lib/PuzzlePieceIcon';
import RobotIcon from 'phosphor-svelte/lib/RobotIcon';
import BrainIcon from 'phosphor-svelte/lib/BrainIcon';
import CommandIcon from 'phosphor-svelte/lib/CommandIcon';
import HashIcon from 'phosphor-svelte/lib/HashIcon';
import AtIcon from 'phosphor-svelte/lib/AtIcon';
import FlagIcon from 'phosphor-svelte/lib/FlagIcon';
import GiftIcon from 'phosphor-svelte/lib/GiftIcon';
import HandWavingIcon from 'phosphor-svelte/lib/HandWavingIcon';
import HandshakeIcon from 'phosphor-svelte/lib/HandshakeIcon';
import HouseIcon from 'phosphor-svelte/lib/HouseIcon';
import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
import BuildingIcon from 'phosphor-svelte/lib/BuildingIcon';
import LifebuoyIcon from 'phosphor-svelte/lib/LifebuoyIcon';
import WrenchIcon from 'phosphor-svelte/lib/WrenchIcon';
import TicketIcon from 'phosphor-svelte/lib/TicketIcon';
import FootprintsIcon from 'phosphor-svelte/lib/FootprintsIcon';
import FrameCornersIcon from 'phosphor-svelte/lib/FrameCornersIcon';
import BoundingBoxIcon from 'phosphor-svelte/lib/BoundingBoxIcon';
import SelectionIcon from 'phosphor-svelte/lib/SelectionIcon';
import SelectionAllIcon from 'phosphor-svelte/lib/SelectionAllIcon';
import CopyrightIcon from 'phosphor-svelte/lib/CopyrightIcon';
import SmileyIcon from 'phosphor-svelte/lib/SmileyIcon';
import CirclesFourIcon from 'phosphor-svelte/lib/CirclesFourIcon';
import CircleIcon from 'phosphor-svelte/lib/CircleIcon';
import DiamondIcon from 'phosphor-svelte/lib/DiamondIcon';
import ShapesIcon from 'phosphor-svelte/lib/ShapesIcon';
import SquareSplitHorizontalIcon from 'phosphor-svelte/lib/SquareSplitHorizontalIcon';
import SquareSplitVerticalIcon from 'phosphor-svelte/lib/SquareSplitVerticalIcon';
import TextColumnsIcon from 'phosphor-svelte/lib/TextColumnsIcon';
import TextAlignLeftIcon from 'phosphor-svelte/lib/TextAlignLeftIcon';
import MegaphoneSimpleIcon from 'phosphor-svelte/lib/MegaphoneSimpleIcon';
import CrownIcon from 'phosphor-svelte/lib/CrownIcon';
import SealIcon from 'phosphor-svelte/lib/SealIcon';
import InfinityIcon from 'phosphor-svelte/lib/InfinityIcon';
import HandPointingIcon from 'phosphor-svelte/lib/HandPointingIcon';
import ClipboardIcon from 'phosphor-svelte/lib/ClipboardIcon';
import ClipboardTextIcon from 'phosphor-svelte/lib/ClipboardTextIcon';
import NoteIcon from 'phosphor-svelte/lib/NoteIcon';
import NotepadIcon from 'phosphor-svelte/lib/NotepadIcon';
import CaretDoubleDownIcon from 'phosphor-svelte/lib/CaretDoubleDownIcon';
import ArrowSquareOutIcon from 'phosphor-svelte/lib/ArrowSquareOutIcon';
import FadersIcon from 'phosphor-svelte/lib/FadersIcon';
import EqualsIcon from 'phosphor-svelte/lib/EqualsIcon';
import DotsNineIcon from 'phosphor-svelte/lib/DotsNineIcon';
import BezierCurveIcon from 'phosphor-svelte/lib/BezierCurveIcon';
import PenNibIcon from 'phosphor-svelte/lib/PenNibIcon';
import SealPercentIcon from 'phosphor-svelte/lib/SealPercentIcon';
import PercentIcon from 'phosphor-svelte/lib/PercentIcon';
import NumberCircleOneIcon from 'phosphor-svelte/lib/NumberCircleOneIcon';
import StrategyIcon from 'phosphor-svelte/lib/StrategyIcon';
import FileTextIcon from 'phosphor-svelte/lib/FileTextIcon';
import FilePdfIcon from 'phosphor-svelte/lib/FilePdfIcon';
import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
import UploadSimpleIcon from 'phosphor-svelte/lib/UploadSimpleIcon';
import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
import VideoConferenceIcon from 'phosphor-svelte/lib/VideoConferenceIcon';
import MonitorPlayIcon from 'phosphor-svelte/lib/MonitorPlayIcon';
import MicrophoneIcon from 'phosphor-svelte/lib/MicrophoneIcon';
import HeadphonesIcon from 'phosphor-svelte/lib/HeadphonesIcon';
import KeyboardIcon from 'phosphor-svelte/lib/KeyboardIcon';
import SlideshowIcon from 'phosphor-svelte/lib/SlideshowIcon';
import ImagesSquareIcon from 'phosphor-svelte/lib/ImagesSquareIcon';
import GridNineIcon from 'phosphor-svelte/lib/GridNineIcon';
import SidebarIcon from 'phosphor-svelte/lib/SidebarIcon';
import RectangleIcon from 'phosphor-svelte/lib/RectangleIcon';
import RectangleDashedIcon from 'phosphor-svelte/lib/RectangleDashedIcon';
import ArrowsDownUpIcon from 'phosphor-svelte/lib/ArrowsDownUpIcon';
import DivideIcon from 'phosphor-svelte/lib/DivideIcon';
import SwatchesIcon from 'phosphor-svelte/lib/SwatchesIcon';
import ChartLineIcon from 'phosphor-svelte/lib/ChartLineIcon';
import CalculatorIcon from 'phosphor-svelte/lib/CalculatorIcon';
import MapPinLineIcon from 'phosphor-svelte/lib/MapPinLineIcon';
import PhoneIcon from 'phosphor-svelte/lib/PhoneIcon';
import TrayIcon from 'phosphor-svelte/lib/TrayIcon';
import ArticleNyTimesIcon from 'phosphor-svelte/lib/ArticleNyTimesIcon';
import SquareHalfBottomIcon from 'phosphor-svelte/lib/SquareHalfBottomIcon';
import PaperPlaneTiltIcon from 'phosphor-svelte/lib/PaperPlaneTiltIcon';
import PresentationChartIcon from 'phosphor-svelte/lib/PresentationChartIcon';
import ChartDonutIcon from 'phosphor-svelte/lib/ChartDonutIcon';
import PulseIcon from 'phosphor-svelte/lib/PulseIcon';
import BrowsersIcon from 'phosphor-svelte/lib/BrowsersIcon';
import NumberSquareNineIcon from 'phosphor-svelte/lib/NumberSquareNineIcon';
import ChartBarHorizontalIcon from 'phosphor-svelte/lib/ChartBarHorizontalIcon';
import ClockCountdownIcon from 'phosphor-svelte/lib/ClockCountdownIcon';
import CursorTextIcon from 'phosphor-svelte/lib/CursorTextIcon';
import CaretDoubleRightIcon from 'phosphor-svelte/lib/CaretDoubleRightIcon';
import ToggleRightIcon from 'phosphor-svelte/lib/ToggleRightIcon';
import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
import CardsThreeIcon from 'phosphor-svelte/lib/CardsThreeIcon';
import ArrowsHorizontalIcon from 'phosphor-svelte/lib/ArrowsHorizontalIcon';
import SealQuestionIcon from 'phosphor-svelte/lib/SealQuestionIcon';
import TextboxIcon from 'phosphor-svelte/lib/TextboxIcon';
import TextAlignCenterIcon from 'phosphor-svelte/lib/TextAlignCenterIcon';
import CookieIcon from 'phosphor-svelte/lib/CookieIcon';

export type WidgetIcon = Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;

export const WIDGET_ICONS: Record<string, WidgetIcon> = {
  Cookie: CookieIcon,
  TextAlignCenter: TextAlignCenterIcon,
  Textbox: TextboxIcon,
  SealQuestion: SealQuestionIcon,
  ArrowsHorizontal: ArrowsHorizontalIcon,
  CardsThree: CardsThreeIcon,
  ClockCounterClockwise: ClockCounterClockwiseIcon,
  ToggleRight: ToggleRightIcon,
  CaretDoubleRight: CaretDoubleRightIcon,
  CursorText: CursorTextIcon,
  ClockCountdown: ClockCountdownIcon,
  ChartBarHorizontal: ChartBarHorizontalIcon,
  NumberSquareNine: NumberSquareNineIcon,
  Browsers: BrowsersIcon,
  Pulse: PulseIcon,
  ChartDonut: ChartDonutIcon,
  PresentationChart: PresentationChartIcon,
  PaperPlaneTilt: PaperPlaneTiltIcon,
  SquareHalfBottom: SquareHalfBottomIcon,
  Rows: RowsIcon,
  Columns: ColumnsIcon,
  SquaresFour: SquaresFourIcon,
  Square: SquareIcon,
  SquareHalf: SquareHalfIcon,
  GridFour: GridFourIcon,
  Layout: LayoutIcon,
  TextHOne: TextHOneIcon,
  TextHTwo: TextHTwoIcon,
  TextT: TextTIcon,
  TextAa: TextAaIcon,
  Paragraph: ParagraphIcon,
  Article: ArticleIcon,
  Image: ImageIcon,
  Images: ImagesIcon,
  ImageSquare: ImageSquareIcon,
  VideoCamera: VideoCameraIcon,
  YoutubeLogo: YoutubeLogoIcon,
  PlayCircle: PlayCircleIcon,
  Star: StarIcon,
  StarHalf: StarHalfIcon,
  ChartBar: ChartBarIcon,
  ChartLineUp: ChartLineUpIcon,
  ChartPie: ChartPieIcon,
  Gauge: GaugeIcon,
  Timer: TimerIcon,
  Clock: ClockIcon,
  Hourglass: HourglassIcon,
  Quotes: QuotesIcon,
  ChatCircleText: ChatCircleTextIcon,
  ChatsCircle: ChatsCircleIcon,
  ChatCenteredText: ChatCenteredTextIcon,
  Question: QuestionIcon,
  CurrencyDollar: CurrencyDollarIcon,
  CreditCard: CreditCardIcon,
  Tag: TagIcon,
  Megaphone: MegaphoneIcon,
  EnvelopeSimple: EnvelopeSimpleIcon,
  Envelope: EnvelopeIcon,
  PhoneCall: PhoneCallIcon,
  MapPin: MapPinIcon,
  MapTrifold: MapTrifoldIcon,
  Compass: CompassIcon,
  List: ListIcon,
  ListBullets: ListBulletsIcon,
  ListChecks: ListChecksIcon,
  ListNumbers: ListNumbersIcon,
  ListDashes: ListDashesIcon,
  NavigationArrow: NavigationArrowIcon,
  Browser: BrowserIcon,
  AppWindow: AppWindowIcon,
  SidebarSimple: SidebarSimpleIcon,
  Table: TableIcon,
  Gear: GearIcon,
  GearSix: GearSixIcon,
  LockKey: LockKeyIcon,
  SignIn: SignInIcon,
  UserCircle: UserCircleIcon,
  Users: UsersIcon,
  UsersThree: UsersThreeIcon,
  IdentificationCard: IdentificationCardIcon,
  Cursor: CursorIcon,
  CursorClick: CursorClickIcon,
  Link: LinkIcon,
  LinkSimple: LinkSimpleIcon,
  ShareNetwork: ShareNetworkIcon,
  Heart: HeartIcon,
  ThumbsUp: ThumbsUpIcon,
  Bell: BellIcon,
  Warning: WarningIcon,
  WarningCircle: WarningCircleIcon,
  Info: InfoIcon,
  CheckCircle: CheckCircleIcon,
  Lightning: LightningIcon,
  Sparkle: SparkleIcon,
  Rocket: RocketIcon,
  Trophy: TrophyIcon,
  Medal: MedalIcon,
  SealCheck: SealCheckIcon,
  Cards: CardsIcon,
  Stack: StackIcon,
  Kanban: KanbanIcon,
  Calendar: CalendarIcon,
  CalendarBlank: CalendarBlankIcon,
  Code: CodeIcon,
  CodeBlock: CodeBlockIcon,
  Minus: MinusIcon,
  ArrowsVertical: ArrowsVerticalIcon,
  ArrowsOutLineVertical: ArrowsOutLineVerticalIcon,
  SpinnerGap: SpinnerGapIcon,
  Funnel: FunnelIcon,
  MagnifyingGlass: MagnifyingGlassIcon,
  Tabs: TabsIcon,
  CaretCircleDown: CaretCircleDownIcon,
  ToggleLeft: ToggleLeftIcon,
  SlidersHorizontal: SlidersHorizontalIcon,
  FlowArrow: FlowArrowIcon,
  Path: PathIcon,
  Buildings: BuildingsIcon,
  Briefcase: BriefcaseIcon,
  Globe: GlobeIcon,
  Palette: PaletteIcon,
  Lightbulb: LightbulbIcon,
  Target: TargetIcon,
  ShieldCheck: ShieldCheckIcon,
  Cube: CubeIcon,
  Package: PackageIcon,
  ShoppingCart: ShoppingCartIcon,
  ShoppingBag: ShoppingBagIcon,
  Storefront: StorefrontIcon,
  Receipt: ReceiptIcon,
  Wallet: WalletIcon,
  TrendUp: TrendUpIcon,
  Presentation: PresentationIcon,
  Newspaper: NewspaperIcon,
  BookOpen: BookOpenIcon,
  Monitor: MonitorIcon,
  DeviceMobile: DeviceMobileIcon,
  Cloud: CloudIcon,
  Database: DatabaseIcon,
  Plug: PlugIcon,
  PuzzlePiece: PuzzlePieceIcon,
  Robot: RobotIcon,
  Brain: BrainIcon,
  Command: CommandIcon,
  Hash: HashIcon,
  At: AtIcon,
  Flag: FlagIcon,
  Gift: GiftIcon,
  HandWaving: HandWavingIcon,
  Handshake: HandshakeIcon,
  House: HouseIcon,
  HouseSimple: HouseSimpleIcon,
  Building: BuildingIcon,
  Lifebuoy: LifebuoyIcon,
  Wrench: WrenchIcon,
  Ticket: TicketIcon,
  Footprints: FootprintsIcon,
  FrameCorners: FrameCornersIcon,
  BoundingBox: BoundingBoxIcon,
  Selection: SelectionIcon,
  SelectionAll: SelectionAllIcon,
  Copyright: CopyrightIcon,
  Smiley: SmileyIcon,
  CirclesFour: CirclesFourIcon,
  Circle: CircleIcon,
  Diamond: DiamondIcon,
  Shapes: ShapesIcon,
  SquareSplitHorizontal: SquareSplitHorizontalIcon,
  SquareSplitVertical: SquareSplitVerticalIcon,
  TextColumns: TextColumnsIcon,
  TextAlignLeft: TextAlignLeftIcon,
  MegaphoneSimple: MegaphoneSimpleIcon,
  Crown: CrownIcon,
  Seal: SealIcon,
  Infinity: InfinityIcon,
  HandPointing: HandPointingIcon,
  Clipboard: ClipboardIcon,
  ClipboardText: ClipboardTextIcon,
  Note: NoteIcon,
  Notepad: NotepadIcon,
  CaretDoubleDown: CaretDoubleDownIcon,
  ArrowSquareOut: ArrowSquareOutIcon,
  Faders: FadersIcon,
  Equals: EqualsIcon,
  DotsNine: DotsNineIcon,
  BezierCurve: BezierCurveIcon,
  PenNib: PenNibIcon,
  SealPercent: SealPercentIcon,
  Percent: PercentIcon,
  NumberCircleOne: NumberCircleOneIcon,
  Strategy: StrategyIcon,
  FileText: FileTextIcon,
  FilePdf: FilePdfIcon,
  DownloadSimple: DownloadSimpleIcon,
  UploadSimple: UploadSimpleIcon,
  Play: PlayIcon,
  VideoConference: VideoConferenceIcon,
  MonitorPlay: MonitorPlayIcon,
  Microphone: MicrophoneIcon,
  Headphones: HeadphonesIcon,
  Keyboard: KeyboardIcon,
  Slideshow: SlideshowIcon,
  ImagesSquare: ImagesSquareIcon,
  GridNine: GridNineIcon,
  Sidebar: SidebarIcon,
  Rectangle: RectangleIcon,
  RectangleDashed: RectangleDashedIcon,
  ArrowsDownUp: ArrowsDownUpIcon,
  Divide: DivideIcon,
  Swatches: SwatchesIcon,
  ChartLine: ChartLineIcon,
  Calculator: CalculatorIcon,
  MapPinLine: MapPinLineIcon,
  Phone: PhoneIcon,
  Tray: TrayIcon,
  ArticleNyTimes: ArticleNyTimesIcon,
};
/** Legacy (Lucide-style) manifest icon names → phosphor names. */
const ALIASES: Record<string, string> = {
  Box: 'Square',
  LayoutTemplate: 'Layout',
  Grid: 'GridFour',
  HelpCircle: 'Question',
  MessageSquare: 'ChatCircleText',
  Navigation: 'Compass',
  PanelLeft: 'SidebarSimple',
  LayoutDashboard: 'Layout',
  BarChart: 'ChartBar',
  BarChart3: 'ChartBar',
  Settings: 'GearSix',
  Lock: 'LockKey',
  MousePointerClick: 'CursorClick',
  Tag: 'Tag',
  Bell: 'Bell',
  AlertTriangle: 'Warning',
  Folder: 'Tabs',
  Mail: 'EnvelopeSimple',
  Phone: 'PhoneCall',
  Megaphone: 'Megaphone',
  TrendingUp: 'TrendUp',
  Table: 'Table',
  Minus: 'Minus',
  Columns: 'Columns',
  Rows: 'Rows',
  Square: 'Square'
};

const CATEGORY_FALLBACK: Record<string, string> = {
  structure: 'Layout',
  navigation: 'Compass',
  hero: 'Rocket',
  marketing: 'Megaphone',
  ui: 'Cursor',
  app: 'AppWindow',
  media: 'Image',
  basic: 'TextT',
  forms: 'ListChecks',
  site: 'Browser'
};

/** Resolves a manifest icon name (phosphor or legacy) to a component, with a category fallback. */
export function resolveWidgetIcon(name: string | undefined, category?: string): WidgetIcon {
  const direct = name ? (WIDGET_ICONS[name] ?? WIDGET_ICONS[ALIASES[name] ?? '']) : undefined;
  if (direct) return direct;
  return WIDGET_ICONS[CATEGORY_FALLBACK[category ?? ''] ?? 'Square'] ?? WIDGET_ICONS.Square;
}
