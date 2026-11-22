// Shared by the walk-through tests in this folder: starts a headless Edge (or Chrome), drives one tab through
// the DevTools protocol, and keeps score. Each test gets a fresh browser profile, so nothing carries over from
// an earlier run, and a free port, so tests can't clash.
//
// Results (screenshots) go to test-results/e2e/<test name>/, which git ignores.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const IPHONE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

// Set E2E_BROWSER to use another browser (any Chromium-based one).
const BROWSERS = [
  process.env.E2E_BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean);

/** The base URL from the command line, e.g. `node note-typed.mjs http://localhost:3000`. */
export const baseUrl = () => (process.argv[2] ?? process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

// A pretend speech recogniser: start() fires onstart, and window.__say("…") is you speaking. Like real browsers,
// each result lists every phrase heard so far. window.__recs lists each listening session (aborted = cut off).
const FAKE_VOICE = `
  window.__recs = [];
  class FakeRecognition {
    constructor() { this.phrases = []; window.__recs.push(this); }
    start() { setTimeout(() => this.onstart && this.onstart(), 30); }
    stop() { setTimeout(() => this.onend && this.onend(), 10); }
    abort() { this.aborted = true; setTimeout(() => this.onend && this.onend(), 10); }
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
  window.__say = (text) => {
    const r = window.__recs[window.__recs.length - 1];
    r.phrases.push(text);
    r.onresult && r.onresult({ results: r.phrases.map((t) => Object.assign([{ transcript: t }], { isFinal: true })) });
  };
`;

// Helpers that run inside the page. Only what's visible counts: Next.js keeps recently visited screens alive,
// hidden, in the same page.
const PAGE_HELPERS = `(() => {
  const visible = (el) => el.checkVisibility();
  const buttons = (root = document) => [...root.querySelectorAll("button, a")].filter((b) => visible(b) && !b.disabled);
  const label = (b) => b.textContent.trim().replace(/^✓ /, "");
  const setValue = (el, value) => {
    if (el.type === "checkbox") { el.click(); return true; }
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };
  const fields = () => [...document.querySelectorAll("main input, main textarea")].filter(visible);

  // Taps the visible button or link with exactly this text (or a link that starts with it).
  window.__click = (text) => {
    const all = buttons();
    const b = all.find((x) => label(x) === text) || all.find((x) => x.tagName === "A" && label(x).startsWith(text));
    if (!b) throw new Error("no visible button: " + text);
    b.click();
    return true;
  };
  // Taps a button inside the box whose text starts with boxText, e.g. "Did you mean someone on your list?".
  window.__clickIn = (boxText, text) => {
    const box = [...document.querySelectorAll("main div")].filter((d) => visible(d) && d.innerText.startsWith(boxText)).pop();
    if (!box) throw new Error("no box starting: " + boxText);
    const b = buttons(box).find((x) => label(x) === text);
    if (!b) throw new Error("no button " + text + " in: " + boxText);
    b.click();
    return true;
  };
  // Types into the first visible text box (a note's answer).
  window.__type = (value) => {
    const el = fields().find((f) => f.type !== "email" && f.type !== "checkbox");
    if (!el) throw new Error("no text field");
    return setValue(el, value);
  };
  // Fills the visible field whose label starts with this text, or the nth visible field. Ticks a checkbox.
  window.__fill = (which, value) => {
    let el;
    if (typeof which === "number") el = fields()[which];
    else {
      const l = [...document.querySelectorAll("main label")].filter((x) => visible(x) && x.innerText.startsWith(which)).pop();
      el = l && l.querySelector("input, textarea");
    }
    if (!el) throw new Error("no field: " + which);
    return setValue(el, value);
  };
  window.__text = () => [...document.querySelectorAll("main")].filter(visible).map((m) => m.innerText).join("\\n");
  // The email on screen: its subject and body boxes.
  window.__email = () => {
    const f = fields();
    return { subject: f.find((x) => x.tagName === "INPUT")?.value ?? "", body: f.find((x) => x.tagName === "TEXTAREA")?.value ?? "" };
  };
})();`;

/**
 * Opens a browser for one test. Options: width/height (iPhone size by default), voice (the pretend recogniser),
 * iphone (an iPhone user agent, so the app takes its iPhone paths).
 */
export async function openBrowser(name, { width = 390, height = 844, voice = false, iphone = false } = {}) {
  const base = baseUrl();
  const outDir = resolve("test-results", "e2e", name);
  const profile = resolve(outDir, "browser-profile");
  mkdirSync(outDir, { recursive: true });
  try {
    rmSync(profile, { recursive: true, force: true }); // a fresh start each run
  } catch {
    /* still in use by a browser that hasn't quite closed: it's fine to reuse */
  }

  const exe = BROWSERS.find((b) => existsSync(b));
  if (!exe) throw new Error("Couldn't find Edge or Chrome. Set E2E_BROWSER to the browser's .exe path.");
  const port = await freePort();
  // The profile path must be absolute: Edge 158 quits (exit code 21) with a relative one.
  const proc = spawn(exe, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "about:blank"]);
  const exited = new Promise((r) => proc.once("exit", r));
  process.once("exit", () => proc.kill()); // never leave a browser running, even if a test crashes

  let targets;
  for (let i = 0; i < 120 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    } catch {
      await sleep(250);
    }
  }
  if (!targets) throw new Error(`The browser didn't start (${exe}).`);

  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      const id = ++nextId;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const js = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error(`page error: ${r.result.exceptionDetails.exception?.description ?? "unknown"}`);
    return r.result?.result?.value;
  };

  await send("Page.enable");
  await send("Page.addScriptToEvaluateOnNewDocument", { source: PAGE_HELPERS });
  if (voice) await send("Page.addScriptToEvaluateOnNewDocument", { source: FAKE_VOICE });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  if (iphone) await send("Emulation.setUserAgentOverride", { userAgent: IPHONE_USER_AGENT });

  let failures = 0;
  const q = JSON.stringify;
  const t = {
    base,
    outDir,
    send,
    js,
    /** Opens a page of the app and waits for it. */
    async go(path, wait = 2500) {
      await send("Page.navigate", { url: `${base}${path}` });
      await sleep(wait);
    },
    async reload(wait = 2500) {
      await send("Page.reload");
      await sleep(wait);
    },
    async click(text, wait = 300) {
      await js(`__click(${q(text)})`);
      await sleep(wait);
    },
    async clickIn(boxText, text, wait = 300) {
      await js(`__clickIn(${q(boxText)}, ${q(text)})`);
      await sleep(wait);
    },
    async type(value, wait = 250) {
      await js(`__type(${q(value)})`);
      await sleep(wait);
    },
    async fill(which, value = "", wait = 150) {
      await js(`__fill(${q(which)}, ${q(value)})`);
      await sleep(wait);
    },
    /** One phrase heard by the pretend recogniser (voice tests). */
    async say(text, wait = 500) {
      await js(`__say(${q(text)})`);
      await sleep(wait);
    },
    text: () => js("__text()"),
    email: () => js("__email()"),
    /** Something saved on the device (localStorage), parsed. */
    async saved(key) {
      return JSON.parse((await js(`localStorage.getItem(${q(key)})`)) ?? "null");
    },
    /** Starts from a clean device: clears storage, then saves the given keys. */
    async setDevice(values = {}) {
      await js(`localStorage.clear(); ${Object.entries(values).map(([k, v]) => `localStorage.setItem(${q(k)}, ${q(JSON.stringify(v))});`).join(" ")} true`);
    },
    /** Records a pass or a failure. */
    ok(label, pass, detail = "") {
      if (!pass) failures++;
      console.log(`${pass ? "ok" : "FAIL"}: ${label}${pass || !detail ? "" : `\n   ${detail}`}`);
    },
    /** Checks the screen's text against a pattern (or that it doesn't match, with { not: true }). */
    async check(label, pattern, { not = false } = {}) {
      const text = await t.text();
      t.ok(label, not ? !pattern.test(text) : pattern.test(text), `screen says: ${text.slice(0, 400).replace(/\n/g, " | ")}`);
    },
    /** A full-page screenshot in this test's results folder. */
    async shot(file) {
      const [w, h] = JSON.parse(await js("JSON.stringify([innerWidth, document.documentElement.scrollHeight])"));
      const s = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
      writeFileSync(resolve(outDir, `${file}.png`), Buffer.from(s.result.data, "base64"));
    },
    /** Prints the result, closes the browser, and exits with 1 if anything failed. */
    async finish() {
      console.log(failures ? `${failures} FAILED` : "ALL PASSED");
      ws.close();
      proc.kill();
      await Promise.race([exited, sleep(3000)]);
      process.exit(failures ? 1 : 0);
    },
  };
  return t;
}
