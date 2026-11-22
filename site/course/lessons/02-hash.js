// Lesson 2: what a hash is. Everything here is a real SHA-256, computed in the browser.
import { g, rect, text, circle, line, el, html, to, set, pulse, short } from "../svg.js";
import { sha256, sha256d, utf8, toHex, displayHex, fromHex, bitDiff, GENESIS_HEADER } from "../sha256.js";

const CELL = 12;
const GRID_Y = 262;
const GRIDS = { a: 40, b: 270, d: 500 };

function bitGrid(svg, x0) {
  const grp = g(svg);
  const cells = [];
  for (let i = 0; i < 256; i++) {
    cells.push(rect(grp, x0 + (i % 16) * CELL, GRID_Y + Math.floor(i / 16) * CELL, CELL - 1.5, CELL - 1.5, { rx: 1.5, fill: "#1d1d20" }));
  }
  grp.cells = cells;
  return grp;
}
const bitAt = (bytes, i) => (bytes[i >> 3] >> (7 - (i & 7))) & 1;
function paintBits(grid, bytes, on = "#d8d8d8") {
  grid.cells.forEach((c, i) => c.setAttribute("fill", bitAt(bytes, i) ? on : "#1d1d20"));
}
function paintDiff(grid, a, b) {
  grid.cells.forEach((c, i) => c.setAttribute("fill", bitAt(a, i) !== bitAt(b, i) ? "#ff5a1f" : "#1d1d20"));
}

/** One "input → SHA-256 → output" row. */
function hashRow(svg, y, ctx) {
  const r = g(svg);
  rect(r, 30, y, 300, 64, { rx: 8, class: "box" });
  r.input = text(r, 46, y + 38, "", { class: "tt", "font-size": 15 });
  r.inputCap = text(r, 30, y - 8, ctx.label("input"), { class: "cap" });
  line(r, 330, y + 32, 352, y + 32, { class: "wire hot" });
  r.machine = g(r);
  rect(r.machine, 352, y + 4, 118, 56, { rx: 8, class: "box hot" });
  r.machineText = text(r.machine, 411, y + 41, "SHA-256", { class: "hot", "text-anchor": "middle", "font-size": 20, "font-weight": 700 });
  line(r, 470, y + 32, 492, y + 32, { class: "wire hot" });
  r.out1 = text(r, 500, y + 26, "", { class: "tt", "font-size": 14.5 });
  r.out2 = text(r, 500, y + 48, "", { class: "tt", "font-size": 14.5 });
  r.outCap = text(r, 500, y - 8, ctx.label("output"), { class: "cap" });
  r.dot = circle(r, 330, y + 32, 6, { class: "hot glow" });
  set(r.dot, { o: 0 });
  return r;
}
function showHash(row, hex) {
  row.out1.textContent = hex.slice(0, 32);
  row.out2.textContent = hex.slice(32);
}
/** Sends a dot through the machine and "types" the hash out. */
async function flow(row, hex, ctx) {
  if (!ctx.animate || ctx.reduced) return showHash(row, hex);
  showHash(row, "");
  set(row.dot, { x: 0, o: 1 });
  await to(row.dot, { x: 162 }, { dur: 520, ease: "ease-in-out" });
  set(row.dot, { o: 0 });
  pulse(row.machine, { scale: 1.06 });
  for (let n = 4; n <= 64; n += 4) {
    showHash(row, hex.slice(0, n));
    await ctx.wait(22);
  }
}
const clip = (s, n = 26) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
/** Same text with one character changed (the next character in Unicode). */
function oneOff(s, idx) {
  if (!s) return "a";
  const i = idx % s.length;
  return s.slice(0, i) + String.fromCharCode(s.charCodeAt(i) + 1) + s.slice(i + 1);
}

