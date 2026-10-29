/**
 * Regenerates `packages/components/src/svelte/lib/icons.ts` from the "regular" weight of the
 * installed phosphor-svelte package (MIT, https://phosphoricons.com).
 *
 *   pnpm exec tsx scripts/extract-phosphor-icons.ts
 *
 * The generated module is committed; generated sites never depend on phosphor-svelte.
 * Fails loudly when an icon is missing or its regular weight is not plain <path d> elements.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PHOSPHOR_LIB = path.join(ROOT, 'apps/studio/node_modules/phosphor-svelte/lib');
const OUT = path.join(ROOT, 'packages/components/src/svelte/lib/icons.ts');

/** Curated UI + marketing icon set (phosphor canonical names). */
const ICONS = [
  // UI
  'ArrowRight', 'ArrowSquareOut', 'Bell', 'CaretDown', 'CaretRight', 'Check', 'CheckCircle', 'Clock',
  'Calendar', 'ChatCircle', 'ChatCircleText', 'Envelope', 'EnvelopeSimple', 'Eye', 'Funnel', 'Gear',
  'Globe', 'House', 'Info', 'Key', 'Link', 'List', 'Lock', 'LockKey', 'MagnifyingGlass', 'MapPin',
  'Minus', 'Phone', 'Plus', 'Question', 'ShieldCheck', 'SlidersHorizontal', 'Star', 'Tag', 'User',
  'Users', 'Warning', 'WarningCircle', 'X', 'XCircle', 'Heart', 'ThumbsUp', 'Flag', 'DownloadSimple',
  'UploadSimple', 'ShareNetwork', 'Quotes',
  // Product & marketing
  'Atom', 'Brain', 'BookOpen', 'Browser', 'Buildings', 'ChartBar', 'ChartLine', 'ChartPie', 'Cloud',
  'Code', 'Cpu', 'CreditCard', 'Crown', 'Cube', 'CurrencyDollar', 'Database', 'Desktop', 'DeviceMobile',
  'Diamond', 'FileText', 'Fingerprint', 'Fire', 'GitBranch', 'Handshake', 'Image', 'Infinity', 'Kanban',
  'Layout', 'Leaf', 'Lightbulb', 'Lightning', 'Megaphone', 'Package', 'Palette', 'PaperPlaneTilt', 'Play',
  'Plug', 'Pulse', 'Robot', 'Rocket', 'ShoppingCart', 'Sparkle', 'SquaresFour', 'Stack', 'Storefront',
  'Table', 'Target', 'Terminal', 'Timer', 'TrendDown', 'TrendUp', 'Trophy', 'Wrench', 'ArrowsClockwise',
  // Wave 2 requests: solid shapes and app glyphs
  'StarFill', 'HeartFill', 'CheckCircleFill', 'CircleFill', 'DotsSixVertical', 'Checks', 'CaretDoubleLeft', 'CaretDoubleRight', 'SignOut', 'Cookie',
  // Extended set (wave 2)
  'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowUpRight', 'ArrowCircleRight', 'CaretLeft', 'CaretUp', 'CaretDoubleRight', 'DotsThree', 'DotsThreeVertical',
  'Copy', 'Trash', 'PencilSimple', 'FloppyDisk', 'Paperclip', 'PushPin', 'Bookmark', 'BookmarkSimple', 'Archive', 'Tray',
  'Folder', 'FolderOpen', 'Files', 'File', 'FilePdf', 'Note', 'Notepad', 'Clipboard', 'ClipboardText', 'ListBullets',
  'ListChecks', 'ListNumbers', 'CheckSquare', 'Circle', 'CircleNotch', 'Square', 'Triangle', 'Hexagon', 'Spinner', 'SpinnerGap',
  'Hourglass', 'CalendarBlank', 'CalendarCheck', 'Sun', 'Moon', 'CloudSun', 'Snowflake', 'Drop', 'Wind', 'Mountains',
  'Tree', 'Plant', 'Flower', 'Butterfly', 'Dog', 'Cat', 'PawPrint', 'Coffee', 'ForkKnife', 'Hamburger',
  'Pizza', 'Wine', 'Cake', 'Bicycle', 'Car', 'Airplane', 'AirplaneTilt', 'Train', 'Bus', 'Boat',
  'Anchor', 'Compass', 'MapTrifold', 'NavigationArrow', 'Path', 'Signpost', 'Ticket', 'Suitcase', 'Bed', 'Barbell',
  'Heartbeat', 'FirstAid', 'Pill', 'Stethoscope', 'Tooth', 'Baby', 'Camera', 'VideoCamera', 'FilmStrip', 'MonitorPlay',
  'Microphone', 'Headphones', 'SpeakerHigh', 'MusicNote', 'PlayCircle', 'Pause', 'Stop', 'Record', 'Images', 'ImageSquare',
  'Aperture', 'PaintBrush', 'PenNib', 'Ruler', 'Scissors', 'MagicWand', 'Shapes', 'Swatches', 'Eyedropper', 'ChatsCircle',
  'ChatCenteredText', 'Chats', 'MegaphoneSimple', 'Broadcast', 'Rss', 'Translate', 'At', 'Hash', 'PhoneCall', 'Voicemail',
  'EnvelopeOpen', 'PaperPlaneRight', 'Bank', 'Wallet', 'Coins', 'CurrencyEur', 'CurrencyGbp', 'Receipt', 'Invoice', 'Calculator',
  'Percent', 'SealPercent', 'ShoppingBag', 'ShoppingBagOpen', 'Basket', 'Barcode', 'QrCode', 'Truck', 'Gift', 'Medal',
  'Seal', 'SealCheck', 'Certificate', 'GraduationCap', 'Student', 'Chalkboard', 'ChalkboardTeacher', 'Books', 'Book', 'Newspaper',
  'Article', 'UserCircle', 'UserPlus', 'UserFocus', 'UsersThree', 'IdentificationCard', 'IdentificationBadge', 'AddressBook', 'Briefcase', 'Building',
  'Factory', 'HouseLine', 'Door', 'Password', 'ShieldCheckered', 'ShieldWarning', 'LockOpen', 'Bug', 'Detective', 'Scales',
  'Gavel', 'HardDrives', 'CloudArrowUp', 'CloudCheck', 'WifiHigh', 'Bluetooth', 'Circuitry', 'Laptop', 'DeviceTablet', 'Watch',
  'GameController', 'Keyboard', 'Mouse', 'Printer', 'Monitor', 'GitMerge', 'GitPullRequest', 'GithubLogo', 'GitlabLogo', 'FigmaLogo',
  'SlackLogo', 'DiscordLogo', 'LinkedinLogo', 'XLogo', 'TwitterLogo', 'FacebookLogo', 'InstagramLogo', 'YoutubeLogo', 'TiktokLogo', 'DribbbleLogo',
  'BehanceLogo', 'MediumLogo', 'RedditLogo', 'PinterestLogo', 'WhatsappLogo', 'TelegramLogo', 'ThreadsLogo', 'TwitchLogo', 'SpotifyLogo', 'AppleLogo',
  'AndroidLogo', 'GoogleLogo', 'WindowsLogo', 'StripeLogo', 'PaypalLogo', 'Gauge', 'Speedometer', 'ChartLineUp', 'ChartDonut', 'ChartScatter',
  'PresentationChart', 'Presentation', 'Strategy', 'Graph', 'Function', 'MathOperations', 'Flask', 'TestTube', 'Planet', 'RocketLaunch',
  'LightbulbFilament', 'Confetti', 'Smiley', 'SmileySad', 'HandWaving', 'HandPointing', 'HandHeart', 'HandsClapping', 'ThumbsDown', 'StarHalf',
  'Faders', 'Sliders', 'ToggleLeft', 'ToggleRight', 'Power', 'Plugs', 'PlugsConnected', 'BatteryFull', 'Recycle', 'GlobeHemisphereWest',
  'Command', 'TerminalWindow', 'CodeBlock', 'BracketsCurly', 'BracketsAngle', 'FlowArrow', 'TreeStructure', 'Columns', 'Rows', 'GridFour',
  'Sidebar', 'SidebarSimple', 'Browsers', 'AppWindow', 'Cursor', 'CursorClick', 'EyeSlash', 'ScanSmiley', 'Lifebuoy', 'WarningOctagon',
  'Prohibit', 'BellRinging', 'ClockCountdown', 'ArrowsOut', 'ArrowsIn', 'ArrowsLeftRight', 'ArrowsDownUp', 'MagnifyingGlassPlus', 'SortAscending'
];

