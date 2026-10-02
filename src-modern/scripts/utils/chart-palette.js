// ==========================================================================
// Chart palette
// ==========================================================================
//
// One source of truth for every colour that ends up inside a chart. Before this
// module the hexes were inlined at ~40 call sites across nine components, and
// they had drifted into two different palettes: the dashboard/reports/users
// charts used the Tailwind indigo set while analytics still used Bootstrap 4's
// `#007bff` / `#28a745` / `#fd7e14`. Two charts on adjacent pages could show the
// same series in two different blues.
//
// The categorical sequences below are validated for the lightness band, chroma
// floor, adjacent-pair CVD separation (deutan/protan/tritan), normal-vision
// separation and contrast against their own surface — light against #ffffff,
// dark against the #18181b panel. Do not hand-edit a hex here without
// re-validating; a plausible-looking substitution is exactly how a palette
// silently becomes unreadable for a colourblind reader.
//
// Rules that come with using this module:
//   - Assign categorical hues in fixed order. Never cycle for a 7th series —
//     fold the tail into "Other" instead.
//   - Status colours are reserved. `STATUS.danger` means something failed; it is
//     never "series 4".
//   - Sequential data (one measure, varying magnitude) uses SEQUENTIAL_BLUE,
//     which is one hue stepped light→dark. Never a categorical array.
//
// ==========================================================================

/** Fixed-order categorical sequence for light surfaces. */
const CATEGORICAL_LIGHT = [
  '#ff5722', // OmniStore Flame Orange
  '#0ea5e9', // Cyber Sky Blue
  '#10b981', // Emerald Green
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

/** Fixed-order categorical sequence for dark surfaces. */
const CATEGORICAL_DARK = [
  '#ff7043', // Light Flame Orange
  '#38bdf8', // Light Sky Blue
  '#34d399', // Light Emerald
  '#a78bfa', // Light Violet
  '#fbbf24', // Light Amber
  '#f472b6', // Light Pink
];

/** Single-hue ramp for magnitude (OmniStore Orange Ramp). Light → dark. */
export const SEQUENTIAL_BLUE = ['#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#ff5722', '#c2410c'];

/**
 * Reserved status colours. These carry meaning, so they are kept out of the
 * categorical sequence — a chart must never use `STATUS.danger` for a series
 * that is not actually a failure state.
 */
export const STATUS = {
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  neutral: '#71717a',
};

function isDark() {
  return document.documentElement.getAttribute('data-bs-theme') === 'dark';
}

/**
 * The categorical sequence for the theme that is active right now.
 *
 * Resolved at call time rather than import time so a page loaded in dark mode
 * gets the dark sequence. Charts are not currently re-rendered when the theme is
 * toggled mid-session, so a chart built in light mode keeps its light colours
 * until the page is reloaded.
 *
 * @param {number} [count] - take the first N in fixed order; omit for all six.
 * @returns {string[]}
 */
export function categorical(count) {
  const seq = isDark() ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  return count ? seq.slice(0, count) : [...seq];
}

/** The accent — series-of-one, and any single-measure chart. */
export function accent() {
  return categorical(1)[0];
}

/** Recessive ink for axis labels, ticks and legends. Never a series colour. */
export function axisInk() {
  return isDark() ? '#a1a1aa' : '#71717a';
}

/** Grid and axis-border lines — the most recessive mark on the chart. */
export function gridLine() {
  return isDark() ? '#27272a' : '#e4e4e7';
}

/** Unfilled remainder of a gauge / progress donut. */
export function trackFill() {
  return isDark() ? '#27272a' : '#e4e4e7';
}

/** The panel a chart sits on — used for the 2px ring on overlapping marks. */
export function surfacePanel() {
  return isDark() ? '#18181b' : '#ffffff';
}

/** Ink for a label drawn on top of a filled mark. */
export function onFillInk() {
  return '#ffffff';
}
