// Lesson 3: the Merkle tree and the 80-byte header. Hashes are real SHA-256d.
import { g, rect, text, line, path, el, html, to, set, pulse, short } from "../svg.js";
import { sha256d, utf8, toHex } from "../sha256.js";

const LEAF_Y = 372, W = 76, H = 46;
const leafX = (i) => 40 + i * 92 + W / 2;          // centers
const LEVELS_Y = [LEAF_Y, 282, 192, 102];

// Header layout: 80 bytes, 9 px per byte.
const HX = 40, HY = 290, BYTE = 9;
const FIELDS = [["version", 4], ["prev", 32], ["merkle", 32], ["time", 4], ["bits", 4], ["nonce", 4]];

const cat = (a, b) => { const o = new Uint8Array(64); o.set(a); o.set(b, 32); return o; };

/** Builds all levels of hashes for 8 transactions; tampered leaf gets a different payload. */
function tree(tampered) {
  const leaves = Array.from({ length: 8 }, (_, i) =>
    sha256d(utf8(i === 0 ? "coinbase" : `tx ${i}` + (i === tampered ? " (changed)" : "")))
  );
  const levels = [leaves];
  while (levels.at(-1).length > 1) {
    const prev = levels.at(-1), next = [];
    for (let i = 0; i < prev.length; i += 2) next.push(sha256d(cat(prev[i], prev[i + 1])));
    levels.push(next);
  }
  return levels.map((l) => l.map(toHex));
}

function nodeBox(parent, cx, cy, title, cls = "box") {
  const n = g(parent);
  n.box = rect(n, cx - W / 2, cy - H / 2, W, H, { rx: 6, class: cls });
  n.title = text(n, cx, cy - 4, title, { "text-anchor": "middle", "font-size": 12, "font-weight": 600 });
  n.hash = text(n, cx, cy + 13, "", { class: "tt muted", "text-anchor": "middle", "font-size": 10.5 });
  return n;
}

