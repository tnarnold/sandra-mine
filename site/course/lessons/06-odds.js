// Lesson 6: napkin math of solo mining odds, with the live network hashrate.
import { g, rect, text, line, circle, html, to, set, pulse } from "../svg.js";
import { num, compact, hashrate, duration, oneIn, btc } from "../fmt.js";

const LX0 = 60, LX1 = 740, LMAX = 22; // log10 axis: 1 H/s .. 10^22 H/s
const lx = (h) => LX0 + (Math.log10(Math.max(1, h)) / LMAX) * (LX1 - LX0);
export const PRESETS = [
  ["NerdMiner ESP32", 5e4],
  ["CPU", 2.6e7],
  ["CPU + GPU", 8e7],
  ["GPU", 1e9],
  ["ASIC", 2e14],
];
const BLOCKS_DAY = 144, BLOCKS_YEAR = 52560;

/** Probabilities and expected values for hashrate h against the network. */
export function odds(h, net) {
  const p = h / (net.hashrate + h);
  const inN = (n) => -Math.expm1(n * Math.log1p(-p));
  return {
    p,
    day: inN(BLOCKS_DAY),
    year: inN(BLOCKS_YEAR),
    wait: 600 / p,
    evDay: BLOCKS_DAY * p * net.subsidy,
  };
}

