// A tool, not a test: full-page screenshots of any pages, at a chosen width, reporting sideways overflow.
// Usage: node scripts/e2e/screenshot.mjs [baseUrl] <width> <name=path>...
//   e.g. node scripts/e2e/screenshot.mjs http://localhost:3000 390 home=/ delegates=/people
// Screenshots go to test-results/e2e/screenshots/.
import { openBrowser } from "./browser.mjs";

const [, , , widthArg, ...pairs] = process.argv;
const width = Number(widthArg);
if (!width || !pairs.length) {
  console.log("Usage: node scripts/e2e/screenshot.mjs <baseUrl> <width> <name=path>...");
  process.exit(1);
}
const t = await openBrowser("screenshots", { width, height: width < 600 ? 844 : 800 });
for (const pair of pairs) {
  const [name, path] = pair.split(/=(.*)/s);
  await t.go(path, 4000);
  const [scrollWidth, innerWidth, height] = await t.js("[document.documentElement.scrollWidth, innerWidth, document.documentElement.scrollHeight]");
  t.ok(`${name}: ${innerWidth}px wide, ${height}px tall${scrollWidth > innerWidth ? `, content ${scrollWidth}px wide (overflows sideways)` : ""}`, scrollWidth <= innerWidth);
  await t.shot(name);
}
console.log(`Saved in ${t.outDir}`);
await t.finish();
