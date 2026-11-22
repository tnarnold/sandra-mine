// Lesson 4: nonce and target. A real (toy-difficulty) miner runs in the browser:
// it hashes the genesis header with a changing nonce, using real double SHA-256.
import { g, rect, text, line, circle, el, html, to, set, pulse } from "../svg.js";
import { sha256d, fromHex, displayHex, GENESIS_HEADER } from "../sha256.js";
import { num, compact, duration, hashrate } from "../fmt.js";

// Ruler: leading zero bits of the hash, 0..40, mapped to x.
const RX0 = 60, RX1 = 740, RY = 250, MAXBITS = 40;
const rx = (bits) => RX0 + (Math.min(bits, MAXBITS) / MAXBITS) * (RX1 - RX0);

// The header we mine: block 0 with a different timestamp, so we never "find" the real block.
const HEADER = fromHex(GENESIS_HEADER);
HEADER[68] ^= 0x55;
const dv = new DataView(HEADER.buffer);

function hashAt(nonce) {
  dv.setUint32(76, nonce, true);
  return sha256d(HEADER);
}
/** Leading zero bits of the hash as displayed (byte-reversed). */
function zeroBits(h) {
  let n = 0;
  for (let i = 31; i >= 0; i--) {
    if (h[i] === 0) { n += 8; continue; }
    return n + Math.clz32(h[i]) - 24;
  }
  return n;
}
/** Writes a hash into a <text>, leading zeros in orange. */
function paintHash(node, hex) {
  const z = hex.match(/^0*/)[0].length;
  node.replaceChildren();
  el(node, "tspan", { class: "hot" }, hex.slice(0, z));
  el(node, "tspan", {}, hex.slice(z));
}

