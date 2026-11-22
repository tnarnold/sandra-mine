// Lesson 9: SandraMine's screens, each number linked to the lesson that explains it.
import { g, rect, text, line, circle, el, to, set, pulse } from "../svg.js";
import { LESSON_SLUGS } from "./slugs.js";

const IX = 20, IY = 78, K = 0.62; // screenshot position and scale (images are 688x504)
const SCREENS = { miner: "../img/screen-miner.png", global: "../img/screen-global.png" };
// [label key, lesson number, hotspot in image pixels]
const SPOTS = [
  ["miner", [["c_hashrate", 4, [30, 300, 330, 120]], ["c_total", 4, [470, 355, 190, 55]], ["c_uptime", 6, [410, 285, 250, 45]]]],
  ["miner", [["c_templates", 3, [265, 120, 160, 50]], ["c_best", 4, [265, 175, 250, 50]], ["c_shares", 7, [300, 228, 130, 50]], ["c_valid", 6, [555, 135, 95, 130]]]],
  ["global", [["c_height", 1, [30, 250, 330, 115]], ["c_difficulty", 5, [470, 225, 180, 65]], ["c_nethash", 6, [370, 320, 290, 95]]]],
  ["global", [["c_fee", 8, [470, 150, 180, 70]], ["c_halving", 8, [30, 375, 280, 45]]]],
];

async function showSpots(s, ctx, i) {
  const [screen, spots] = SPOTS[i];
  s.img.setAttribute("href", SCREENS[screen]);
  s.spots.replaceChildren();
  for (const [k, [key, lesson, [x, y, w, h]]] of spots.entries()) {
    const grp = g(s.spots);
    const r = rect(grp, IX + x * K, IY + y * K, w * K, h * K, { rx: 6, fill: "rgba(255,90,31,.12)", stroke: "#ff5a1f", "stroke-width": 2 });
    const ly = 110 + k * 76;
    line(grp, IX + (x + w) * K, IY + (y + h / 2) * K, 470, ly, { class: "wire hot", "stroke-dasharray": "3 4" });
    const a = el(grp, "a", { href: `#/${LESSON_SLUGS[lesson - 1]}/1` });
    rect(a, 474, ly - 22, 300, 52, { rx: 8, class: "box" });
    circle(a, 498, ly + 4, 15, { class: "hot" });
    text(a, 498, ly + 9, lesson, { "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "#000" });
    text(a, 524, ly, ctx.label(key), { "font-size": 13, "font-weight": 600 });
    text(a, 524, ly + 18, ctx.label(key + "_sub"), { class: "tt muted", "font-size": 10.5 });
    set(grp, { o: 0, x: 10 });
    to(grp, { o: 1, x: 0 }, { animate: ctx.animate, dur: 400, delay: k * 220 });
    if (ctx.animate) pulse(r, { scale: 1.05, delay: k * 220 + 300 });
  }
  await ctx.wait(spots.length * 220 + 400);
}

export default {
  build(svg, ctx) {
    const s = { svg };
    s.screen = g(svg);
    text(s.screen, IX, 58, ctx.label("screen_cap"), { class: "cap" });
    s.img = el(s.screen, "image", { x: IX, y: IY, width: 688 * K, height: 504 * K, href: SCREENS.miner });
    s.spots = g(svg);
    return s;
  },

  steps: [
    async (s, ctx) => showSpots(s, ctx, 0),
    async (s, ctx) => showSpots(s, ctx, 1),
    async (s, ctx) => showSpots(s, ctx, 2),
    async (s, ctx) => showSpots(s, ctx, 3),

    // 5. The whole loop, each stop a lesson
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      set(s.screen, { o: 0 });
      s.spots.replaceChildren();
      const grp = g(s.svg);
      const cx = 400, cy = 240, R = 165;
      const stops = [1, 8, 3, 2, 4, 5, 6, 7];
      const pts = stops.map((_, i) => {
        const ang = -Math.PI / 2 + (i / stops.length) * Math.PI * 2;
        return [cx + Math.cos(ang) * R * 1.45, cy + Math.sin(ang) * R];
      });
      pts.forEach((p, i) => {
        const q = pts[(i + 1) % pts.length];
        line(grp, p[0], p[1], q[0], q[1], { class: "wire" });
      });
      text(grp, cx, cy - 8, ctx.label("loop_center"), { class: "big", "font-size": 26, "text-anchor": "middle" });
      text(grp, cx, cy + 18, ctx.label("loop_sub"), { class: "cap", "text-anchor": "middle" });
      const nodes = stops.map((lesson, i) => {
        const [x, y] = pts[i];
        const a = el(grp, "a", { href: `#/${LESSON_SLUGS[lesson - 1]}/1` });
        rect(a, x - 78, y - 22, 156, 44, { rx: 8, class: "box hot" });
        text(a, x - 66, y + 5, lesson, { class: "hot", "font-size": 15, "font-weight": 700 });
        text(a, x + 6, y + 5, ctx.label("loop_" + lesson), { "font-size": 12, "font-weight": 600, "text-anchor": "middle" });
        set(a, { o: 0, s: 0.8 });
        return a;
      });
      for (const n of nodes) await to(n, { o: 1, s: 1 }, { ...A, dur: 260 });
    },
  ],
};
