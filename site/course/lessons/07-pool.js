// Lesson 7: pool or solo. Same expected value, very different variance.
import { g, rect, text, line, circle, path, to, set, pulse } from "../svg.js";
import { num, hashrate, duration, btc } from "../fmt.js";
import { odds } from "./06-odds.js";

const CX0 = 80, CX1 = 740, CY0 = 400, CY1 = 90;
const rnd = (i) => { const x = Math.sin(i * 51.31 + 7.7) * 43758.5453; return x - Math.floor(x); };
const PER_YEAR = 2; // the example miner expects 2 blocks a year
const FEE = 0.02;
const MY_H = 8e7;

/** Days (0..365) on which a solo miner finds a block, deterministic per seed. */
function wins(seed) {
  const out = [];
  let d = 0;
  for (let i = 0; ; i++) {
    d += (-365 / PER_YEAR) * Math.log(1 - rnd(seed * 50 + i) * 0.999);
    if (d > 365) return out;
    out.push(d);
  }
}

export default {
  build(svg, ctx) {
    const s = { svg };
    const reward = ctx.net.subsidy;
    const runs = [3, 8, 5].map(wins);
    const yMax = Math.max(...runs.map((r) => r.length), PER_YEAR) * reward * 1.15;
    const X = (d) => CX0 + (d / 365) * (CX1 - CX0);
    const Y = (b) => CY0 - (b / yMax) * (CY0 - CY1);

    s.chart = g(svg);
    text(s.chart, CX0, 60, ctx.label("chart_cap"), { class: "cap" });
    line(s.chart, CX0, CY0, CX1, CY0, { class: "wire" });
    line(s.chart, CX0, CY0, CX0, CY1, { class: "wire" });
    for (let m = 0; m <= 12; m += 3) text(s.chart, X(m * 30.4), CY0 + 20, ctx.label("month", { n: m }), { class: "tt dim", "font-size": 10, "text-anchor": "middle" });
    for (let b = 0; b <= yMax; b += reward) text(s.chart, CX0 - 8, Y(b) + 4, num(b, 2), { class: "tt dim", "font-size": 10, "text-anchor": "end" });
    s.solo = runs.map((r, k) => {
      let d = `M ${X(0)} ${Y(0)}`, total = 0;
      for (const day of r) { d += ` H ${X(day)}`; total += reward; d += ` V ${Y(total)}`; }
      d += ` H ${X(365)}`;
      const p = path(s.chart, d, { class: "wire hot", "stroke-width": 2.5, opacity: [1, 0.6, 0.35][k] });
      set(p, { o: 0 });
      return p;
    });
    const top = Math.max(...runs.map((r) => r.length)) * reward;
    s.soloLabel = text(s.chart, X(365) - 4, Y(top) - 10, ctx.label("solo_runs"), { class: "tt hot", "font-size": 11, "text-anchor": "end" });
    s.pool = line(s.chart, X(0), Y(0), X(365), Y(PER_YEAR * reward * (1 - FEE)), { class: "wire ok", "stroke-width": 2.5 });
    s.poolLabel = text(s.chart, X(150), Y(PER_YEAR * reward * (1 - FEE) * 150 / 365) - 14, ctx.label("pool_line"), { class: "tt ok", "font-size": 11, "text-anchor": "end" });
    [s.soloLabel, s.pool, s.poolLabel].forEach((n) => set(n, { o: 0 }));
    return s;
  },

  steps: [
    // 1. Solo: all or nothing
    async (s, ctx) => {
      for (const p of s.solo) await to(p, { o: 1 }, { animate: ctx.animate, dur: 600 });
      await to(s.soloLabel, { o: 1 }, { animate: ctx.animate, dur: 300 });
    },

    // 2. Pool: smooth line, same average
    async (s, ctx) => {
      await to(s.pool, { o: 1 }, { animate: ctx.animate, dur: 600 });
      await to(s.poolLabel, { o: 1 }, { animate: ctx.animate, dur: 300 });
      await pulse(s.poolLabel, { animate: ctx.animate });
    },

    // 3. How a pool splits the prize: shares
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      set(s.chart, { o: 0 });
      const grp = g(s.svg);
      const miners = [0, 1, 2, 3, 4, 5].map((i) => {
        const y = 80 + i * 62;
        const c = circle(grp, 110, y, 18, { class: "box" });
        text(grp, 110, y + 5, String.fromCharCode(65 + i), { "text-anchor": "middle", "font-weight": 700, "font-size": 13 });
        line(grp, 128, y, 330, 240, { class: "wire dash" });
        return { c, y };
      });
      const pool = rect(grp, 330, 190, 160, 100, { rx: 10, class: "box hot" });
      text(grp, 410, 236, ctx.label("pool"), { "text-anchor": "middle", "font-weight": 700, "font-size": 16 });
      const shares = text(grp, 410, 260, "", { class: "tt muted", "font-size": 11, "text-anchor": "middle" });
      const block = rect(grp, 600, 205, 90, 70, { rx: 8, class: "box ok" });
      text(grp, 645, 246, ctx.label("block"), { "text-anchor": "middle", "font-size": 13, "font-weight": 600 });
      const split = text(grp, 645, 310, "", { class: "tt ok", "font-size": 11, "text-anchor": "middle" });
      set(block, { o: 0 });
      s.poolGrp = grp;
      let n = 0;
      const sendShare = () => {
        const mi = miners[(n * 7) % 6];
        const d = circle(grp, 128, mi.y, 4, { fill: "#ff8a3d" });
        n++;
        shares.textContent = ctx.label("shares_n", { n });
        to(d, { x: 330 - 128, y: 240 - mi.y, o: 0.2 }, { dur: 700 }).then(() => d.remove());
      };
      if (!ctx.animate || ctx.reduced) {
        shares.textContent = ctx.label("shares_n", { n: 1000 });
        set(block, { o: 1 });
        split.textContent = ctx.label("split");
        return;
      }
      for (let i = 0; i < 14; i++) { sendShare(); await ctx.wait(110); }
      await to(block, { o: 1 }, { ...A, dur: 500 });
      await pulse(pool, { ...A, scale: 1.05 });
      split.textContent = ctx.label("split");
      // reward flows back to every miner
      for (const mi of miners) {
        const coin = circle(grp, 330, 240, 6, { fill: "#4ade80" });
        to(coin, { x: 128 - 330, y: mi.y - 240, o: 0 }, { dur: 800 }).then(() => coin.remove());
        await ctx.wait(70);
      }
      ctx.every(400, sendShare);
    },

    // 4. Side by side
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      if (s.poolGrp) s.poolGrp.remove();
      const grp = g(s.svg);
      const rows = ["prize", "often", "fee", "variance", "payout"];
      const cols = [[240, "solo"], [520, "pool"]];
      text(grp, cols[0][0], 60, ctx.label("col_solo"), { class: "hot", "font-size": 18, "font-weight": 700, "text-anchor": "middle" });
      text(grp, cols[1][0], 60, ctx.label("col_pool"), { class: "ok", "font-size": 18, "font-weight": 700, "text-anchor": "middle" });
      rows.forEach((r, i) => {
        const y = 110 + i * 66;
        line(grp, 40, y - 30, 760, y - 30, { class: "wire" });
        text(grp, 40, y, ctx.label("row_" + r), { class: "cap" });
        const a = text(grp, cols[0][0], y, ctx.label(`solo_${r}`), { "text-anchor": "middle", "font-size": 13 });
        const b = text(grp, cols[1][0], y, ctx.label(`pool_${r}`), { "text-anchor": "middle", "font-size": 13 });
        set(a, { o: 0 });
        set(b, { o: 0 });
        to(a, { o: 1 }, { ...A, dur: 300, delay: i * 160 });
        to(b, { o: 1 }, { ...A, dur: 300, delay: i * 160 + 80 });
      });
      s.table = grp;
      await ctx.wait(rows.length * 160 + 400);
    },

    // 5. Why SandraMine mines solo
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      if (s.table) set(s.table, { o: 0 });
      const grp = g(s.svg);
      text(grp, 400, 70, ctx.label("at_rate", { h: hashrate(MY_H) }), { class: "cap", "text-anchor": "middle" });
      const left = text(grp, 220, 200, "", { class: "big ok", "font-size": 30, "text-anchor": "middle" });
      text(grp, 220, 228, ctx.label("pool_pays"), { class: "cap", "text-anchor": "middle" });
      const leftSub = text(grp, 220, 256, "", { class: "tt muted", "font-size": 12, "text-anchor": "middle" });
      const right = text(grp, 580, 200, "", { class: "big hot", "font-size": 30, "text-anchor": "middle" });
      text(grp, 580, 228, ctx.label("solo_ticket"), { class: "cap", "text-anchor": "middle" });
      const rightSub = text(grp, 580, 256, "", { class: "tt muted", "font-size": 12, "text-anchor": "middle" });
      line(grp, 400, 150, 400, 300, { class: "wire" });
      const show = (net) => {
        const o = odds(MY_H, net);
        const perDay = o.evDay * (1 - FEE);
        left.textContent = btc(perDay);
        leftSub.textContent = ctx.label("min_payout", { t: duration((1000 / 1e8 / perDay) * 86400) });
        right.textContent = num(net.subsidy, 3) + " BTC";
        rightSub.textContent = ctx.label("solo_wait", { t: duration(o.wait) });
        ctx.setVars({ poolDay: btc(perDay), payoutWait: duration((1000 / 1e8 / perDay) * 86400), soloWait: duration(o.wait) });
      };
      show(ctx.net);
      ctx.onNet(show);
      set(grp, { o: 0 });
      await to(grp, { o: 1 }, { ...A, dur: 500 });
      await pulse(right, { ...A, scale: 1.1 });
    },
  ],
};