/** Lucide-style / legacy names used in existing blueprints → phosphor canonical name. */
const ALIASES: Record<string, string> = {
  MicrosoftLogo: 'WindowsLogo',
  GripVertical: 'DotsSixVertical',
  LogOut: 'SignOut',
  CheckCheck: 'Checks',
  Activity: 'Pulse',
  AlertCircle: 'WarningCircle',
  AlertTriangle: 'Warning',
  Award: 'Trophy',
  BarChart: 'ChartBar',
  BarChart2: 'ChartBar',
  BarChart3: 'ChartBar',
  Book: 'BookOpen',
  Bot: 'Robot',
  Box: 'Cube',
  Building: 'Buildings',
  CheckCircle2: 'CheckCircle',
  ChevronDown: 'CaretDown',
  ChevronRight: 'CaretRight',
  Code2: 'Code',
  DollarSign: 'CurrencyDollar',
  Download: 'DownloadSimple',
  ExternalLink: 'ArrowSquareOut',
  File: 'FileText',
  Filter: 'Funnel',
  Flame: 'Fire',
  Gem: 'Diamond',
  Grid: 'SquaresFour',
  HelpCircle: 'Question',
  Home: 'House',
  Layers: 'Stack',
  LayoutDashboard: 'SquaresFour',
  LayoutGrid: 'SquaresFour',
  LayoutTemplate: 'Layout',
  LineChart: 'ChartLine',
  Mail: 'EnvelopeSimple',
  Menu: 'List',
  MessageCircle: 'ChatCircle',
  MessageSquare: 'ChatCircleText',
  Monitor: 'Desktop',
  PieChart: 'ChartPie',
  Quote: 'Quotes',
  RefreshCw: 'ArrowsClockwise',
  Search: 'MagnifyingGlass',
  Send: 'PaperPlaneTilt',
  Server: 'Database',
  Settings: 'Gear',
  Share: 'ShareNetwork',
  Share2: 'ShareNetwork',
  Shield: 'ShieldCheck',
  Sliders: 'SlidersHorizontal',
  Smartphone: 'DeviceMobile',
  Sparkles: 'Sparkle',
  Store: 'Storefront',
  TrendingDown: 'TrendDown',
  TrendingUp: 'TrendUp',
  Upload: 'UploadSimple',
  Workflow: 'GitBranch',
  Zap: 'Lightning'
};

