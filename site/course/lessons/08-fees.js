// Lesson 8: fees. Uses the live mempool projection (next blocks and their median fee).
import { g, rect, text, line, html, to, set, pulse } from "../svg.js";
import { num } from "../fmt.js";

const BX0 = 40, BW = 80, BGAP = 10, BY = 110, BH = 90, NB = 8;
const bx = (i) => BX0 + i * (BW + BGAP);
/** Index of the projected block a transaction paying `rate` sat/vB would land in (NB = later). */
function slotFor(rate, blocks) {
  const i = blocks.slice(0, NB).findIndex((b) => rate >= b.medianFee);
  return i < 0 ? NB : i;
}

export default {
  build(svg, ctx) {
    const s = { svg };
    s.proj = g(svg);
    text(s.proj, BX0, 70, ctx.label("proj_cap"), { class: "cap" });
    text(s.proj, BX0, BY + BH + 40, "← " + ctx.label("first"), { class: "tt dim", "font-size": 11 });
    s.blocks = [];
    for (let i = 0; i < NB; i++) {
      const b = g(s.proj);
      b.box = rect(b, bx(i), BY, BW, BH, { rx: 6, class: i === 0 ? "box hot" : "box" });
      b.fee = text(b, bx(i) + BW / 2, BY + 42, "", { class: "tt", "font-size": 15, "text-anchor": "middle" });
      text(b, bx(i) + BW / 2, BY + 60, "sat/vB", { class: "tt dim", "font-size": 10, "text-anchor": "middle" });
      text(b, bx(i) + BW / 2, BY + BH + 18, "~" + (i + 1) * 10 + " min", { class: "tt muted", "font-size": 11, "text-anchor": "middle" });
      set(b, { o: 0, y: 10 });
      s.blocks.push(b);
    }
    s.more = text(s.proj, bx(NB - 1) + BW, BY + BH + 40, "", { class: "tt muted", "font-size": 11, "text-anchor": "end" });
    s.tx = rect(svg, 0, 0, 22, 22, { rx: 4, fill: "#ff5a1f", stroke: "#fff", "stroke-width": 2.5 });
    set(s.tx, { o: 0 });
    s.showProj = (n) => {
      s.blocks.forEach((b, i) => {
        const p = n.mempoolBlocks[i];
        b.fee.textContent = p ? num(p.medianFee, p.medianFee < 10 ? 1 : 0) : "–";
      });
      const totalMB = n.mempoolVsize / 1e6;
      s.more.textContent = ctx.label("mempool_total", { mb: num(totalMB), n: num(Math.ceil(totalMB)) });
    };
    s.showProj(ctx.net);
    ctx.onNet(s.showProj);
    s.place = (rate, animate) => {
      const i = slotFor(rate, ctx.net.mempoolBlocks);
      const x = i < NB ? bx(i) + BW / 2 - 11 : bx(NB - 1) + BW + 4;
      return to(s.tx, { x, y: BY - 34, o: 1 }, { animate, dur: 600 }).then(() => i);
    };
    return s;
  },

  steps: [
    // 1. A bus with limited seats
    async (s, ctx) => {
      s.blocks.forEach((b, i) => to(b, { o: 1, y: 0 }, { animate: ctx.animate, dur: 400, delay: i * 90 }));
      await ctx.wait(NB * 90 + 400);
      await pulse(s.blocks[0], { animate: ctx.animate, scale: 1.06 });
    },

    // 2. You pay per byte, not per transaction
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      const grp = g(s.svg);
      const y = 300;
      const small = rect(grp, BX0, y, 70, 50, { rx: 5, class: "box hot" });
      text(grp, BX0, y - 10, ctx.label("small_tx"), { class: "cap" });
      text(grp, BX0, y + 72, ctx.label("fee_calc", { vb: 140, rate: 10, sats: num(1400) }), { class: "tt", "font-size": 12 });
      const big = rect(grp, 330, y, 280, 50, { rx: 5, class: "box hot" });
      text(grp, 330, y - 10, ctx.label("big_tx"), { class: "cap" });
      text(grp, 330, y + 72, ctx.label("fee_calc", { vb: 560, rate: 10, sats: num(5600) }), { class: "tt", "font-size": 12 });
      text(grp, BX0, y + 110, ctx.label("same_priority"), { class: "tt ok", "font-size": 13 });
      set(grp, { o: 0 });
      s.sizeGrp = grp;
      await to(grp, { o: 1 }, { ...A, dur: 500 });
      await pulse(small, A);
      await pulse(big, { ...A, scale: 1.04 });
    },

    // 3. How much to pay right now
    async (s, ctx) => {
      if (s.sizeGrp) set(s.sizeGrp, { o: 0 });
      const m = ctx.memo;
      if (m.rate == null) m.rate = 4;
      const eta = text(s.svg, BX0, 290, "", { class: "tt", "font-size": 16 });
      const update = (animate) => {
        const i = slotFor(m.rate, ctx.net.mempoolBlocks);
        const when = i < NB ? ctx.label("eta", { m: (i + 1) * 10 }) : ctx.label("eta_later");
        eta.textContent = ctx.label("your_fee", { rate: m.rate }) + " → " + when;
        ctx.setVars({ rate: m.rate, eta: when });
        return s.place(m.rate, animate);
      };
      const bar = html("div", { className: "seg" });
      [1, 2, 4, 8, 16, 32].forEach((r) => {
        const b = html("button", { type: "button", className: "btn" + (r === m.rate ? " on" : ""), textContent: r + " sat/vB" }, bar);
        b.addEventListener("click", () => {
          m.rate = r;
          bar.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
          update(true);
        });
      });
      ctx.controls.append(bar);
      await update(ctx.animate);
      s.eta = eta;
    },

    // 4. Stuck? Bump it
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      ctx.controls.replaceChildren();
      if (s.eta) set(s.eta, { o: 0 });
      const low = Math.max(0.5, Math.min(...ctx.net.mempoolBlocks.slice(0, NB).map((b) => b.medianFee)) * 0.5);
      const note = text(s.svg, BX0, 290, ctx.label("stuck", { rate: num(low, 1) }), { class: "tt bad", "font-size": 14 });
      await s.place(low, ctx.animate);
      await ctx.wait(900);
      const high = ctx.net.mempoolBlocks[0].medianFee * 1.5;
      note.textContent = ctx.label("rbf", { rate: num(high, 1) });
      note.setAttribute("class", "tt ok");
      await s.place(high, ctx.animate);
      await pulse(s.tx, { ...A, scale: 1.5 });
      s.note = note;
    },

    // 5. Subsidy and fees
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      [s.proj, s.tx, s.note].forEach((n) => n && set(n, { o: 0 }));
      const grp = g(s.svg);
      const X0 = 80, Y0 = 400, H = 300, ERAS = 9, EW = 72;
      text(grp, X0, 60, ctx.label("subsidy_cap"), { class: "cap" });
      line(grp, X0, Y0, X0 + ERAS * EW, Y0, { class: "wire" });
      const era = Math.floor(ctx.net.height / 210000);
      for (let k = 0; k < ERAS; k++) {
        const v = 50 / 2 ** k;
        const h = (v / 50) * H;
        const r = rect(grp, X0 + k * EW + 4, Y0 - h, EW - 8, h, { rx: 3, class: k === era ? "box hot" : k < era ? "box" : "box" });
        if (k > era) r.setAttribute("opacity", 0.4);
        text(grp, X0 + k * EW + EW / 2, Y0 - h - 8, num(v, 3), { class: "tt", "font-size": 11, "text-anchor": "middle" });
        // halvings: 2012, 2016, 2020, 2024… (era 0 started in 2009)
        text(grp, X0 + k * EW + EW / 2, Y0 + 18, k === 0 ? 2009 : 2008 + k * 4, { class: "tt dim", "font-size": 10, "text-anchor": "middle" });
        set(r, { o: 0 });
        to(r, { o: 1 }, { ...A, dur: 300, delay: k * 90 });
      }
      const here = text(grp, X0 + era * EW + EW / 2, Y0 - ((50 / 2 ** era) / 50) * H - 30, "▼ " + ctx.label("here"), { class: "tt hot", "font-size": 12, "text-anchor": "middle" });
      await ctx.wait(ERAS * 90 + 300);
      await pulse(here, { ...A, scale: 1.2 });
    },
  ],
};