export default {
  build(svg, ctx) {
    const s = { svg };
    const m = ctx.memo;
    if (m.h == null) m.h = 8e7;

    // log axis of hashrates
    s.axis = g(svg);
    text(s.axis, LX0, 40, ctx.label("axis_cap"), { class: "cap" });
    line(s.axis, LX0, 110, LX1, 110, { class: "wire" });
    for (let e = 0; e <= LMAX; e += 3) {
      line(s.axis, lx(10 ** e), 105, lx(10 ** e), 115, { class: "wire" });
      text(s.axis, lx(10 ** e), 132, ["1 ", "1 k", "1 M", "1 G", "1 T", "1 P", "1 E", "1 Z"][e / 3] + "H/s", { class: "tt dim", "font-size": 10, "text-anchor": "middle" });
    }
    PRESETS.forEach(([name, h], i) => {
      const x = lx(h), up = i % 2 === 0;
      line(s.axis, x, 110, x, up ? 78 : 146, { class: "wire" });
      text(s.axis, x, up ? 72 : 160, name, { class: "tt muted", "font-size": 10.5, "text-anchor": "middle" });
    });
    s.netMark = g(s.axis);
    s.netLine = line(s.netMark, 0, 92, 0, 128, { class: "wire hot" });
    s.netText = text(s.netMark, 0, 84, "", { class: "tt hot", "font-size": 11, "text-anchor": "end" });
    s.you = circle(s.axis, 0, 110, 7, { class: "hot glow" });
    s.gap = text(s.axis, 400, 190, "", { class: "tt", "font-size": 13, "text-anchor": "middle" });
    set(s.axis, { o: 0 });

    // formula (step 2)
    s.formula = g(svg);
    s.fYou = text(s.formula, 150, 250, "", { class: "tt hot", "font-size": 16, "text-anchor": "middle" });
    text(s.formula, 270, 250, "÷", { "font-size": 22, "text-anchor": "middle" });
    s.fNet = text(s.formula, 390, 250, "", { class: "tt", "font-size": 16, "text-anchor": "middle" });
    text(s.formula, 510, 250, "=", { "font-size": 22, "text-anchor": "middle" });
    s.fP = text(s.formula, 650, 250, "", { class: "tt ok", "font-size": 16, "text-anchor": "middle" });
    text(s.formula, 150, 274, ctx.label("f_you"), { class: "cap", "text-anchor": "middle" });
    text(s.formula, 390, 274, ctx.label("f_net"), { class: "cap", "text-anchor": "middle" });
    text(s.formula, 650, 274, ctx.label("f_block"), { class: "cap", "text-anchor": "middle" });
    set(s.formula, { o: 0 });

    // results (step 3)
    s.results = g(svg);
    s.r = [0, 1, 2].map((i) => {
      const x = 140 + i * 260;
      const v = text(s.results, x, 360, "", { class: "big hot", "font-size": 30, "text-anchor": "middle" });
      text(s.results, x, 386, ctx.label(["r_day", "r_year", "r_wait"][i]), { class: "cap", "text-anchor": "middle" });
      return v;
    });
    set(s.results, { o: 0 });

    // preset buttons
    const bar = html("div", { className: "seg" });
    PRESETS.forEach(([name, h]) => {
      const b = html("button", { type: "button", className: "btn" + (h === m.h ? " on" : ""), textContent: name }, bar);
      b.addEventListener("click", () => {
        m.h = h;
        bar.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
        s.calc();
        pulse(s.you, { scale: 1.6 });
      });
    });
    ctx.controls.append(bar);

    s.calc = () => {
      const n = ctx.net, o = odds(m.h, n);
      set(s.netMark, { x: lx(n.hashrate) });
      s.netText.textContent = ctx.label("network") + " " + hashrate(n.hashrate);
      s.you.setAttribute("cx", lx(m.h));
      const orders = Math.log10(n.hashrate / m.h);
      s.gap.textContent = ctx.label("gap", { x: compact(n.hashrate / m.h) });
      s.fYou.textContent = hashrate(m.h);
      s.fNet.textContent = hashrate(n.hashrate);
      s.fP.textContent = oneIn(o.p);
      s.r[0].textContent = oneIn(o.day);
      s.r[1].textContent = oneIn(o.year);
      s.r[2].textContent = duration(o.wait);
      s.o = o;
      ctx.setVars({
        myHash: hashrate(m.h),
        pBlock: oneIn(o.p),
        pDay: oneIn(o.day),
        pYear: oneIn(o.year),
        wait: duration(o.wait),
        evDay: btc(o.evDay),
        evYear: btc(o.evDay * 365),
        orders: num(orders, 0),
      });
    };
    s.calc();
    ctx.onNet(() => s.calc());
    return s;
  },

  steps: [
    // 1. One draw per block
    async (s, ctx) => {
      await to(s.axis, { o: 1 }, { animate: ctx.animate, dur: 500 });
      await pulse(s.you, { animate: ctx.animate, scale: 1.8 });
      await pulse(s.netLine, { animate: ctx.animate, scale: 1.3 });
    },
    // 2. Do the math
    async (s, ctx) => {
      await to(s.formula, { o: 1 }, { animate: ctx.animate, dur: 500 });
      await pulse(s.fP, { animate: ctx.animate, scale: 1.15 });
    },
    // 3. Per day, per year, on average
    async (s, ctx) => {
      await to(s.results, { o: 1 }, { animate: ctx.animate, dur: 500 });
      for (const v of s.r) await pulse(v, { animate: ctx.animate, scale: 1.1, dur: 380 });
    },
    // 4. The lottery has no memory
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      [s.formula, s.results].forEach((n) => set(n, { o: 0 }));
      const grp = g(s.svg);
      text(grp, 60, 222, ctx.label("today"), { class: "cap" });
      const dots = [];
      for (let i = 0; i < BLOCKS_DAY; i++) {
        const d = rect(grp, 60 + (i % 24) * 29, 236 + Math.floor(i / 24) * 29, 20, 20, { rx: 4, class: "box" });
        dots.push(d);
      }
      const tally = text(grp, 60, 425, "", { class: "tt muted", "font-size": 13 });
      s.memGrp = grp;
      if (!ctx.animate || ctx.reduced) {
        dots.forEach((d) => d.setAttribute("class", "box bad"));
        tally.textContent = ctx.label("tally", { n: BLOCKS_DAY });
        return;
      }
      for (let i = 0; i < BLOCKS_DAY; i++) {
        dots[i].setAttribute("class", "box bad");
        tally.textContent = ctx.label("tally", { n: i + 1 });
        await ctx.wait(18);
      }
      await pulse(tally, A);
    },
    // 5. Expected value
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      if (s.memGrp) set(s.memGrp, { o: 0 });
      const grp = g(s.svg);
      const ev = text(grp, 400, 290, "", { class: "big hot", "font-size": 44, "text-anchor": "middle" });
      text(grp, 400, 318, ctx.label("ev_day"), { class: "cap", "text-anchor": "middle" });
      const ey = text(grp, 400, 380, "", { class: "tt", "font-size": 18, "text-anchor": "middle" });
      text(grp, 400, 404, ctx.label("ev_year"), { class: "cap", "text-anchor": "middle" });
      const show = () => {
        ev.textContent = btc(s.o.evDay);
        ey.textContent = btc(s.o.evDay * 365);
      };
      show();
      ctx.onNet(show);
      s.controlsEv = show;
      ctx.controls.addEventListener("click", () => setTimeout(show));
      set(grp, { o: 0 });
      await to(grp, { o: 1 }, { ...A, dur: 500 });
      await pulse(ev, { ...A, scale: 1.1 });
    },
  ],
};
