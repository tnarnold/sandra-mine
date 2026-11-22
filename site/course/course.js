// Course engine: routing (#/<lesson>/<step>), step playback, progress and language.
//
// A lesson module is { build(svg, ctx) -> scene, steps: [async (scene, ctx) => {}] }.
// To show step N the engine rebuilds the scene, fast-forwards steps 0..N-1 with
// ctx.animate = false, then plays step N animated. So "Replay", "Previous" and deep
// links all work, and a step only has to describe how to get from step N-1 to N.

import { LANGS, setLang, t, lang, pickLang } from "./i18n/index.js";
import { LESSONS } from "./lessons/index.js";
import { net, loadNet, onNet } from "./net.js";
import { netVars } from "./fmt.js";
import { reducedMotion } from "./svg.js";

const app = document.getElementById("app");
const root = document.documentElement;
const memo = {};          // per-lesson state that survives scene rebuilds (e.g. typed text)
let gen = 0;              // bumps on every scene rebuild; stale async steps check it
let view = null;          // { index, step } when a lesson is open
let dom = null;           // lesson DOM refs
let stepVars = {};        // placeholders set by the running step
let netHooks = [];        // scene callbacks for when live data arrives

/* ---------- progress ---------- */
const PKEY = "course.progress";
function progress() {
  try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch { return {}; }
}
function saveProgress(slug, step, total) {
  const p = progress();
  const cur = p[slug] || { max: 0, done: false };
  cur.max = Math.max(cur.max, step + 1);
  if (step + 1 >= total) cur.done = true;
  p[slug] = cur;
  try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch {}
}