export default {
  build(svg, ctx) {
    const s = { svg };
    s.treeG = g(svg);
    s.edges = [];
    s.nodes = [];
    // positions per level
    s.pos = [Array.from({ length: 8 }, (_, i) => leafX(i))];
    for (let l = 1; l < 4; l++) {
      const p = s.pos[l - 1];
      s.pos.push(Array.from({ length: p.length / 2 }, (_, i) => (p[2 * i] + p[2 * i + 1]) / 2));
    }
    // edges first, so boxes draw on top
    for (let l = 1; l < 4; l++) {
      s.edges[l] = [];
      s.pos[l].forEach((x, i) => {
        [2 * i, 2 * i + 1].forEach((c) => {
          const e = line(s.treeG, s.pos[l - 1][c], LEVELS_Y[l - 1] - H / 2, x, LEVELS_Y[l] + H / 2, { class: "wire" });
          e.child = c;
          s.edges[l].push(e);
          set(e, { o: 0 });
        });
      });
    }
    for (let l = 0; l < 4; l++) {
      s.nodes[l] = s.pos[l].map((x, i) => {
        const title = l === 0 ? (i === 0 ? "coinbase" : `tx ${i}`) : l === 3 ? ctx.label("root") : "hash";
        const n = nodeBox(s.treeG, x, LEVELS_Y[l], title, l === 0 && i === 0 ? "box hot" : l === 3 ? "box hot" : "box");
        set(n, { o: 0, s: 0.7 });
        return n;
      });
    }
    s.paint = (levels, mark = []) => {
      levels.forEach((lv, l) => lv.forEach((h, i) => {
        const n = s.nodes[l][i];
        n.hash.textContent = h.slice(0, 8) + "…";
        n.box.setAttribute("class", mark[l] === i ? "box bad" : (l === 0 && i === 0) || l === 3 ? "box hot" : "box");
      }));
    };
    s.levels = tree(-1);
    s.paint(s.levels);
    s.caption = text(svg, 400, 446, "", { class: "cap", "text-anchor": "middle" });
    return s;
  },

  steps: [
    // 1. Many transactions
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      s.nodes[0].forEach((n, i) => to(n, { o: 1, s: 1 }, { ...A, dur: 450, delay: i * 70 }));
      s.caption.textContent = ctx.label("cap_leaves");
      await ctx.wait(450 + 8 * 70);
    },

    // 2. In pairs
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      for (let i = 0; i < 4; i++) {
        s.edges[1].slice(2 * i, 2 * i + 2).forEach((e) => to(e, { o: 1, stroke: "#ff5a1f" }, { ...A, dur: 250 }));
        await to(s.nodes[1][i], { o: 1, s: 1 }, { ...A, dur: 380 });
        s.edges[1].slice(2 * i, 2 * i + 2).forEach((e) => to(e, { stroke: "#3a3a40" }, { ...A, dur: 400 }));
      }
      s.caption.textContent = ctx.label("cap_pairs");
    },

    // 3. Until one is left: the Merkle root
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      for (const l of [2, 3]) {
        s.edges[l].forEach((e) => to(e, { o: 1 }, { ...A, dur: 300 }));
        await Promise.all(s.nodes[l].map((n, i) => to(n, { o: 1, s: 1 }, { ...A, dur: 420, delay: i * 120 })));
      }
      s.nodes[3][0].box.classList.add("glow");
      await pulse(s.nodes[3][0], { ...A, scale: 1.15 });
      s.caption.textContent = ctx.label("cap_root");
    },

    // 4. Touch one transaction and the root changes
    async (s, ctx) => {
      const tamper = async (leaf, animate) => {
        const levels = tree(leaf);
        const mark = [leaf, leaf >> 1, leaf >> 2, 0];
        // walk up the path, one level at a time
        for (let l = 0; l < 4; l++) {
          s.paint(levels.map((lv, k) => (k <= l ? lv : s.levels[k])), mark.map((v, k) => (k <= l ? v : -1)));
          s.edges[l + 1]?.forEach((e) => {
            const up = e.child === mark[l];
            to(e, { stroke: up ? "#f87171" : "#3a3a40" }, { animate, dur: 250 });
          });
          await pulse(s.nodes[l][mark[l]], { animate, scale: 1.12, dur: 360 });
        }
        s.caption.textContent = ctx.label("cap_changed", {
          old: s.levels[3][0].slice(0, 8),
          now: levels[3][0].slice(0, 8),
        });
      };
      const m = ctx.memo;
      if (m.leaf == null) m.leaf = 5;
      await tamper(m.leaf, ctx.animate && !ctx.reduced);
      const btn = html("button");
      btn.type = "button";
      btn.className = "btn";
      btn.textContent = ctx.label("tamper");
      btn.addEventListener("click", () => {
        m.leaf = 1 + ((m.leaf + Math.floor(Math.random() * 5)) % 7);
        tamper(m.leaf, true);
      });
      ctx.controls.append(btn);
    },

    // 5. The 80-byte header
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      ctx.controls.replaceChildren();
      s.paint(s.levels);
      s.edges.flat().forEach((e) => e && set(e, { stroke: "#3a3a40" }));
      s.caption.textContent = "";
      // Shrink the tree away, keep the root.
      const root = s.nodes[3][0];
      s.nodes.flat().forEach((n) => n !== root && to(n, { o: 0 }, { ...A, dur: 400 }));
      s.edges.flat().forEach((e) => e && to(e, { o: 0 }, { ...A, dur: 400 }));
      s.header = g(s.svg);
      text(s.header, HX, HY - 30, ctx.label("header_cap"), { class: "cap" });
      let x = HX;
      s.fields = {};
      FIELDS.forEach(([key, bytes], i) => {
        const w = bytes * BYTE;
        const f = g(s.header);
        f.box = rect(f, x, HY, w, 52, { class: key === "merkle" ? "box hot" : key === "nonce" ? "box ok" : "box" });
        text(f, x + w / 2, HY + 30, bytes > 4 ? `${bytes} bytes` : "4", { class: "tt dim", "text-anchor": "middle", "font-size": 11 });
        const ly = HY + 74 + (i === 4 ? 16 : 0);
        text(f, x + w / 2, ly, ctx.label("f_" + key), { class: "cap", "text-anchor": "middle", "font-size": 10 });
        s.fields[key] = { g: f, x, w };
        set(f, { o: 0, y: 20 });
        x += w;
      });
      for (const [key] of FIELDS) await to(s.fields[key].g, { o: 1, y: 0 }, { ...A, dur: 260 });
      // the root flies into its field (moved to the end of the SVG so it draws on top)
      s.svg.appendChild(root);
      const mf = s.fields.merkle;
      const dx = mf.x + mf.w / 2 - 400, dy = HY + 26 - LEVELS_Y[3];
      await to(root, { x: dx, y: dy, s: 0.9 }, { ...A, dur: 800 });
      await pulse(root, { ...A, scale: 1.1 });
      s.root = root;
    },

    // 6. A chain of headers
    async (s, ctx) => {
      const A = { animate: ctx.animate };
      // previous block, drawn small on top
      const prev = g(s.svg);
      rect(prev, 160, 58, 300, 46, { rx: 6, class: "box" });
      text(prev, 172, 86, ctx.label("prev_block"), { "font-size": 13, "font-weight": 600 });
      const hash = sha256d(utf8("previous block header"));
      const hx = "0000000000000000000" + toHex(hash).slice(0, 4) + "…";
      const ht = text(prev, 480, 86, "= " + hx, { class: "tt ok", "font-size": 12 });
      set(prev, { o: 0, y: -20 });
      await to(prev, { o: 1, y: 0 }, { ...A, dur: 500 });
      // arrow: previous header's hash goes into this header's "prev" field
      const pf = s.fields.prev;
      const arrow = path(s.svg, `M 560 100 C 560 200, ${pf.x + pf.w / 2} 180, ${pf.x + pf.w / 2} ${HY - 4}`, { class: "wire hot", "stroke-dasharray": "6 6" });
      set(arrow, { o: 0 });
      await to(arrow, { o: 1 }, { ...A, dur: 500 });
      const into = text(s.svg, pf.x + pf.w / 2, HY + 18, short(hx.replace("…", ""), 8, 4), { class: "tt ok", "text-anchor": "middle", "font-size": 11 });
      set(into, { o: 0 });
      await to(into, { o: 1 }, { ...A, dur: 400 });
      await ctx.wait(900);
      // someone edits the old block: its hash changes and the link breaks
      prev.querySelector("rect").setAttribute("class", "box bad");
      ht.setAttribute("class", "tt bad");
      ht.textContent = "= " + toHex(sha256d(utf8("edited"))).slice(0, 12) + "…";
      arrow.setAttribute("class", "wire dash");
      arrow.style.stroke = "#f87171";
      const x = text(s.svg, 520, 200, "✗ " + ctx.label("broken"), { class: "bad tt", "font-size": 13 });
      set(x, { o: 0 });
      await to(x, { o: 1 }, { ...A, dur: 400 });
      await pulse(x, A);
    },
  ],
};
