#!/usr/bin/env node
// Checks the course translations (site/course/i18n) against English, the reference:
//  - keys missing or extra in each language, lists with a different length
//  - {placeholders} that differ from the English text
//  - every lesson's step count matches its text, and every ctx.label("x") used by a
//    lesson exists in English
// Usage: node scripts/check-course-i18n.mjs   (exit code 1 if anything is wrong)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "site", "course");
const { LANGS, DEFAULT } = await import(join(dir, "i18n", "index.js"));
const { LESSONS } = await import(join(dir, "lessons", "index.js"));
const ref = (await LANGS.find((l) => l.code === DEFAULT).load()).default;

const problems = [];
const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

function compare(a, b, path, code) {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return problems.push(`${code}: ${path} should be a list`);
    if (a.length !== b.length) problems.push(`${code}: ${path} has ${b.length} items, English has ${a.length}`);
    a.forEach((v, i) => i < b.length && compare(v, b[i], `${path}.${i}`, code));
  } else if (a && typeof a === "object") {
    if (!b || typeof b !== "object") return problems.push(`${code}: ${path} missing`);
    for (const k of Object.keys(a)) {
      if (!(k in b)) problems.push(`${code}: ${path ? path + "." : ""}${k} missing`);
      else compare(a[k], b[k], path ? `${path}.${k}` : k, code);
    }
    for (const k of Object.keys(b)) if (!(k in a)) problems.push(`${code}: ${path ? path + "." : ""}${k} is not in English (typo?)`);
  } else if (typeof b !== "string" || !b.trim()) {
    problems.push(`${code}: ${path} is empty`);
  } else if (holes(a) !== holes(b)) {
    problems.push(`${code}: ${path} placeholders {${holes(b)}} differ from English {${holes(a)}}`);
  }
}

for (const l of LANGS) {
  if (l.code === DEFAULT) continue;
  compare(ref, (await l.load()).default, "", l.code);
}

for (const [i, L] of LESSONS.entries()) {
  const tx = ref.lessons[L.slug];
  if (!tx || !tx.title) { problems.push(`en: lessons.${L.slug}.title missing`); continue; }
  if (!L.module) continue;
  const n = L.module.steps.length;
  if (!tx.steps || tx.steps.length !== n) problems.push(`en: lessons.${L.slug}.steps has ${tx.steps ? tx.steps.length : 0} texts, the lesson has ${n} steps`);
  const file = readFileSync(join(dir, "lessons", `${String(i + 1).padStart(2, "0")}-${L.slug}.js`), "utf8");
  for (const [, k] of file.matchAll(/label\(\s*"(\w+)"\s*[,)]/g)) {
    if (!tx.labels || !(k in tx.labels)) problems.push(`en: lessons.${L.slug}.labels.${k} is used but missing`);
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`Course i18n OK: ${LANGS.map((l) => l.code).join(", ")} · ${LESSONS.filter((l) => l.module).length} lessons.`);