/* ---------- text ---------- */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/** Minimal markup: blank line = paragraph, **bold**, `code`, [link](url), {placeholders}. */
function markup(s, vars) {
  return String(s)
    .split(/\n\n+/)
    .map((p) =>
      "<p>" +
      esc(p)
        .replace(/\{(\w+)\}/g, (m, k) => (k in vars ? `<span class="v">${esc(String(vars[k]))}</span>` : m))
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        // [text](url): only course links (#/…), the site (../) and https
        .replace(/\[([^\]]+)\]\(((?:#\/|\.\.\/|https:\/\/)[^)\s]*)\)/g, (m, txt, url) =>
          `<a href="${url}"${url.startsWith("https") ? ' rel="noopener"' : ""}>${txt}</a>`)
        .replace(/\n/g, "<br>") +
      "</p>")
    .join("");
}
const vars = () => ({ ...netVars(net), ...stepVars });

/* ---------- header ---------- */
const NAV = [
  ["../#lottery", "lottery"], ["../#features", "features"], ["../#status", "status"], ["../#lab", "lab"],
  ["#/", "course"], ["../#download", "download"], ["../#setup", "setup"], ["../#faq", "faq"],
];
function renderHeader() {
  document.title = t("ui.page_title");
  document.querySelector("meta[name=description]").content = t("ui.page_description");
  root.lang = lang();
  // Same menu as the landing page (../index.html); its sections are on that page.
  document.getElementById("nav-links").innerHTML = NAV.map(([href, key]) =>
    `<a href="${href}"${key === "course" ? ' class="on" aria-current="page"' : ""}>${esc(t("ui.nav." + key))}</a>`
  ).join("");
  document.getElementById("footer").innerHTML = `
    <div class="wrap">
      <div>
        <a class="brand" href="../" style="color:var(--text)"><img src="../img/icon.png" alt="" width="24" height="24">Sandra<span class="slash">/</span>MINE</a>
        <p style="margin:12px 0 0;max-width:420px">${esc(t("ui.footer_note"))}</p>
      </div>
      <div class="cols">
        <a href="https://github.com/tnarnold/sandra-mine">GitHub</a>
        <a href="https://github.com/tnarnold/sandra-mine/releases">Releases</a>
        <a href="${esc(t("ui.manual_url"))}">${esc(t("ui.manual"))}</a>
        <a href="../sandra/">${esc(t("ui.memorial"))}</a>
        <a href="https://github.com/BitMaker-hub/NerdMiner_v2">NerdMiner v2</a>
        <a href="https://gobtc.com.br">Go BTC</a>
      </div>
    </div>`;
  const box = document.getElementById("langs");
  box.replaceChildren(
    ...LANGS.map((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = l.label;
      b.classList.toggle("on", l.code === lang());
      b.addEventListener("click", () => changeLang(l.code));
      return b;
    })
  );
  const off = document.getElementById("offline");
  off.hidden = !net.loaded || net.live;
  off.textContent = t("ui.offline");
}

async function changeLang(code) {
  try { localStorage.setItem("lang", code); } catch {}
  await setLang(code);
  renderHeader();
  dom = null;
  route();
}

/* ---------- home ---------- */
function renderHome(scroll = true) {
  view = null;
  dom = null;
  gen++;
  const p = progress();
  const next = LESSONS.findIndex((l) => l.module && !(p[l.slug] && p[l.slug].done));
  const started = Object.keys(p).length > 0;
  const startAt = next >= 0 ? next : 0;
  app.innerHTML = `
    <section class="home wrap">
      <span class="label"><span class="idx">${esc(t("ui.free"))}</span> ${esc(t("ui.course"))}</span>
      <h1 class="display">${esc(t("ui.home_title"))}</h1>
      <div class="lead">${markup(t("ui.home_lead"), vars())}</div>
      <div class="cta">
        <a class="btn primary" href="#/${LESSONS[startAt].slug}/1">${esc(t(started ? "ui.continue" : "ui.start"))} →</a>
      </div>
      <ol class="cards">
        ${LESSONS.map((l, i) => {
          const key = `lessons.${l.slug}`;
          const st = p[l.slug];
          const total = l.module ? l.module.steps.length : 0;
          const badge = !l.module ? t("ui.soon") : st && st.done ? "✓ " + t("ui.done") : st ? `${st.max}/${total}` : t("ui.steps", { n: total });
          const inner = `
            <span class="n">${String(i + 1).padStart(2, "0")}</span>
            <span class="q">${esc(t(key + ".title"))}</span>
            <span class="s">${esc(t(key + ".summary"))}</span>
            <span class="b${st && st.done ? " ok" : ""}">${esc(badge)}</span>`;
          return l.module
            ? `<li><a class="card" href="#/${l.slug}/1">${inner}</a></li>`
            : `<li><div class="card soon" aria-disabled="true">${inner}</div></li>`;
        }).join("")}
      </ol>
    </section>`;
  if (scroll) window.scrollTo(0, 0);
}

/* ---------- lesson ---------- */
function buildLessonDom(index) {
  const L = LESSONS[index];
  const key = `lessons.${L.slug}`;
  app.innerHTML = `
    <section class="lesson wrap">
      <div class="lbar">
        <a class="back" href="#/">← ${esc(t("ui.all_lessons"))}</a>
        <span class="label"><span class="idx">${String(index + 1).padStart(2, "0")}</span> ${esc(t("ui.lesson_n", { n: index + 1, total: LESSONS.length }))}</span>
        <h1>${esc(t(key + ".title"))}</h1>
      </div>
      <div class="lgrid">
        <figure class="stage">
          <svg viewBox="0 0 800 460" role="img" aria-label="${esc(t(key + ".title"))}"></svg>
          <div class="controls"></div>
        </figure>
        <article class="panel" aria-live="polite">
          <div class="stepno label"></div>
          <h2></h2>
          <div class="body"></div>
          <details class="more"><summary>${esc(t("ui.more"))}</summary><div></div></details>
          <div class="dots" role="tablist"></div>
          <div class="navb">
            <button type="button" class="btn prev">← ${esc(t("ui.prev"))}</button>
            <button type="button" class="btn replay" title="${esc(t("ui.replay"))}" aria-label="${esc(t("ui.replay"))}">↻</button>
            <a class="btn primary next"></a>
          </div>
        </article>
      </div>
    </section>`;
  const q = (s) => app.querySelector(s);
  dom = {
    index,
    svg: q(".stage svg"),
    controls: q(".controls"),
    stepno: q(".stepno"),
    h2: q(".panel h2"),
    body: q(".panel .body"),
    more: q(".panel .more"),
    moreBody: q(".panel .more div"),
    dots: q(".dots"),
    prev: q(".prev"),
    replay: q(".replay"),
    next: q(".next"),
  };
  dom.prev.addEventListener("click", () => go(view.step - 1));
  dom.replay.addEventListener("click", () => playStep());
  window.scrollTo(0, 0);
}

function go(step) {
  const L = LESSONS[view.index];
  if (step < 0) return;
  if (step >= L.module.steps.length) return;
  location.hash = `#/${L.slug}/${step + 1}`;
}

function renderText() {
  if (!view || !dom) return;
  const L = LESSONS[view.index];
  const total = L.module.steps.length;
  const sk = `lessons.${L.slug}.steps.${view.step}`;
  const v = vars();
  dom.stepno.innerHTML = `<span class="idx">${esc(t("ui.step_n", { n: view.step + 1, total }))}</span>`;
  dom.h2.textContent = t(sk + ".title");
  dom.body.innerHTML = markup(t(sk + ".body"), v);
  const more = t(sk + ".more");
  const hasMore = more !== sk + ".more";
  dom.more.hidden = !hasMore;
  if (hasMore) dom.moreBody.innerHTML = markup(more, v);
}

function renderNav() {
  const L = LESSONS[view.index];
  const total = L.module.steps.length;
  dom.dots.replaceChildren(
    ...L.module.steps.map((_, i) => {
      const a = document.createElement("a");
      a.href = `#/${L.slug}/${i + 1}`;
      a.className = i === view.step ? "on" : i < view.step ? "past" : "";
      a.setAttribute("aria-label", t("ui.step_n", { n: i + 1, total }));
      return a;
    })
  );
  dom.prev.disabled = view.step === 0;
  const last = view.step === total - 1;
  const nextLesson = LESSONS.slice(view.index + 1).find((l) => l.module);
  if (!last) {
    dom.next.textContent = t("ui.next") + " →";
    dom.next.href = `#/${L.slug}/${view.step + 2}`;
  } else if (nextLesson) {
    dom.next.textContent = t("ui.next_lesson") + " →";
    dom.next.href = `#/${nextLesson.slug}/1`;
  } else {
    dom.next.textContent = t("ui.finish") + " ✓";
    dom.next.href = "#/";
  }
}

/** Rebuilds the scene, fast-forwards earlier steps, then animates the current one. */
async function playStep() {
  const my = ++gen;
  const L = LESSONS[view.index];
  const slug = L.slug;
  stepVars = {};
  netHooks = [];
  dom.svg.replaceChildren();
  dom.controls.replaceChildren();
  const reduced = reducedMotion();
  const mk = (animate) => ({
    animate,
    alive: () => my === gen,
    /** Pause between beats of an animated step; never resolves if the step went stale. */
    wait: (ms) =>
      animate && !reduced
        ? new Promise((res) => setTimeout(() => my === gen && res(), ms))
        : Promise.resolve(),
    /** Runs fn(dtSeconds) every frame while this step is showing. */
    loop: (fn) => {
      let last = performance.now();
      const tick = (now) => {
        if (my !== gen) return;
        fn(Math.min(0.1, (now - last) / 1000));
        last = now;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    every: (ms, fn) => {
      const id = setInterval(() => (my === gen ? fn() : clearInterval(id)), ms);
    },
    label: (k, v) => t(`lessons.${slug}.labels.${k}`, v),
    setVars: (v) => { if (my === gen) { stepVars = { ...stepVars, ...v }; renderText(); } },
    onNet: (fn) => netHooks.push(fn),
    memo: (memo[slug] ||= {}),
    controls: dom.controls,
    net,
    reduced,
  });
  renderText();
  renderNav();
  const scene = L.module.build(dom.svg, mk(false));
  for (let j = 0; j < view.step; j++) {
    await L.module.steps[j](scene, mk(false));
    if (my !== gen) return;
  }
  await L.module.steps[view.step](scene, mk(true));
}

/* ---------- routing ---------- */
function route() {
  const m = location.hash.match(/^#\/([\w-]+)(?:\/(\d+))?/);
  const index = m ? LESSONS.findIndex((l) => l.slug === m[1] && l.module) : -1;
  if (index < 0) {
    if (location.hash && location.hash !== "#/") history.replaceState(null, "", "#/");
    return renderHome();
  }
  const L = LESSONS[index];
  const total = L.module.steps.length;
  const step = Math.min(total, Math.max(1, parseInt(m[2] || "1", 10))) - 1;
  if (!dom || dom.index !== index) buildLessonDom(index);
  view = { index, step };
  saveProgress(L.slug, step, total);
  playStep();
}

/* ---------- keyboard ---------- */
document.addEventListener("keydown", (e) => {
  if (!view || e.altKey || e.ctrlKey || e.metaKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === "ArrowRight") { e.preventDefault(); dom.next.click(); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); go(view.step - 1); }
  else if (e.key === "r" || e.key === "R") playStep();
});

/* ---------- boot ---------- */
(async function boot() {
  let pref = null;
  try { pref = localStorage.getItem("lang"); } catch {}
  await setLang(pickLang(pref || navigator.language));
  renderHeader();
  window.addEventListener("hashchange", route);
  route();
  onNet(() => {
    renderHeader();
    if (view) {
      renderText();
      netHooks.forEach((fn) => fn(net));
    } else {
      renderHome(false);
    }
  });
  loadNet();
})();
