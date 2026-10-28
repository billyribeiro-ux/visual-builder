import type { DesignTokens, ProjectBlueprint } from '@app-viz/schema';
import { compileNodeScopedCss } from '@app-viz/engine';

/**
 * Generates pure Vanilla CSS implementing the official Google Material Design 3 (MD3) Design System
 * (Locked: October 28, 2026). Zero Tailwind, zero PostCSS.
 */
export function generateAppCss(tokens: DesignTokens, blueprint?: ProjectBlueprint): string {
  const colorVars = Object.entries(tokens.colors || {})
    .map(([key, val]) => `  --md-sys-color-${key}: ${val};`)
    .join('\n');

  const radiusVars = Object.entries(tokens.radii || {})
    .map(([key, val]) => `  --md-sys-shape-corner-${key}: ${val};`)
    .join('\n');

  const elevationVars = Object.entries(tokens.shadows || {})
    .map(([key, val]) => `  --md-sys-elevation-${key}: ${val};`)
    .join('\n');

  const spacingVars = Object.entries(tokens.spacing || {})
    .map(([key, val]) => `  --md-sys-spacing-${key}: ${val};`)
    .join('\n');

  return `/* ==========================================================================
   Google Material Design 3 (MD3) Design System — Pure Vanilla CSS
   Generated on 2026-10-28. No Tailwind or external runtime CSS required.
   ========================================================================== */

:root {
  /* MD3 Color System Roles */
${colorVars}

  /* MD3 Typography */
  --md-sys-font-heading: ${tokens.fonts?.heading || 'Roboto, system-ui, sans-serif'};
  --md-sys-font-body: ${tokens.fonts?.body || 'Roboto, system-ui, sans-serif'};
  --md-sys-font-mono: ${tokens.fonts?.mono || '"Roboto Mono", monospace'};

  /* MD3 Shape Corners */
${radiusVars}

  /* MD3 Elevations */
${elevationVars}

  /* MD3 Spacing */
${spacingVars}

  /* MD3 Motion & Transitions */
  --md-sys-motion-easing-standard: cubic-bezier(0.2, 0.0, 0, 1.0);
  --md-sys-motion-duration-short: 150ms;
  --md-sys-motion-duration-medium: 300ms;
}

/* Base MD3 Reset & Typography */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  min-height: 100vh;
  font-family: var(--md-sys-font-body);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--md-sys-font-heading);
  color: var(--md-sys-color-on-surface);
  font-weight: 700;
  line-height: 1.2;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

/* ==========================================================================
   Official Google MD3 Typography Scale
   ========================================================================== */
.md-display-large { font-family: var(--md-sys-font-heading); font-size: 3.5625rem; line-height: 4rem; font-weight: 700; letter-spacing: -0.015em; }
.md-display-medium { font-family: var(--md-sys-font-heading); font-size: 2.8125rem; line-height: 3.25rem; font-weight: 700; letter-spacing: -0.01em; }
.md-display-small { font-family: var(--md-sys-font-heading); font-size: 2.25rem; line-height: 2.75rem; font-weight: 700; }

.md-headline-large { font-family: var(--md-sys-font-heading); font-size: 2rem; line-height: 2.5rem; font-weight: 700; }
.md-headline-medium { font-family: var(--md-sys-font-heading); font-size: 1.75rem; line-height: 2.25rem; font-weight: 700; }
.md-headline-small { font-family: var(--md-sys-font-heading); font-size: 1.5rem; line-height: 2rem; font-weight: 600; }

.md-title-large { font-family: var(--md-sys-font-heading); font-size: 1.375rem; line-height: 1.75rem; font-weight: 600; }
.md-title-medium { font-family: var(--md-sys-font-heading); font-size: 1rem; line-height: 1.5rem; font-weight: 600; letter-spacing: 0.01em; }
.md-title-small { font-family: var(--md-sys-font-heading); font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; letter-spacing: 0.01em; }

.md-body-large { font-family: var(--md-sys-font-body); font-size: 1rem; line-height: 1.5rem; font-weight: 400; }
.md-body-medium { font-family: var(--md-sys-font-body); font-size: 0.875rem; line-height: 1.25rem; font-weight: 400; }
.md-body-small { font-family: var(--md-sys-font-body); font-size: 0.75rem; line-height: 1rem; font-weight: 400; }

.md-label-large { font-family: var(--md-sys-font-body); font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; letter-spacing: 0.01em; }
.md-label-medium { font-family: var(--md-sys-font-body); font-size: 0.75rem; line-height: 1rem; font-weight: 600; letter-spacing: 0.03em; }
.md-label-small { font-family: var(--md-sys-font-body); font-size: 0.6875rem; line-height: 1rem; font-weight: 600; letter-spacing: 0.03em; }

/* ==========================================================================
   MD3 Layout, Section, Container & Grid System
   ========================================================================== */
.md-section {
  width: 100%;
  padding: 4rem 0;
}

.md-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.md-container--sm, .md-container-sm { max-width: 640px; }
.md-container--md, .md-container-md { max-width: 768px; }
.md-container--lg, .md-container-lg { max-width: 1024px; }
.md-container--xl, .md-container-xl { max-width: 1280px; }
.md-container--2xl, .md-container-2xl { max-width: 1536px; }
.md-container--full, .md-container-full { max-width: 100%; }

.md-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
.md-grid-cols-1 { grid-template-columns: 1fr; }
@media (min-width: 768px) {
  .md-grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md-grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .md-grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .md-grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

/* ==========================================================================
   MD3 Buttons & Badges
   ========================================================================== */
.md-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  height: 40px;
  padding: 0 24px;
  font-size: 0.875rem;
  border-radius: var(--md-sys-shape-corner-full, 9999px);
  transition: all var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  outline: none;
  cursor: pointer;
}
.md-btn:focus-visible {
  outline: 2px solid var(--md-sys-color-primary);
  outline-offset: 2px;
}
.md-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
  pointer-events: none;
}

.md-btn--sm, .md-btn-sm {
  height: 32px;
  padding: 0 16px;
  font-size: 0.8125rem;
}
.md-btn--md, .md-btn-md {
  height: 40px;
  padding: 0 24px;
  font-size: 0.875rem;
}
.md-btn--lg, .md-btn-lg {
  height: 48px;
  padding: 0 32px;
  font-size: 1rem;
}

.md-btn--filled, .md-btn-filled {
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}
.md-btn--filled:hover, .md-btn-filled:hover {
  filter: brightness(0.92);
  box-shadow: var(--md-sys-elevation-level1);
}

.md-btn--tonal, .md-btn-tonal {
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}
.md-btn--tonal:hover, .md-btn-tonal:hover {
  filter: brightness(0.95);
  box-shadow: var(--md-sys-elevation-level1);
}

.md-btn--outlined, .md-btn-outlined {
  border: 1px solid var(--md-sys-color-outline);
  color: var(--md-sys-color-primary);
  background-color: transparent;
}
.md-btn--outlined:hover, .md-btn-outlined:hover {
  background-color: rgba(11, 87, 208, 0.08);
}

.md-btn--text, .md-btn-text {
  background-color: transparent;
  color: var(--md-sys-color-primary);
  padding-left: 12px;
  padding-right: 12px;
}
.md-btn--text:hover, .md-btn-text:hover {
  background-color: rgba(11, 87, 208, 0.08);
}

.md-btn--elevated, .md-btn-elevated {
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-primary);
  box-shadow: var(--md-sys-elevation-level1);
}

.md-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--md-sys-shape-corner-full, 9999px);
  font-size: 0.75rem;
  font-weight: 600;
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

/* ==========================================================================
   MD3 Cards
   ========================================================================== */
.md-card {
  border-radius: var(--md-sys-shape-corner-medium, 12px);
  padding: 1.5rem;
  background-color: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-on-surface);
  transition: box-shadow var(--md-sys-motion-duration-short) var(--md-sys-motion-easing-standard);
}
.md-card--elevated, .md-card-elevated {
  box-shadow: var(--md-sys-elevation-level1);
}
.md-card--elevated:hover, .md-card-elevated:hover {
  box-shadow: var(--md-sys-elevation-level2);
}
.md-card--filled, .md-card-filled {
  background-color: var(--md-sys-color-surface-container-highest);
}
.md-card--outlined, .md-card-outlined {
  background-color: var(--md-sys-color-surface);
  border: 1px solid var(--md-sys-color-outline-variant);
}

/* MD3 Header & Navbar */
.md-navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
  height: 64px;
  background-color: var(--md-sys-color-surface);
  border-bottom: 1px solid var(--md-sys-color-surface-variant);
  display: flex;
  align-items: center;
}
.md-navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}
.md-navbar__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.25rem;
}
.md-navbar__nav {
  display: none;
  align-items: center;
  gap: 2rem;
}
@media (min-width: 768px) {
  .md-navbar__nav { display: flex; }
}
.md-navbar__link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--md-sys-color-on-surface-variant);
  transition: color 150ms ease;
}
.md-navbar__link:hover {
  color: var(--md-sys-color-primary);
}

/* MD3 Hero Section */
.md-hero {
  padding: 5rem 0;
  overflow: hidden;
}
.md-hero__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
}
@media (min-width: 1024px) {
  .md-hero__grid { grid-template-columns: 1fr 1fr; }
}
.md-hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: var(--md-sys-shape-corner-full, 9999px);
  background-color: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}
.md-hero__title {
  font-size: 2.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 1.5rem;
}
@media (min-width: 768px) {
  .md-hero__title { font-size: 3.5rem; }
}
.md-hero__subtitle {
  font-size: 1.125rem;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 2rem;
  max-width: 540px;
}
.md-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* MD3 Feature Grid */
.md-feature-grid {
  padding: 4rem 0;
  background-color: var(--md-sys-color-surface-container-low);
}
.md-feature-grid__header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3rem auto;
}
.md-feature-grid__cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}
@media (min-width: 768px) {
  .md-feature-grid__cols--2 { grid-template-columns: 1fr 1fr; }
  .md-feature-grid__cols--3 { grid-template-columns: repeat(3, 1fr); }
}

/* MD3 Pricing */
.md-pricing {
  padding: 5rem 0;
}
.md-pricing__header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 3.5rem auto;
}
.md-pricing__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}
@media (min-width: 768px) {
  .md-pricing__grid { grid-template-columns: repeat(3, 1fr); }
}
.md-pricing__card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.md-pricing__card--popular {
  border: 2px solid var(--md-sys-color-primary);
  position: relative;
}
.md-pricing__popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  padding: 2px 12px;
  border-radius: var(--md-sys-shape-corner-full, 9999px);
  font-size: 0.75rem;
  font-weight: 700;
}
.md-pricing__price {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 1.5rem 0;
}

/* MD3 Accordion */
.md-accordion {
  padding: 4rem 0;
}
.md-accordion__item {
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-medium, 12px);
  margin-bottom: 1rem;
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-lowest);
}
.md-accordion__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
}
.md-accordion__trigger:hover {
  background-color: var(--md-sys-color-surface-container);
}
.md-accordion__content {
  padding: 0 1.5rem 1.25rem 1.5rem;
  color: var(--md-sys-color-on-surface-variant);
  font-size: 0.9375rem;
  border-top: 1px solid var(--md-sys-color-surface-variant);
}

/* MD3 Footer */
.md-footer {
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container-low);
  padding: 4rem 0 2rem 0;
}
.md-footer__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
}
@media (min-width: 1024px) {
  .md-footer__grid { grid-template-columns: 2fr 1fr 1fr; }
}

/* MD3 Dashboard Shell */
.md-dashboard {
  display: flex;
  min-height: 100vh;
  background-color: var(--md-sys-color-surface);
}
.md-dashboard__sidebar {
  width: 260px;
  background-color: var(--md-sys-color-surface-container-low);
  border-right: 1px solid var(--md-sys-color-outline-variant);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
@media (max-width: 767px) {
  .md-dashboard__sidebar { display: none; }
}
.md-dashboard__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.md-dashboard__header {
  height: 64px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.md-dashboard__content {
  padding: 2rem;
  flex: 1;
}

/* MD3 KPI Grid */
.md-kpi-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 2rem;
}
@media (min-width: 640px) {
  .md-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .md-kpi-grid { grid-template-columns: repeat(4, 1fr); }
}
.md-kpi-card__title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--md-sys-color-on-surface-variant);
}
.md-kpi-card__val {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 0.5rem;
}

/* MD3 Data Table */
.md-table-container {
  border-radius: var(--md-sys-shape-corner-medium, 12px);
  border: 1px solid var(--md-sys-color-outline-variant);
  overflow: hidden;
  background-color: var(--md-sys-color-surface);
}
.md-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}
.md-table th {
  background-color: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
  padding: 0.75rem 1.5rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.md-table td {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--md-sys-color-outline-variant);
}
.md-table tr:hover td {
  background-color: var(--md-sys-color-surface-container-low);
}

/* MD3 Form Controls */
.md-form-group {
  margin-bottom: 1.25rem;
}
.md-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--md-sys-color-on-surface-variant);
  margin-bottom: 0.5rem;
}
.md-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-radius: var(--md-sys-shape-corner-small, 8px);
  border: 1px solid var(--md-sys-color-outline);
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  outline: none;
  transition: border-color var(--md-sys-motion-duration-short);
}
.md-input:focus {
  border-color: var(--md-sys-color-primary);
  box-shadow: 0 0 0 1px var(--md-sys-color-primary);
}
${
  blueprint
    ? `\n/* Responsive Breakpoint Overrides & Interactive State Variants */\n${compileNodeScopedCss([
        ...blueprint.layouts.map((l) => l.rootNode),
        ...blueprint.pages.map((p) => p.rootNode)
      ])}\n`
    : ''
}`;
}
