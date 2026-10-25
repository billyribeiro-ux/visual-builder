# System Architecture & Technical Specifications

## 1. System Invariants

1. **Single Source of Truth**: The `ProjectBlueprint` (Zod validated JSON schema) is the sole authoritative definition of a project. Neither the studio DOM, nor transient UI state, nor generated files dictate project meaning.
2. **Preview-Export Parity**: The preview iframe uses the exact same component registry, prop schemas, and design token variable system as the exported SvelteKit 3 app.
3. **Deterministic Handoff**: Equivalent Blueprint objects generate byte-for-byte identical output packages, with normalized asset dates, alphabetized keys, and formatted TypeScript/Svelte source.
4. **Standalone Portability**: Generated projects have zero runtime dependencies on the builder backend, zero telemetry, and require only `pnpm install && pnpm build` to run locally or deploy to any static/Node host.

## 2. Threat Model & Security Policy

| Threat Vector | Severity | Mitigation Strategy |
|---|---|---|
| **Stored XSS via Component Props** | High | Svelte 5 auto-escapes all text expressions `<div>{text}</div>`. No raw `{@html}` is used for user input without DOMPurify sanitization. |
| **CSS Injection / Style Manipulation** | Medium | User styles in `ResponsiveStyle` are validated against strict allowed CSS properties and sanitized to disallow `javascript:`, `url(data:...)` or `expression()`. |
| **Iframe postMessage Spoofing** | High | Preview iframe verifies `event.origin` against `window.location.origin` and requires a shared session-token nonce passed during iframe initialization. |
| **Archive Path Traversal (Zip Slip)** | Critical | Code generator validates all file paths ensuring no `..` or leading `/` occurs. Normalized paths are strictly bounded inside `exported-project/`. |
| **SSRF via Asset Fetching** | High | Media uploads are handled directly via multipart forms; no arbitrary server-side URLs are crawled or fetched without host whitelisting. |
| **Arbitrary Code Execution via Blueprint** | Critical | Blueprint interaction graph is declarative (`open_modal`, `navigate`, `toggle_state`). No arbitrary JavaScript expressions or `eval()` are permitted in blueprints. |

## 3. Communication Bridge (Studio Shell <-> Preview Iframe)

Communication occurs strictly over `window.postMessage`:

```typescript
// Studio -> Preview
type StudioToPreviewMessage =
  | { type: 'STUDIO_INIT'; nonce: string; projectId: string }
  | { type: 'SYNC_BLUEPRINT'; blueprint: ProjectBlueprint; activePageId: string }
  | { type: 'SET_VIEWPORT'; width: number; height: number }
  | { type: 'SET_HOVER_NODE'; nodeId: string | null }
  | { type: 'SET_SELECTED_NODE'; nodeId: string | null };

// Preview -> Studio
type PreviewToStudioMessage =
  | { type: 'PREVIEW_READY'; nonce: string }
  | { type: 'NODE_RECTS_UPDATED'; rects: Record<string, DOMRect> }
  | { type: 'NODE_CLICKED'; nodeId: string; metaKey: boolean }
  | { type: 'NODE_HOVERED'; nodeId: string | null }
  | { type: 'ROUTE_CHANGED'; newPath: string };
```
