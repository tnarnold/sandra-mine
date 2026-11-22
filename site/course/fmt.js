// Locale-aware number formatting for lessons and text placeholders.
import { lang, t } from "./i18n/index.js";

export const num = (n, d = 0) =>
  Number(n).toLocaleString(lang(), { maximumFractionDigits: d, minimumFractionDigits: 0 });

/** 150000000000000 -> "150T" (en) / "150 tri" (pt-BR). */
export const compact = (n, d = 2) =>
  new Intl.NumberFormat(lang(), { notation: "compact", maximumFractionDigits: d }).format(n);

export function hashrate(h) {
  const u = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s"];
  let i = 0;
  while (h >= 1000 && i < u.length - 1) { h /= 1000; i++; }
  return num(h, h < 10 ? 2 : h < 100 ? 1 : 0) + " " + u[i];
}

export function duration(sec) {
  const y = sec / 31557600;
  if (y >= 1e6) return compact(y) + " " + t("ui.units.years");
  if (y >= 2) return num(y) + " " + t("ui.units.years");
  const d = sec / 86400;
  if (d >= 2) return num(d) + " " + t("ui.units.days");
  const h = sec / 3600;
  if (h >= 2) return num(h, 1) + " h";
  const m = sec / 60;
  if (m >= 1) return num(m, 1) + " min";
  if (sec >= 1) return num(sec, 1) + " s";
  // Tiny durations: the whole network sweeps the nonce space in picoseconds.
  for (const [f, u] of [[1e3, "ms"], [1e6, "µs"], [1e9, "ns"], [1e12, "ps"]]) {
    if (sec * f >= 1) return num(sec * f, sec * f < 10 ? 1 : 0) + " " + u;
  }
  return num(sec * 1e15, 1) + " fs";
}

/** "1 in 13 trillion" style odds. */
export const oneIn = (p) => (p >= 0.5 ? num(p * 100, 1) + "%" : t("ui.one_in", { n: compact(1 / p) }));

/** BTC amount with sensible precision; tiny amounts in sats. */
export function btc(v) {
  if (v >= 0.01) return num(v, 4) + " BTC";
  const sats = v * 1e8;
  if (sats >= 1) return num(sats, 0) + " sats";
  if (sats >= 1e-3) return num(sats, 4) + " sats";
  return num(sats * 1e6, 2) + " µsats";
}

/** Values every lesson text can use as {placeholders}. */
export function netVars(net) {
  const ch = net.retargetChange;
  return {
    height: num(net.height),
    difficulty: compact(net.difficulty),
    hashrate: hashrate(net.hashrate),
    mempoolCount: num(net.mempoolCount),
    mempoolMB: num(net.mempoolVsize / 1e6),
    feeFast: num(net.feeFast, 1),
    feeHour: num(net.feeHour, 1),
    subsidy: num(net.subsidy, 3),
    retargetBlocks: num(net.retargetBlocks),
    retargetChange: (ch > 0 ? "+" : "") + num(ch, 2) + "%",
    // Leading zero bits a hash needs today ≈ log2(difficulty) + 32.
    netZeroBits: num(Math.log2(net.difficulty) + 32, 0),
    netZeros: num(Math.floor((Math.log2(net.difficulty) + 32) / 4)),
    netTries: compact(net.difficulty * 2 ** 32),
    nonceSweep: duration(2 ** 32 / net.hashrate),
    halvingBlocks: num(net.halvingBlocks),
    halvingTime: duration(net.halvingBlocks * 600),
  };
}
