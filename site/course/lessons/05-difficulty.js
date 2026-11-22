// Lesson 5: why ~10 minutes. Block times are random; the difficulty adjustment keeps
// the average on target every 2016 blocks.
import { g, rect, text, line, path, to, set, pulse } from "../svg.js";
import { num } from "../fmt.js";

const X0 = 60, X1 = 760, MINUTES = 120;
const tx = (min) => X0 + (min / MINUTES) * (X1 - X0);
const rnd = (i) => { const x = Math.sin(i * 91.17 + 12.3) * 43758.5453; return x - Math.floor(x); };
/** Arrival times (minutes) of blocks with the given mean interval, deterministic per seed. */
function arrivals(mean, seed) {
  const out = [];
  let t = 0;
  for (let i = 0; ; i++) {
    t += -mean * Math.log(1 - rnd(seed * 100 + i) * 0.98);
    if (t > MINUTES) return out;
    out.push(t);
  }
}

function timeline(svg, y, label, times, ctx, cls = "box hot") {
  const grp = g(svg);
  text(grp, X0, y - 26, label, { class: "cap" });
  line(grp, X0, y, X1, y, { class: "wire" });
  for (let m = 0; m <= MINUTES; m += 20) {
    line(grp, tx(m), y - 4, tx(m), y + 4, { class: "wire" });
    text(grp, tx(m), y + 20, m + " min", { class: "tt dim", "font-size": 10, "text-anchor": "middle" });
  }
  grp.blocks = times.map((t) => {
    const b = rect(grp, tx(t) - 7, y - 7, 14, 14, { rx: 3, class: cls });
    set(b, { o: 0, s: 0.3 });
    return b;
  });
  const avg = times.length ? times.at(-1) / times.length : 0;
  grp.avg = text(grp, X1, y - 26, ctx.label("avg", { n: times.length, m: num(avg, 1) }), { class: "tt muted", "font-size": 11, "text-anchor": "end" });
  set(grp, { o: 0 });
  return grp;
}
async function play(row, ctx) {
  await to(row, { o: 1 }, { animate: ctx.animate, dur: 300 });
  row.blocks.forEach((b, i) => to(b, { o: 1, s: 1 }, { animate: ctx.animate, dur: 300, delay: i * 140 }));
  await ctx.wait(row.blocks.length * 140 + 300);
}

