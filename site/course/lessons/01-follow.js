// Lesson 1: follow one transaction from the wallet to the chain. The thread for the
// whole course: later lessons zoom into one part of this path.
import { g, rect, text, circle, line, to, set, pulse } from "../svg.js";

// Deterministic "random" so the scene looks the same on every rebuild.
const rnd = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const feeColor = (f) => {
  const a = [58, 58, 64], b = [255, 90, 31];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * f)).join(",")})`;
};

const NODES = [[215, 150], [255, 72], [335, 40], [415, 82], [300, 135], [385, 165], [455, 130]];
const LINKS = [[0, 1], [0, 4], [1, 2], [1, 4], [2, 3], [3, 4], [3, 6], [4, 5], [5, 6]];
const ORDER = [[0], [1, 4], [2, 3, 5], [6]]; // gossip waves starting at node 0
const COLS = 9, ROWS = 5, MINE = 22;        // mempool grid; MINE is our transaction's slot
const slot = (i) => ({ x: 258 + (i % COLS) * 26, y: 268 + Math.floor(i / COLS) * 30 });
const bslot = (i) => ({ x: 554 + (i % 4) * 26, y: 250 + Math.floor(i / 4) * 28 });

export default {
  build(svg, ctx) {
    const s = {};
    // wallet
    s.wallet = g(svg);
    rect(s.wallet, 28, 190, 92, 72, { rx: 10, class: "box" });
    rect(s.wallet, 92, 214, 28, 24, { rx: 6, class: "box hot" });
    circle(s.wallet, 104, 226, 4, { class: "hot" });
    text(s.wallet, 74, 285, ctx.label("wallet"), { class: "cap", "text-anchor": "middle" });

    // network of nodes
    s.wires = LINKS.map(([a, b]) => line(svg, ...NODES[a], ...NODES[b], { class: "wire" }));
    s.nodes = NODES.map(([x, y]) => circle(svg, x, y, 9, { class: "box" }));
    text(svg, 335, 200, ctx.label("nodes"), { class: "cap", "text-anchor": "middle" });

    // candidate block (drawn before the mempool so transactions moving into it stay on top)
    s.block = g(svg);
    rect(s.block, 540, 236, 120, 160, { rx: 8, class: "box" });
    text(s.block, 540, 226, ctx.label("candidate"), { class: "cap" });
    s.coinbase = rect(s.block, bslot(0).x, bslot(0).y, 16, 16, { rx: 3, fill: "#f7931a" });
    set(s.coinbase, { o: 0 });

    // mempool with other people's transactions, colored by fee
    rect(svg, 240, 252, 252, 168, { rx: 10, class: "box", "stroke-dasharray": "6 6" });
    text(svg, 250, 242, ctx.label("mempool"), { class: "cap" });
    s.fees = [];
    s.squares = [];
    for (let i = 0; i < COLS * ROWS; i++) {
      const p = slot(i);
      const f = i === MINE ? 0.8 : rnd(i) ** 1.6;
      s.fees.push(f);
      const sq = rect(svg, p.x, p.y, 16, 16, { rx: 3, fill: feeColor(f) });
      if (i === MINE) sq.setAttribute("stroke", "#fff"), sq.setAttribute("stroke-width", 2.5);
      s.squares.push(sq);
      set(sq, { o: i === MINE ? 0 : 1 });
    }
    text(svg, 366, 440, ctx.label("fee_legend"), { class: "cap", "text-anchor": "middle" });

    s.nonce = text(svg, 540, 420, "", { class: "tt muted", "font-size": 12 });
    s.hash = text(svg, 540, 442, "", { class: "tt", "font-size": 12 });

    // chain (top right)
    s.chain = [0, 1, 2].map((i) => {
      const b = g(svg);
      rect(b, 470 + i * 80, 26, 60, 44, { rx: 6, class: "box" });
      if (i) line(svg, 470 + i * 80 - 20, 48, 470 + i * 80, 48, { class: "wire" });
      b.label = text(b, 500 + i * 80, 53, "", { class: "tt dim", "font-size": 11, "text-anchor": "middle" });
      return b;
    });
    s.link = line(svg, 690, 48, 710, 48, { class: "wire hot" });
    s.newBlock = g(svg);
    rect(s.newBlock, 710, 26, 60, 44, { rx: 6, class: "box ok" });
    s.newLabel = text(s.newBlock, 740, 53, "", { class: "tt ok", "font-size": 11, "text-anchor": "middle" });
    set(s.link, { o: 0 });
    set(s.newBlock, { o: 0 });
    s.conf = text(svg, 770, 96, "", { class: "tt ok", "font-size": 12, "text-anchor": "end" });
    const heights = (n) => {
      s.chain.forEach((b, i) => (b.label.textContent = "#" + (n.height - 2 + i).toLocaleString()));
      s.newLabel.textContent = "#" + (n.height + 1).toLocaleString();
    };
    heights(ctx.net);
    ctx.onNet(heights);

    // our transaction, as a card leaving the wallet
    s.tx = g(svg);
    rect(s.tx, -78, -22, 156, 44, { rx: 7, class: "box hot glow" });
    text(s.tx, 0, -3, ctx.label("tx_line1"), { "text-anchor": "middle", "font-size": 13, "font-weight": 600 });
    text(s.tx, 0, 14, ctx.label("tx_line2"), { class: "tt muted", "text-anchor": "middle", "font-size": 10.5 });
    set(s.tx, { x: 74, y: 226, o: 0, s: 0.4 });
    return s;
  },

  steps: [
    // 1. You press send
    async (s, ctx) => {
      await to(s.tx, { x: 120, y: 150, o: 1, s: 1 }, { animate: ctx.animate, dur: 800 });
      await pulse(s.tx, { animate: ctx.animate });
    },

    // 2. The news spreads (gossip)
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      await to(s.tx, { x: 215, y: 150, s: 0.35, o: 0 }, { ...A, dur: 600 });
      for (const wave of ORDER) {
        wave.forEach((n) => to(s.nodes[n], { fill: "#ff5a1f", stroke: "#ff8a3d" }, { ...A, dur: 300 }));
        LINKS.forEach(([a, b], i) => {
          if (wave.includes(a) || wave.includes(b)) to(s.wires[i], { stroke: "#ff5a1f" }, { ...A, dur: 300 });
        });
        wave.forEach((n) => pulse(s.nodes[n], { ...A, scale: 1.6 }));
        await ctx.wait(380);
      }
    },

    // 3. The waiting room (mempool)
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      await to(s.squares[MINE], { o: 1 }, { ...A, dur: 500 });
      await pulse(s.squares[MINE], { ...A, scale: 1.8, dur: 700 });
    },

    // 4. A miner builds a candidate block: the best fees first
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      await to(s.coinbase, { o: 1 }, { ...A, dur: 400 });
      const picked = s.fees
        .map((f, i) => [f, i])
        .sort((a, b) => b[0] - a[0])
        .slice(0, 19)
        .map(([, i]) => i);
      s.picked = picked;
      picked.forEach((i, k) => {
        const from = slot(i), dst = bslot(k + 1);
        to(s.squares[i], { x: dst.x - from.x, y: dst.y - from.y }, { ...A, dur: 700, delay: k * 45 });
      });
      await ctx.wait(700 + picked.length * 45);
      await pulse(s.squares[MINE], { ...A, scale: 1.6 });
    },

    // 5. The lottery: hash, hash, hash...
    async (s, ctx) => {
      const hex = (seed) => Array.from({ length: 16 }, (_, i) => Math.floor(rnd(seed * 31 + i) * 16).toString(16)).join("");
      const win = "0000000000000000000" + hex(7).slice(0, 5) + "…";
      const show = (n, h, ok) => {
        s.nonce.textContent = `${ctx.label("nonce")}: ${n.toLocaleString()}`;
        s.hash.textContent = `${ctx.label("hash")}: ${h}`;
        s.hash.setAttribute("class", "tt " + (ok ? "ok" : "bad"));
      };
      if (!ctx.animate || ctx.reduced) return show(2083236893, win, true);
      let n = 2083236000, frames = 0;
      await new Promise((res) => {
        ctx.every(55, () => {
          n += 37 + Math.floor(rnd(n) * 90);
          if (++frames > 36) { show(2083236893, win, true); res(); }
          else show(n, hex(n) + hex(n + 1).slice(0, 8) + "…", false);
        });
      });
      await pulse(s.block, { scale: 1.04 });
    },

    // 6. Into the chain, then confirmations pile up
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      to(s.block, { o: 0.25 }, { ...A, dur: 500 });
      (s.picked || []).forEach((i) => to(s.squares[i], { o: 0.25 }, { ...A, dur: 500 }));
      set(s.newBlock, { x: -140, y: 250, s: 1.8, o: 0 });
      await to(s.newBlock, { x: 0, y: 0, s: 1, o: 1 }, { ...A, dur: 900 });
      await to(s.link, { o: 1 }, { ...A, dur: 300 });
      for (let c = 1; c <= 6; c++) {
        s.conf.textContent = ctx.label(c === 1 ? "conf_one" : "conf_many", { n: c });
        if (c < 6) await ctx.wait(c === 1 ? 900 : 450);
      }
      await pulse(s.conf, A);
    },
  ],
};
