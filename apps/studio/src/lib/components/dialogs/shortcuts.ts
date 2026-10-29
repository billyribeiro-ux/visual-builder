/**
 * Keyboard reference. Mirrors the real handlers in `routes/+page.svelte` (studio window) and
 * `routes/preview/+page.svelte` (the canvas iframe forwards the same keys to the studio).
 * Keys use Mac glyphs; each entry is a sequence of physical keys pressed together.
 */
export interface ShortcutItem {
  id: string;
  label: string;
  keys: string[];
  /** Optional second binding, e.g. ⌘Y for redo. */
  alt?: string[];
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    items: [
      { id: 'palette', label: 'Command palette', keys: ['⌘', 'K'] },
      { id: 'save', label: 'Save now', keys: ['⌘', 'S'] },
      { id: 'export', label: 'Export', keys: ['⌘', 'E'] },
      { id: 'navigator', label: 'Toggle navigator', keys: ['⌘', 'I'] },
      { id: 'shortcuts', label: 'Keyboard shortcuts', keys: ['?'] },
      { id: 'escape', label: 'Close dialog, exit preview, clear selection', keys: ['Esc'] }
    ]
  },
  {
    title: 'Panels',
    items: [
      { id: 'panel-elements', label: 'Elements', keys: ['A'] },
      { id: 'panel-layers', label: 'Layers', keys: ['L'] },
      { id: 'panel-pages', label: 'Pages', keys: ['G'] },
      { id: 'panel-assets', label: 'Assets', keys: ['M'] },
      { id: 'panel-styles', label: 'Global styles', keys: ['S'] },
      { id: 'preview', label: 'Toggle preview', keys: ['P'] }
    ]
  },
  {
    title: 'View',
    items: [
      { id: 'zoom-in', label: 'Zoom in', keys: ['⌘', '+'] },
      { id: 'zoom-out', label: 'Zoom out', keys: ['⌘', '−'] },
      { id: 'zoom-fit', label: 'Zoom to fit', keys: ['⇧', '1'] },
      { id: 'zoom-100', label: 'Zoom to 100%', keys: ['⇧', '0'] }
    ]
  },
  {
    title: 'History',
    items: [
      { id: 'undo', label: 'Undo', keys: ['⌘', 'Z'] },
      { id: 'redo', label: 'Redo', keys: ['⇧', '⌘', 'Z'], alt: ['⌘', 'Y'] }
    ]
  },
  {
    title: 'Elements',
    items: [
      { id: 'duplicate', label: 'Duplicate', keys: ['⌘', 'D'] },
      { id: 'copy', label: 'Copy element', keys: ['⌘', 'C'] },
      { id: 'paste', label: 'Paste element', keys: ['⌘', 'V'] },
      { id: 'copy-style', label: 'Copy style', keys: ['⇧', '⌘', 'C'] },
      { id: 'paste-style', label: 'Paste style', keys: ['⇧', '⌘', 'V'] },
      { id: 'delete', label: 'Delete', keys: ['⌫'] },
      { id: 'move-up', label: 'Move up', keys: ['⌥', '↑'] },
      { id: 'move-down', label: 'Move down', keys: ['⌥', '↓'] }
    ]
  },
  {
    title: 'Canvas',
    items: [
      { id: 'select', label: 'Select element', keys: ['Click'] },
      { id: 'edit-text', label: 'Edit text inline', keys: ['Double-click'] }
    ]
  }
];

/** Compact glyph string for hints, e.g. ['⇧','⌘','Z'] -> "⇧⌘Z". */
export function shortcutText(id: string): string | undefined {
  for (const group of SHORTCUT_GROUPS) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.keys.join('');
  }
  return undefined;
}

export function shortcutKeys(id: string): string[] | undefined {
  for (const group of SHORTCUT_GROUPS) {
    const item = group.items.find((i) => i.id === id);
    if (item) return item.keys;
  }
  return undefined;
}