export default {
  build(svg, ctx) {
    const s = { svg };
    s.row1 = timeline(svg, 70, ctx.label("row_normal"), arrivals(10, 1), ctx);
    s.row2 = timeline(svg, 160, ctx.label("row_double"), arrivals(5, 1), ctx, "box bad");
    s.row3 = timeline(svg, 250, ctx.label("row_adjusted"), arrivals(10, 2), ctx, "box ok");
    return s;
  },

  steps: [
    // 1. A race with no clock
    async (s, ctx) => {
      await play(s.row1, ctx);
      await pulse(s.row1.avg, { animate: ctx.animate });
    },

    // 2. More miners, faster blocks
    async (s, ctx) => {
      await play(s.row2, ctx);
      await pulse(s.row2.avg, { animate: ctx.animate });
    },

    // 3. Every 2016 blocks the rule corrects itself
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      const grp = g(s.svg);
      const y = 330;
      text(grp, X0, y - 12, ctx.label("epoch_cap"), { class: "cap" });
      rect(grp, X0, y, 560, 20, { rx: 3, class: "box" });
      text(grp, X0 + 568, y + 15, ctx.label("expected"), { class: "tt muted", "font-size": 11 });
      const took = rect(grp, X0, y + 30, 280, 20, { rx: 3, class: "box bad" });
      text(grp, X0 + 288, y + 45, ctx.label("took"), { class: "tt bad", "font-size": 11 });
      const res = text(grp, X0, y + 86, ctx.label("result"), { class: "tt hot", "font-size": 14 });
      set(grp, { o: 0 });
      set(res, { o: 0 });
      took.style.transformOrigin = "left center";
      await to(grp, { o: 1 }, { ...A, dur: 400 });
      await to(res, { o: 1 }, { ...A, dur: 400, delay: 300 });
      await play(s.row3, ctx);
      s.epochGrp = grp;
    },

    // 4. Live: the current period
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      [s.row1, s.row2, s.row3, s.epochGrp].forEach((n) => set(n, { o: 0 }));
      const grp = g(s.svg);
      text(grp, X0, 120, ctx.label("live_cap"), { class: "cap" });
      rect(grp, X0, 134, 700, 34, { rx: 4, class: "box" });
      const fill = rect(grp, X0, 134, 0, 34, { rx: 4, fill: "#ff5a1f", opacity: 0.85 });
      const done = text(grp, X0, 200, "", { class: "tt", "font-size": 14 });
      const left = text(grp, X0 + 700, 200, "", { class: "tt muted", "font-size": 14, "text-anchor": "end" });
      const change = text(grp, 400, 290, "", { class: "big", "font-size": 64, "text-anchor": "middle" });
      text(grp, 400, 320, ctx.label("est_change"), { class: "cap", "text-anchor": "middle" });
      const show = (n) => {
        const d = 2016 - n.retargetBlocks;
        fill.setAttribute("width", (700 * d) / 2016);
        done.textContent = ctx.label("blocks_done", { n: num(d) });
        left.textContent = ctx.label("blocks_left", { n: num(n.retargetBlocks) });
        const c = n.retargetChange;
        change.textContent = (c > 0 ? "+" : "") + num(c, 2) + "%";
        change.setAttribute("class", "big " + (c >= 0 ? "hot" : "ok"));
      };
      show(ctx.net);
      ctx.onNet(show);
      set(grp, { o: 0 });
      await to(grp, { o: 1 }, { ...A, dur: 500 });
      await pulse(change, { ...A, scale: 1.08 });
      s.liveGrp = grp;
    },

    // 5. Why ten minutes? Two winners at once
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      set(s.liveGrp, { o: 0 });
      const grp = g(s.svg);
      const bx = (i) => 80 + i * 120;
      [0, 1, 2].forEach((i) => rect(grp, bx(i), 200, 80, 50, { rx: 6, class: "box" }));
      [0, 1].forEach((i) => line(grp, bx(i) + 80, 225, bx(i + 1), 225, { class: "wire" }));
      // two blocks at the same height
      const a = rect(grp, bx(3), 140, 80, 50, { rx: 6, class: "box hot" });
      const b = rect(grp, bx(3), 260, 80, 50, { rx: 6, class: "box hot" });
      const la = path(grp, `M ${bx(2) + 80} 225 L ${bx(3)} 165`, { class: "wire" });
      const lb = path(grp, `M ${bx(2) + 80} 225 L ${bx(3)} 285`, { class: "wire" });
      const ta = text(grp, bx(3) + 40, 170, "A", { "text-anchor": "middle", "font-weight": 700 });
      const tb = text(grp, bx(3) + 40, 290, "B", { "text-anchor": "middle", "font-weight": 700 });
      const next = rect(grp, bx(4), 140, 80, 50, { rx: 6, class: "box ok" });
      const ln = line(grp, bx(3) + 80, 165, bx(4), 165, { class: "wire" });
      const orphan = text(grp, bx(3) + 40, 336, ctx.label("orphan"), { class: "tt bad", "font-size": 12, "text-anchor": "middle" });
      const split = text(grp, bx(3) + 40, 120, ctx.label("split"), { class: "tt muted", "font-size": 12, "text-anchor": "middle" });
      [a, b, la, lb, ta, tb, next, ln, orphan, split].forEach((n) => set(n, { o: 0 }));
      await Promise.all([a, b, la, lb, ta, tb, split].map((n) => to(n, { o: 1 }, { ...A, dur: 500 })));
      await ctx.wait(900);
      await Promise.all([next, ln].map((n) => to(n, { o: 1 }, { ...A, dur: 500 })));
      to(b, { o: 0.3 }, { ...A, dur: 500 });
      to(lb, { o: 0.3 }, { ...A, dur: 500 });
      to(tb, { o: 0.3 }, { ...A, dur: 500 });
      await to(orphan, { o: 1 }, { ...A, dur: 500 });
    },
  ],
};
