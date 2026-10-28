// The Studio is a local-first, client-only application: all project data lives in the
// browser (IndexedDB). Disabling SSR prevents hydration mismatches between the server's
// default project and the user's saved project, and keeps editor state out of the server.
export const ssr = false;
export const prerender = false;
