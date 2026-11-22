// A tool: asks the browser whether Dispatch can be installed as an app (spec §10.1), and shows the manifest it
// found and whether the service worker registered. Usage: node scripts/e2e/installable.mjs [baseUrl]
import { openBrowser } from "./browser.mjs";

const t = await openBrowser("installable", { width: 1280, height: 800 });
await t.go("/", 6000);
const errors = (await t.send("Page.getInstallabilityErrors")).result?.installabilityErrors ?? [];
t.ok("installable as an app", errors.length === 0, JSON.stringify(errors));
const manifest = (await t.send("Page.getAppManifest")).result ?? {};
t.ok(`manifest found (${manifest.url})`, !!manifest.data && !(manifest.errors ?? []).length, JSON.stringify(manifest.errors));
console.log("   manifest:", (manifest.data ?? "").replace(/\s+/g, " ").slice(0, 400));
const worker = await t.js("navigator.serviceWorker.getRegistrations().then((r) => r.map((x) => x.scope).join(', ') || 'none')");
console.log("   service worker:", worker);
await t.finish();
