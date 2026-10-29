import type { ComponentManifest } from '@app-viz/schema';
import { CORE_MANIFESTS } from './manifests/core.js';
import { BASIC_MANIFESTS } from './manifests/basic.js';
import { MEDIA_MANIFESTS } from './manifests/media.js';
import { GENERAL_MANIFESTS } from './manifests/general.js';
import { SHOWCASE_MANIFESTS } from './manifests/showcase.js';
import { FORMS_MANIFESTS } from './manifests/forms.js';
import { SITE_MANIFESTS } from './manifests/site.js';
import { APP_MANIFESTS } from './manifests/app.js';

const MANIFEST_GROUPS: Array<Record<string, ComponentManifest<any>>> = [
  CORE_MANIFESTS,
  BASIC_MANIFESTS,
  MEDIA_MANIFESTS,
  GENERAL_MANIFESTS,
  SHOWCASE_MANIFESTS,
  FORMS_MANIFESTS,
  SITE_MANIFESTS,
  APP_MANIFESTS,
];

function mergeManifests(groups: Array<Record<string, ComponentManifest<any>>>): Record<string, ComponentManifest<any>> {
  const out: Record<string, ComponentManifest<any>> = {};
  for (const group of groups) {
    for (const [type, manifest] of Object.entries(group)) {
      if (Object.prototype.hasOwnProperty.call(out, type)) {
        throw new Error(`Duplicate component manifest type "${type}"`);
      }
      if (manifest.type !== type) {
        throw new Error(`Manifest key "${type}" does not match its type "${manifest.type}"`);
      }
      out[type] = manifest;
    }
  }
  return out;
}

/** Every registered component, merged from the per-category manifest files in `./manifests/`. */
export const COMPONENT_REGISTRY: Record<string, ComponentManifest<any>> = mergeManifests(MANIFEST_GROUPS);


export function getManifest(type: string): ComponentManifest<any> | undefined {
  return Object.prototype.hasOwnProperty.call(COMPONENT_REGISTRY, type) ? COMPONENT_REGISTRY[type] : undefined;
}

export function getAllManifests(): ComponentManifest<any>[] {
  return Object.values(COMPONENT_REGISTRY);
}

export function getManifestsByCategory(category: string): ComponentManifest<any>[] {
  return Object.values(COMPONENT_REGISTRY).filter((m) => m.category === category);
}

/** True when nodes of this type render child nodes (manifest `isContainer`). */
export function isContainerType(type: string): boolean {
  return getManifest(type)?.isContainer === true;
}

/** True when layout style keys of this type target its inner `[data-layout-of]` element. */
export function isLayoutInnerType(type: string): boolean {
  return getManifest(type)?.layoutInner === true;
}

/** PascalCase canonical component name for a registry type, or undefined for unknown types. */
export function componentNameFor(type: string): string | undefined {
  return getManifest(type)?.component;
}
