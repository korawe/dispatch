// Runs every walk-through test, one after another, and sums up. Exits with 1 if any failed.
// Usage: npm run e2e                                  (the app on this laptop; started for you if it isn't running)
//        npm run e2e -- https://dispatch-85on.vercel.app   (the live app)
// Each test only touches its own fresh browser, so running against the live app changes nothing there.
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { sleep } from "./browser.mjs";

const base = (process.argv[2] ?? process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TESTS = [
  ["note-typed.mjs"],
  ["note-voice.mjs", "laptop"],
  ["note-voice.mjs", "iphone"],
  ["navigation.mjs"],
  ["home-and-admin.mjs"],
  ["delegates.mjs"],
  ["bank-holidays.mjs"],
];
const PAGES = ["/", "/note", "/people", "/admin", "/admin/features", "/spike", "/looks", "/api/bank-holidays"];

const answering = async () => {
  try {
    return (await fetch(`${base}/`)).ok;
  } catch {
    return false;
  }
};

let server = null;
function stopServer() {
  if (!server) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else server.kill();
  server = null;
}
process.once("exit", stopServer);

if (!(await answering())) {
  const local = base.match(/^http:\/\/(?:localhost|127\.0\.0\.1)(?::(\d+))?$/);
  if (!local) {
    console.error(`${base} isn't answering.`);
    process.exit(1);
  }
  console.log("Starting the app (npm run dev)…");
  // --use-system-ca: on a network that inspects HTTPS, the app's server can then still reach gov.uk (see README).
  server = spawn(`npm run dev -- --port ${local[1] ?? "3000"}`, {
    shell: true, // npm is a .cmd file on Windows; the port is digits only, from the URL above
    stdio: "ignore",
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --use-system-ca`.trim() },
  });
  for (let i = 0; i < 120 && !(await answering()); i++) await sleep(1000);
  if (!(await answering())) {
    console.error("The app didn't start within 2 minutes.");
    process.exit(1);
  }
}

// The app on this laptop builds each page the first time it's opened, which can be slower than a test waits.
// Open every page, and the code it loads, once first.
if (server || /localhost|127\.0\.0\.1/.test(base)) {
  console.log("Warming up the pages…");
  for (const path of PAGES) {
    try {
      const html = await (await fetch(`${base}${path}`)).text();
      const scripts = [...new Set(html.match(/\/_next\/static\/[^"' ]+\.js/g) ?? [])];
      await Promise.all(scripts.map((s) => fetch(`${base}${s}`).then((r) => r.arrayBuffer())));
    } catch {
      /* a test will report it */
    }
  }
}

const results = [];
for (const [file, mode] of TESTS) {
  const name = mode ? `${file.replace(".mjs", "")} (${mode})` : file.replace(".mjs", "");
  console.log(`\n=== ${name} ===`);
  const started = Date.now();
  const code = await new Promise((done) => {
    const child = spawn(process.execPath, [fileURLToPath(new URL(file, import.meta.url)), base, ...(mode ? [mode] : [])], { stdio: "inherit" });
    child.on("exit", (c) => done(c ?? 1));
  });
  results.push({ name, passed: code === 0, seconds: Math.round((Date.now() - started) / 1000) });
}

stopServer();
console.log("\n=== Summary ===");
for (const r of results) console.log(`${r.passed ? "PASS" : "FAIL"}  ${r.name} (${r.seconds}s)`);
const failed = results.filter((r) => !r.passed).length;
console.log(failed ? `\n${failed} of ${results.length} failed. Screenshots are in test-results/e2e/.` : `\nAll ${results.length} passed.`);
process.exit(failed ? 1 : 0);
