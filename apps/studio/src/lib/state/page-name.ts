import type { PageRoute } from '@app-viz/schema';

/**
 * Short, human page name for editor chrome. Page `title` is the document <title> (often long,
 * e.g. "Acme SaaS — Visual Development for AI Coding"), so the home route reads "Home" and other
 * titles are trimmed at the first " — ", " | " or " · " separator.
 */
export function pageDisplayName(page: Pick<PageRoute, 'path' | 'title' | 'slug'>): string {
  if (page.path === '/') return 'Home';
  const short = (page.title || '').split(/\s[—|·-]\s/)[0]?.trim();
  if (short) return short;
  const last = page.path.split('/').filter(Boolean).pop() ?? page.slug ?? page.path;
  return last.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
