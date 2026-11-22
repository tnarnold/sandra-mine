// Tiny SVG + animation helpers for the lessons. No DOM access at import time
// (scripts/check-course-i18n.mjs imports the lessons under node).

const NS = "http://www.w3.org/2000/svg";

/** Creates an SVG element, sets attributes and appends it to `parent`. */
export function el(parent, tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
}
export const g = (parent, attrs) => el(parent, "g", attrs);
// Default sizes for the text classes in course.css (an attribute, so callers can override it).
const SIZES = { cap: 11, big: 34 };
export function text(parent, x, y, str, attrs = {}) {
  const cls = (attrs.class || "").split(" ");
  const size = attrs["font-size"] ?? cls.map((c) => SIZES[c]).find(Boolean);
  return el(parent, "text", { x, y, ...attrs, "font-size": size }, str);
}
export const rect = (parent, x, y, w, h, attrs = {}) => el(parent, "rect", { x, y, width: w, height: h, ...attrs });
export const line = (parent, x1, y1, x2, y2, attrs = {}) => el(parent, "line", { x1, y1, x2, y2, ...attrs });
export const circle = (parent, cx, cy, r, attrs = {}) => el(parent, "circle", { cx, cy, r, ...attrs });
export const path = (parent, d, attrs = {}) => el(parent, "path", { d, ...attrs });

export const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Each animated node keeps its state (x, y, scale, opacity, colors) in `node.__s`,
// so a step can say "go here" without knowing where the node is now.
const state = (n) => n.__s || (n.__s = { x: 0, y: 0, s: 1, o: 1 });
function frame(n) {
  const s = state(n);
  const f = { transform: `translate(${s.x}px, ${s.y}px) scale(${s.s})`, opacity: s.o };
  if (s.fill != null) f.fill = s.fill;
  if (s.stroke != null) f.stroke = s.stroke;
  return f;
}
function apply(n) {
  const f = frame(n);
  for (const [k, v] of Object.entries(f)) n.style[k] = v;
}

/**
 * Moves `node` to a new state: {x, y, s (scale), o (opacity), fill, stroke}.
 * With `animate: false` (steps being fast-forwarded) or reduced motion it jumps there.
 * Resolves when the animation ends.
 */
export function to(node, props, { dur = 650, delay = 0, ease = "cubic-bezier(.2,.75,.2,1)", animate = true } = {}) {
  const from = frame(node);
  Object.assign(state(node), props);
  apply(node);
  if (!animate || reducedMotion()) return Promise.resolve();
  const a = node.animate([from, frame(node)], { duration: dur, delay, easing: ease, fill: "backwards" });
  return a.finished.then(() => {}, () => {});
}
/** Sets the state without animating. */
export const set = (node, props) => to(node, props, { animate: false });

/** A short "look here" pulse that leaves no state behind. */
export function pulse(node, { animate = true, scale = 1.12, dur = 520, delay = 0 } = {}) {
  if (!animate || reducedMotion()) return Promise.resolve();
  const base = frame(node);
  const s = state(node);
  const up = { ...base, transform: `translate(${s.x}px, ${s.y}px) scale(${s.s * scale})` };
  return node.animate([base, up, base], { duration: dur, delay, easing: "ease-in-out" }).finished.then(() => {}, () => {});
}

/** Creates an HTML element (for the controls under the scene). */
export function html(tag, props = {}, parent) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  if (parent) parent.appendChild(n);
  return n;
}

/** Shortens a hex string for display: "a1b2c3…e4f5". */
export const short = (hex, head = 6, tail = 4) =>
  hex.length <= head + tail + 1 ? hex : hex.slice(0, head) + "…" + hex.slice(-tail);
