// Course languages. To add one: copy en.js to <code>.js, translate it, add a line here,
// then run `node scripts/check-course-i18n.mjs` to see anything left untranslated.
// Missing keys fall back to English at runtime.

export const LANGS = [
  { code: "en", label: "EN", load: () => import("./en.js") },
  { code: "pt-BR", label: "PT", load: () => import("./pt-BR.js") },
];
export const DEFAULT = "en";

/** Picks the best supported language for a preference like "pt", "pt-PT" or "en-US". */
export function pickLang(pref) {
  if (!pref) return DEFAULT;
  const p = pref.toLowerCase();
  const exact = LANGS.find((l) => l.code.toLowerCase() === p);
  if (exact) return exact.code;
  const base = LANGS.find((l) => l.code.toLowerCase().split("-")[0] === p.split("-")[0]);
  return base ? base.code : DEFAULT;
}

let dict = {}, fallback = {}, current = DEFAULT;
export const lang = () => current;

export async function setLang(code) {
  current = pickLang(code);
  const def = LANGS.find((l) => l.code === DEFAULT);
  fallback = (await def.load()).default;
  dict = current === DEFAULT ? fallback : (await LANGS.find((l) => l.code === current).load()).default;
  return current;
}

const dig = (obj, key) => key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Looks up a dotted key ("ui.next", "lessons.hash.steps.2.title"). Shows the key if missing everywhere. */
export function t(key, vars) {
  let v = dig(dict, key);
  if (v === undefined) v = dig(fallback, key);
  if (v === undefined) return key;
  if (vars && typeof v === "string") v = v.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return v;
}