export default {
  build(svg, ctx) {
    const m = ctx.memo;
    if (m.text == null) m.text = ctx.label("sample");
    if (m.idx == null) m.idx = Math.max(0, m.text.length - 1);
    const s = { m };
    s.a = hashRow(svg, 40, ctx);
    s.b = hashRow(svg, 150, ctx);
    s.b.inputCap.textContent = ctx.label("input_b");
    s.b.outCap.textContent = ctx.label("output_b");
    set(s.b, { o: 0 });

    s.gridA = bitGrid(svg, GRIDS.a);
    s.capA = text(svg, GRIDS.a, GRID_Y - 12, ctx.label("bits_a"), { class: "cap" });
    s.gridB = bitGrid(svg, GRIDS.b);
    s.capB = text(svg, GRIDS.b, GRID_Y - 12, ctx.label("bits_b"), { class: "cap" });
    s.gridD = bitGrid(svg, GRIDS.d);
    s.capD = text(svg, GRIDS.d, GRID_Y - 12, ctx.label("bits_diff"), { class: "cap" });
    s.count = text(svg, 745, GRID_Y + 90, "", { class: "big hot", "text-anchor": "middle" });
    s.countCap = text(svg, 745, GRID_Y + 112, ctx.label("of_256"), { class: "cap", "text-anchor": "middle" });
    s.side = [s.gridB, s.capB, s.gridD, s.capD, s.count, s.countCap];
    s.side.forEach((n) => set(n, { o: 0 }));
    s.lenNote = text(svg, 30, 128, "", { class: "tt dim", "font-size": 12 });
    s.same = text(svg, 770, 136, "", { class: "tt ok", "font-size": 13, "text-anchor": "end" });

    // The input box: typing re-hashes instantly.
    const input = html("input");
    input.type = "text";
    input.value = m.text;
    input.maxLength = 200;
    input.setAttribute("aria-label", ctx.label("type_here"));
    input.placeholder = ctx.label("type_here");
    ctx.controls.append(input);
    s.inputEl = input;

    s.update = () => {
      const a = sha256(utf8(m.text));
      s.a.input.textContent = clip(m.text) || " ";
      showHash(s.a, toHex(a));
      paintBits(s.gridA, a);
      s.lenNote.textContent = ctx.label("sizes", { n: utf8(m.text).length });
      const bText = oneOff(m.text, m.idx);
      const b = sha256(utf8(bText));
      s.b.input.textContent = clip(bText);
      showHash(s.b, toHex(b));
      paintBits(s.gridB, b);
      paintDiff(s.gridD, a, b);
      s.count.textContent = bitDiff(a, b);
      s.hashA = toHex(a);
      s.hashB = toHex(b);
      if (s.onUpdate) s.onUpdate();
    };
    input.addEventListener("input", () => {
      m.text = input.value;
      s.same.textContent = "";
      s.update();
    });
    s.update();
    return s;
  },

  steps: [
    // 1. A fingerprint
    async (s, ctx) => {
      await flow(s.a, s.hashA, ctx);
    },

    // 2. Always the same size
    async (s, ctx) => {
      await pulse(s.lenNote, { animate: ctx.animate, scale: 1.08 });
      await pulse(s.gridA, { animate: ctx.animate, scale: 1.04 });
    },

    // 3. Same input, same output
    async (s, ctx) => {
      s.same.textContent = "";
      await flow(s.a, s.hashA, ctx);
      await ctx.wait(250);
      await flow(s.a, s.hashA, ctx);
      s.same.textContent = "✓ " + ctx.label("identical");
      await pulse(s.same, { animate: ctx.animate });
    },

    // 4. Change one letter: avalanche
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      s.same.textContent = "";
      s.onUpdate = () => ctx.setVars({ flipped: s.count.textContent });
      s.onUpdate();
      set(s.lenNote, { o: 0 });
      to(s.b, { o: 1 }, { ...A, dur: 400 });
      await flow(s.b, s.hashB, ctx);
      for (const n of s.side) await to(n, { o: 1 }, { ...A, dur: 260 });
      await pulse(s.count, { ...A, scale: 1.25 });
      const btn = html("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = ctx.label("change_letter");
      btn.addEventListener("click", () => {
        s.m.idx = (s.m.idx + 1 + Math.floor(Math.random() * 5)) % Math.max(1, s.m.text.length);
        s.update();
        pulse(s.count, { scale: 1.25 });
      });
      ctx.controls.append(btn);
    },

    // 5. No way back; Bitcoin hashes twice
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      ctx.controls.replaceChildren();
      s.onUpdate = null;
      [s.b, ...s.side, s.lenNote, s.same].forEach((n) => set(n, { o: 0 }));
      const head = fromHex(GENESIS_HEADER);
      const hash = sha256d(head);
      const hex = displayHex(hash);
      const lead = hex.match(/^0*/)[0].length;
      ctx.setVars({ zeros: lead, zeroBits: lead * 4 });
      s.a.inputCap.textContent = ctx.label("genesis_cap");
      s.a.input.textContent = short(GENESIS_HEADER, 12, 8);
      s.a.machineText.textContent = "SHA-256 ×2";
      s.a.machineText.setAttribute("font-size", 16);
      s.a.outCap.textContent = ctx.label("genesis_out");
      // Reverse a copy so the grid shows bits in the same order as the displayed hex.
      const shown = Uint8Array.from(hash).reverse();
      paintBits(s.gridA, shown);
      s.capA.textContent = ctx.label("genesis_bits");
      await flow(s.a, hex, ctx);
      // Highlight the leading zeros, in the hex and in the grid.
      const zeros = hex.match(/^0*/)[0].length;
      for (const [node, part] of [[s.a.out1, hex.slice(0, 32)], [s.a.out2, hex.slice(32)]]) {
        node.replaceChildren();
        const z = node === s.a.out1 ? Math.min(zeros, 32) : Math.max(0, zeros - 32);
        el(node, "tspan", { class: "hot" }, part.slice(0, z));
        el(node, "tspan", {}, part.slice(z));
      }
      s.gridA.cells.slice(0, zeros * 4).forEach((c) => c.setAttribute("fill", "#5a2410"));
      // A "no way back" arrow from the output to the input.
      const back = g(s.a);
      line(back, 492, 112, 330, 112, { class: "wire dash bad" });
      text(back, 411, 133, "✗ " + ctx.label("no_way_back"), { class: "bad tt", "font-size": 12, "text-anchor": "middle" });
      set(back, { o: 0 });
      await to(back, { o: 1 }, { ...A, dur: 500 });
    },
  ],
};
