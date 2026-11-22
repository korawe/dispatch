// The home page's New note / Continue states, a Home button on every screen, and the Future features "+"
// (iPhone only, saved on the phone). Usage: node scripts/e2e/home-and-admin.mjs [baseUrl]
import { IPHONE_USER_AGENT, openBrowser } from "./browser.mjs";

const t = await openBrowser("home-and-admin");

// Home page: New note, then Continue once a note is part-way through.
await t.go("/");
await t.setDevice();
await t.go("/");
await t.check("home shows New note, Add delegates and Admin", /New note[\s\S]*Add delegates[\s\S]*Admin/);
await t.shot("1-home");
await t.setDevice({ "dispatch-note-v1": { actions: [], answers: { ownerId: "p1" }, step: "action", emails: [] } });
await t.go("/");
await t.check("home offers to continue a note in progress", /Continue your note/);

// Every screen has a Home button.
for (const path of ["/note", "/people", "/admin", "/admin/features", "/spike", "/looks"]) {
  await t.go(path);
  const hasHome = await t.js(`[...document.querySelectorAll("a")].some((a) => a.checkVisibility() && a.getAttribute("href") === "/" && a.textContent.trim() === "Home")`);
  t.ok(`Home button on ${path}`, hasHome);
}

// Future features on a laptop: no "+", a note instead.
await t.go("/admin/features");
await t.check("laptop: adding is iPhone-only", /only available on your iPhone[\s\S]*AI drafting of emails/);

// Future features on an iPhone: "+" adds one, and it's still there after a reload.
await t.send("Emulation.setUserAgentOverride", { userAgent: IPHONE_USER_AGENT });
await t.go("/admin/features");
await t.check("iPhone: + Add a feature shown", /＋ Add a feature/);
await t.click("＋ Add a feature");
await t.fill(0, "Calendar holds for deadlines");
await t.fill(1, "Put a hold in my calendar for each deadline.");
await t.click("Add feature");
await t.go("/admin/features");
await t.check("iPhone: the new feature is saved and listed", /Calendar holds for deadlines[\s\S]*on this iPhone/);
await t.shot("2-features-iphone");
await t.finish();
