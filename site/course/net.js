// Live network numbers from mempool.space, with offline fallbacks so lessons always work.

const API = "https://mempool.space/api";

// Rough values used until (or if) the live data arrives.
const FALLBACK = {
  height: 977000,
  difficulty: 1.5e14,
  hashrate: 1.1e21,
  mempoolCount: 30000,
  mempoolVsize: 40e6,
  feeFast: 4,
  feeHour: 2,
  retargetBlocks: 1000,
  retargetChange: 0,
  subsidy: 3.125,
  // Projected next blocks from the mempool: median fee (sat/vB) and size (vB).
  mempoolBlocks: [5, 3, 2.5, 2, 1.6, 1.3, 1.1, 1].map((medianFee) => ({ medianFee, blockVSize: 997000 })),
};

export const net = { ...FALLBACK, live: false, loaded: false };
net.halvingBlocks = 210000 - (net.height % 210000);
const listeners = new Set();
export const onNet = (fn) => (listeners.add(fn), () => listeners.delete(fn));

const get = (path) =>
  fetch(API + path, { cache: "no-store" }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

export function loadNet() {
  return Promise.allSettled([
    get("/blocks/tip/height"),
    get("/v1/mining/hashrate/3d"),
    get("/mempool"),
    get("/v1/fees/recommended"),
    get("/v1/difficulty-adjustment"),
    get("/v1/fees/mempool-blocks"),
  ]).then(([h, hr, mp, fee, adj, blocks]) => {
    const ok = (r) => r.status === "fulfilled" && r.value != null;
    if (ok(h)) net.height = h.value;
    if (ok(hr)) {
      net.difficulty = hr.value.currentDifficulty || net.difficulty;
      net.hashrate = hr.value.currentHashrate || net.hashrate;
    }
    if (ok(mp)) {
      net.mempoolCount = mp.value.count;
      net.mempoolVsize = mp.value.vsize;
    }
    if (ok(fee)) {
      net.feeFast = fee.value.fastestFee;
      net.feeHour = fee.value.hourFee;
    }
    if (ok(adj)) {
      net.retargetBlocks = adj.value.remainingBlocks;
      net.retargetChange = adj.value.difficultyChange;
    }
    if (ok(blocks) && blocks.value.length) net.mempoolBlocks = blocks.value;
    net.live = [h, hr, mp, fee, adj, blocks].some(ok);
    net.loaded = true;
    // Subsidy halves every 210,000 blocks.
    net.subsidy = 50 / 2 ** Math.floor(net.height / 210000);
    net.halvingBlocks = 210000 - (net.height % 210000);
    listeners.forEach((fn) => fn(net));
  });
}