/** Emoji used as icon values in legacy blueprints (written as escapes so sources stay emoji-free). */
const EMOJI_ALIASES: Array<[number[], string]> = [
  [[0x26a1], 'Lightning'],
  [[0x1f6e1], 'ShieldCheck'],
  [[0x1f916], 'Robot'],
  [[0x1f680], 'Rocket'],
  [[0x2728], 'Sparkle'],
  [[0x1f4c8], 'TrendUp'],
  [[0x1f4ca], 'ChartBar'],
  [[0x1f4ac], 'ChatCircleText'],
  [[0x1f512], 'Lock'],
  [[0x2b50], 'Star'],
  [[0x2764], 'Heart'],
  [[0x1f4a1], 'Lightbulb'],
  [[0x1f3af], 'Target'],
  [[0x1f525], 'Fire'],
  [[0x1f48e], 'Diamond'],
  [[0x1f4e6], 'Package'],
  [[0x2699], 'Gear'],
  [[0x1f30d], 'Globe'],
  [[0x1f4e7], 'EnvelopeSimple'],
  [[0x1f9e0], 'Brain'],
  [[0x1f3a8], 'Palette'],
  [[0x1f4bb], 'Desktop'],
  [[0x1f4f1], 'DeviceMobile'],
  [[0x2705], 'CheckCircle'],
  [[0x1f50d], 'MagnifyingGlass']
];

/**
 * Names ending in `Fill` (e.g. `StarFill`) take the FILL weight of the base icon — used for solid
 * shapes such as rating stars. Everything else uses the regular weight.
 */