export default {
  build(svg, ctx) {
    const s = { svg, nonce: 0 };
    // header strip: nonce field highlighted
    text(svg, 40, 30, ctx.label("header"), { class: "cap" });
    const fields = [["version", 4], ["prev", 32], ["merkle", 32], ["time", 4], ["bits", 4], ["nonce", 4]];
    let x = 40;
    for (const [k, b] of fields) {
      const w = k === "nonce" ? 150 : (b * 570) / 76;
      rect(svg, x, 42, w, 44, { class: k === "nonce" ? "box ok" : "box" });
      if (k === "merkle") s.merkleBox = rect(svg, x, 42, w, 44, { class: "box", fill: "none" });
      if (k === "merkle") text(svg, x + w / 2, 69, ctx.label("merkle"), { class: "cap", "text-anchor": "middle" });
      if (k === "prev") text(svg, x + w / 2, 69, ctx.label("prev"), { class: "cap", "text-anchor": "middle" });
      if (k === "nonce") s.nonceText = text(svg, x + w / 2, 70, "0", { class: "tt ok", "font-size": 18, "text-anchor": "middle" });
      x += w;
    }
    text(svg, 685, 100, "nonce", { class: "cap", "text-anchor": "middle" });
    // hash line
    text(svg, 40, 128, "SHA-256d →", { class: "tt hot", "font-size": 13 });
    s.hashText = text(svg, 128, 128, "", { class: "tt", "font-size": 13 });

    // ruler of leading zero bits
    s.ruler = g(svg);
    line(s.ruler, RX0, RY, RX1, RY, { class: "wire" });
    for (let b = 0; b <= MAXBITS; b += 4) {
      line(s.ruler, rx(b), RY - 5, rx(b), RY + 5, { class: "wire" });
      text(s.ruler, rx(b), RY + 22, b, { class: "tt dim", "font-size": 11, "text-anchor": "middle" });
    }
    text(s.ruler, RX0, RY + 44, ctx.label("ruler"), { class: "cap" });
    s.netArrow = text(s.ruler, RX1, RY - 86, "", { class: "tt muted", "font-size": 11, "text-anchor": "end" });
    s.target = g(s.ruler);
    s.targetLine = line(s.target, 0, RY - 78, 0, RY + 8, { class: "wire hot" });
    s.targetText = text(s.target, 6, RY - 68, "", { class: "tt hot", "font-size": 11 });
    s.dots = g(s.ruler);
    set(s.ruler, { o: 0 });
    const showNet = (n) => {
      const bits = Math.log2(n.difficulty) + 32;
      s.netBits = bits;
      s.netArrow.textContent = ctx.label("net_bits", { bits: num(bits, 0) }) + " →";
    };
    showNet(ctx.net);
    ctx.onNet(showNet);

    // stats (step 3)
    s.stats = g(svg);
    s.statLines = [0, 1, 2, 3].map((i) => text(s.stats, 60 + (i % 2) * 360, 340 + Math.floor(i / 2) * 30, "", { class: "tt", "font-size": 13 }));
    s.found = text(s.stats, 60, 410, "", { class: "tt ok", "font-size": 12 });
    s.found2 = text(s.stats, 60, 430, "", { class: "tt ok", "font-size": 12 });
    set(s.stats, { o: 0 });

    s.setTarget = (bits) => {
      s.targetBits = bits;
      set(s.target, { x: rx(bits) });
      s.targetText.textContent = ctx.label("target_zeros", { n: bits / 4 });
    };
    s.setTarget(16);
    s.tryOne = (plot = true) => {
      const h = hashAt(s.nonce);
      const z = zeroBits(h);
      s.nonceText.textContent = num(s.nonce);
      paintHash(s.hashText, displayHex(h));
      if (plot) s.plot(z);
      s.nonce = (s.nonce + 1) >>> 0;
      return z;
    };
    s.nDots = 0;
    s.plot = (z) => {
      const ok = z >= s.targetBits;
      // spread dots over the band above the ruler so the common (few-zero) hashes don't blur together
      const dy = 12 + ((s.nDots * 37) % 61);
      const dx = (((s.nDots * 13) % 17) - 8) * 1.4;
      if (s.dots.childNodes.length > 120) s.dots.firstChild.remove();
      circle(s.dots, rx(z) + dx, RY - dy, ok ? 5 : 2.5, { fill: ok ? "#4ade80" : "rgba(255,255,255,.28)" });
      s.nDots++;
    };
    s.tryOne(false);
    return s;
  },

  steps: [
    // 1. The one field that changes
    async (s, ctx) => {
      if (!ctx.animate) return;
      await pulse(s.nonceText, { scale: 1.3 });
      ctx.every(420, () => s.tryOne(false));
    },

    // 2. A hash is a number; the target is a limit
    async (s, ctx) => {
      await to(s.ruler, { o: 1 }, { animate: ctx.animate, dur: 500 });
      if (!ctx.animate) return;
      ctx.every(140, () => s.tryOne(true));
    },

    // 3. Mine it yourself
    async (s, ctx) => {
      const m = ctx.memo;
      if (m.zeros == null) m.zeros = 4;
      s.setTarget(m.zeros * 4);
      set(s.stats, { o: 1 });
      let tries = 0, foundN = 0, best = 0, running = ctx.animate;
      const t0 = performance.now();
      let rate = 0;
      const render = () => {
        s.statLines[0].textContent = ctx.label("tries", { n: num(tries) });
        s.statLines[1].textContent = ctx.label("speed", { v: hashrate(rate) });
        s.statLines[2].textContent = ctx.label("best", { n: num(best) });
        s.statLines[3].textContent = ctx.label("found", { n: num(foundN), e: compact(16 ** m.zeros) });
      };
      // controls: difficulty in hex zeros, pause/resume
      const bar = html("div", { className: "seg" });
      for (let z = 1; z <= 6; z++) {
        const b = html("button", { type: "button", className: "btn" + (z === m.zeros ? " on" : ""), textContent: "0".repeat(z) }, bar);
        b.title = ctx.label("zeros_n", { n: z });
        b.addEventListener("click", () => {
          m.zeros = z;
          s.setTarget(z * 4);
          bar.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
          tries = foundN = best = 0;
          s.found.textContent = s.found2.textContent = "";
          render();
        });
      }
      const toggle = html("button", { type: "button", className: "btn primary", textContent: ctx.label(running ? "pause" : "mine") });
      toggle.addEventListener("click", () => {
        running = !running;
        toggle.textContent = ctx.label(running ? "pause" : "mine");
      });
      ctx.controls.append(bar, toggle);
      render();
      if (!ctx.animate) return;
      let sinceRate = 0, triesAtRate = 0, lastRate = t0;
      ctx.loop(() => {
        if (!running) return;
        const start = performance.now();
        let shown = 0;
        while (performance.now() - start < 9) {
          const h = hashAt(s.nonce);
          const z = zeroBits(h);
          tries++;
          if (z > best) best = z;
          if (z >= s.targetBits) {
            foundN++;
            s.found2.textContent = s.found.textContent;
            s.found.textContent = `✓ nonce ${num(s.nonce)} → ${displayHex(h).slice(0, 24)}…`;
            s.plot(z);
          } else if (shown++ < 1) s.plot(z);
          s.nonce = (s.nonce + 1) >>> 0;
        }
        s.nonceText.textContent = num(s.nonce);
        paintHash(s.hashText, displayHex(hashAt(s.nonce)));
        const now = performance.now();
        if (now - lastRate > 500) {
          rate = (tries - triesAtRate) / ((now - lastRate) / 1000);
          triesAtRate = tries;
          lastRate = now;
          ctx.setVars({ myRate: hashrate(rate) });
        }
        if (++sinceRate % 6 === 0) render();
      });
    },

    // 4. Each extra zero = 16x more work
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      ctx.controls.replaceChildren();
      set(s.stats, { o: 0 });
      set(s.ruler, { o: 0.15 });
      s.bars = g(s.svg);
      const base = 430, maxH = 230;
      for (let z = 1; z <= 8; z++) {
        const h = (z / 8) * maxH;
        const x = 70 + (z - 1) * 70;
        const bar = rect(s.bars, x, base - h, 46, h, { class: z === 8 ? "box hot" : "box", rx: 4 });
        text(s.bars, x + 23, base - h - 8, compact(16 ** z), { class: "tt", "font-size": 12, "text-anchor": "middle" });
        text(s.bars, x + 23, base + 16, "0".repeat(z), { class: "tt hot", "font-size": z > 6 ? 8 : 10, "text-anchor": "middle" });
        set(bar, { o: 0 });
        to(bar, { o: 1 }, { ...A, dur: 300, delay: z * 90 });
      }
      text(s.bars, 70, 176, ctx.label("bars_cap"), { class: "cap" });
      // the real network, way off the chart
      const net = text(s.bars, 640, 210, "", { class: "tt ok", "font-size": 13 });
      const net2 = text(s.bars, 640, 232, "", { class: "tt muted", "font-size": 12 });
      const showNet = (n) => {
        const hexZeros = Math.floor((Math.log2(n.difficulty) + 32) / 4);
        net.textContent = ctx.label("net_zeros", { n: hexZeros });
        net2.textContent = ctx.label("net_tries", { n: compact(n.difficulty * 2 ** 32) });
      };
      showNet(ctx.net);
      ctx.onNet(showNet);
      await ctx.wait(1000);
      await pulse(net, A);
    },

    // 5. When the nonces run out
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      if (s.bars) set(s.bars, { o: 0 });
      set(s.ruler, { o: 0 });
      const grp = g(s.svg);
      text(grp, 40, 190, ctx.label("space"), { class: "cap" });
      rect(grp, 40, 202, 720, 26, { rx: 4, class: "box" });
      const fill = rect(grp, 40, 202, 720, 26, { rx: 4, fill: "#ff5a1f" });
      set(fill, { o: 0.85 });
      fill.style.transformOrigin = "left center";
      const sweep = text(grp, 40, 254, "", { class: "tt muted", "font-size": 12 });
      const xn = text(grp, 40, 300, "", { class: "tt", "font-size": 14 });
      const showSweep = (n) => {
        const t = duration(2 ** 32 / n.hashrate);
        sweep.textContent = ctx.label("sweep", { t });
      };
      showSweep(ctx.net);
      ctx.onNet(showSweep);
      const rounds = ctx.animate && !ctx.reduced ? 4 : 1;
      for (let r = 1; r <= rounds; r++) {
        fill.style.transform = "scaleX(0)";
        if (ctx.animate && !ctx.reduced) {
          await fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 700, easing: "linear" }).finished.catch(() => {});
        }
        fill.style.transform = "scaleX(1)";
        xn.textContent = ctx.label("extranonce", { n: r });
        s.merkleBox.setAttribute("class", "box hot");
        s.merkleBox.setAttribute("fill", "none");
        await pulse(s.merkleBox, { ...A, scale: 1.05, dur: 300 });
        s.nonce = 0;
        s.tryOne(false);
        await ctx.wait(250);
      }
    },
  ],
};