function extractRegularPaths(name: string): string[] {
  const fill = /Fill$/.test(name) && !fs.existsSync(path.join(PHOSPHOR_LIB, `${name}.svelte`));
  const base = fill ? name.slice(0, -'Fill'.length) : name;
  const weight = fill ? 'fill' : 'regular';
  const file = path.join(PHOSPHOR_LIB, `${base}.svelte`);
  if (!fs.existsSync(file)) throw new Error(`phosphor-svelte has no icon "${base}" (${file})`);
  const src = fs.readFileSync(file, 'utf8');
  const marker = `weight === "${weight}"}`;
  const start = src.indexOf(marker);
  const end = src.indexOf('{:else', start + marker.length);
  if (start < 0 || end < 0) throw new Error(`Cannot locate the ${weight} weight block in ${base}.svelte`);
  const block = src.slice(start + marker.length, end).trim();
  const paths = [...block.matchAll(/<path d="([^"]+)"\s*\/>/g)].map((m) => m[1]);
  const leftover = block.replace(/<path d="[^"]+"\s*\/>/g, '').trim();
  if (paths.length === 0 || leftover) {
    throw new Error(`${weight} weight of ${base} is not plain <path d> elements: ${leftover.slice(0, 80)}`);
  }
  for (const d of paths) {
    if (!/^[MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]+$/.test(d)) throw new Error(`Unexpected characters in ${name} path data`);
  }
  return paths;
}

function main() {
  const unique = [...new Set(ICONS)].sort();
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (!unique.includes(target)) throw new Error(`Alias ${alias} → ${target} targets an icon that is not extracted`);
  }
  const entries = unique.map((name) => `  ${name}: ${JSON.stringify(extractRegularPaths(name))}`);
  const emoji = EMOJI_ALIASES.map(([cps, target]) => {
    if (!unique.includes(target)) throw new Error(`Emoji alias → ${target} targets an icon that is not extracted`);
    const escaped = cps.map((cp) => `\\u{${cp.toString(16).toUpperCase()}}`).join('');
    return `  ['${escaped}', '${target}']`;
  });

  const out = `/**
 * Inline SVG icon set for generated sites and the canvas (no runtime icon dependency).
 *
 * GENERATED by scripts/extract-phosphor-icons.ts from phosphor-svelte 3.1.1, "regular" weight.
 * Phosphor Icons — MIT License, Copyright (c) 2020 Phosphor Icons (https://phosphoricons.com).
 *
 * Each icon is a list of path \`d\` strings on a 256×256 viewBox, filled with currentColor.
 */

export const ICON_VIEWBOX = '0 0 256 256';

export const ICON_PATHS: Record<string, readonly string[]> = {
${entries.join(',\n')}
};

/** Lucide-style and legacy names that existing blueprints use, mapped onto ICON_PATHS keys. */
export const ICON_ALIASES: Record<string, string> = ${JSON.stringify(ALIASES, null, 2)};

const EMOJI_ALIASES: ReadonlyArray<readonly [string, string]> = [
${emoji.join(',\n')}
];

/** Fallback used when a name cannot be resolved. */
export const FALLBACK_ICON = 'Sparkle';

const LOOKUP: Map<string, string> = new Map();
for (const name of Object.keys(ICON_PATHS)) LOOKUP.set(normalize(name), name);
for (const [alias, target] of Object.entries(ICON_ALIASES)) LOOKUP.set(normalize(alias), target);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Resolves an icon name (canonical, alias, kebab/snake case or legacy emoji) to an ICON_PATHS key, or null. */
export function resolveIconName(name: string | null | undefined): string | null {
  const raw = String(name ?? '').trim();
  if (!raw) return null;
  if (raw in ICON_PATHS) return raw;
  const stripped = raw.replace(/\\u{FE0F}/gu, '');
  for (const [emoji, target] of EMOJI_ALIASES) {
    if (stripped === emoji) return target;
  }
  return LOOKUP.get(normalize(raw)) ?? null;
}

/** Path data for a name; unknown names resolve to {@link FALLBACK_ICON}. */
export function iconPaths(name: string | null | undefined): readonly string[] {
  return ICON_PATHS[resolveIconName(name) ?? FALLBACK_ICON] ?? ICON_PATHS[FALLBACK_ICON];
}
`;
  fs.writeFileSync(OUT, out);
  console.log(`Wrote ${unique.length} icons + ${Object.keys(ALIASES).length} aliases to ${path.relative(ROOT, OUT)}`);
}

main();
