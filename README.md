# Dispatch

Turn a quick voice note into clear delegation emails. Single-user test app.

- Spec: [DispatchSpec.md](DispatchSpec.md). This is the source of truth for what we're building and in which phase.
- Stack: Next.js (installable web app) on Vercel. Supabase and login arrive in Phase 3 (spec decision 34). No AI for now (decision 33).

## Where it's up to: Phases 1 (capture → draft) and 2 (people and clarifying) built; Phase 3 (actions list) next

- `/` is the home page: a big New note button (Continue your note, when one is in progress), Add delegates, and a link to Admin. Every other screen has a Home button in its top bar.
- `/admin` links to the Phase 0 tests, the look-and-feel options and the future features list (`/admin/features`). The shared list is kept in `src/app/admin/features/features.ts`; on an iPhone, a ＋ button adds features saved on that phone.
- `/note` is a note, start to finish: Dispatch asks for each action's owner, what needs doing, why it matters and what done looks like (both optional: say "skip" or tap Skip), and when it's due, only if you haven't already said it ("by Friday"; spec decision 37), then who to copy in, then shows the emails with copy buttons for Outlook. Answers can be typed or spoken (spec decision 32). Under each question, **Speak this answer** listens for just that answer, and **Hands-free** keeps the mic on for the whole note. **Read questions aloud** makes Dispatch read each question, with one tap per answer (Hands-free isn't offered then). You end a spoken answer by saying "next" or "stop", or tapping Done (decision 35). On iPhone, Speak this answer and Hands-free share one listening session for the whole note, because starting and stopping one per answer stops the iPhone hearing anything. Each part of an email has a copy icon in its top-right corner. Progress is saved on the device.
- `/people` is Delegates (spec §4): name and email, plus optional role, full name and "also known as", and whether you still delegate to them. Saved on the device. In a note, two people with the same name are shown by full name, and a spoken name that isn't recognised can be taught ("Did you mean someone on your list?").
- The logic lives in `src/lib`: `dates.ts` (the deadline rules in spec §7, and spotting a deadline said in passing), `bank-holidays.ts` (the built-in England & Wales list; `/api/bank-holidays` gets the latest from gov.uk, cached for a week, and `bank-holidays-refresh.ts` saves it on the device), `email.ts` (the template in §6), `voice.ts` (listening and speaking; "next" or "stop" ends an answer), `voice-answers.ts` (yes/no, names, "no one", "skip", "back"), `people.ts` (delegates and name matching), `settings.ts` and `local.ts` (on-device storage).

Phase 0 pages that are still around:

- `/spike` is a checklist that tests the iPhone's limits: microphone, speech recognition, read-aloud, hands-free, notifications, badge, keep-awake, copy and Siri. It uses the chosen look (Pulse, with the Aurora speech-bubble logo in Pulse colours; spec decision 31).
- `/looks` shows the five look-and-feel options that were considered (`/looks?look=pulse` opens one directly).
- `/api/push-test` sends one test notification. It's for Phase 0 only and will be replaced by real reminders in Phase 5.

## Run locally

```
npm install
npm run dev
npm test        # the deadline rules and email template (Node's built-in test runner)
```

On a network that inspects HTTPS traffic (a work laptop), Node won't trust the company certificate, so `/api/bank-holidays` can't reach gov.uk and sends the built-in list instead. To use the Windows certificate store, start the server with `$env:NODE_OPTIONS = "--use-system-ca"; npm run dev` in PowerShell. Vercel doesn't need this.

Environment variables (in `.env.local`, which is git-ignored, and in Vercel project settings):

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key (secret) |

Regenerate the push keys with `npx web-push generate-vapid-keys`. Regenerate the app icons from `scripts/icon.svg` with `node scripts/make-icons.mjs`.

## Walk-through tests

`npm run e2e` runs the app the way a person would, in a hidden Edge window at iPhone size, and checks every step. It starts the app on this laptop if it isn't running, and stops it afterwards. `npm run e2e -- https://dispatch-85on.vercel.app` runs the same checks against the live app; each test uses its own fresh browser, so nothing there changes. It takes about four minutes, and exits with an error if anything fails.

| Test (`scripts/e2e/`) | What it checks |
|---|---|
| `note-typed.mjs` | A whole note typed: deadline said in passing, optional questions skipped, Change date, progress kept across a reload, CC, the finished emails |
| `note-voice.mjs` | A whole note by voice with a pretend speech recogniser: "next"/"stop" (even said twice), Skip, a vague deadline, hands-free. Run twice: as a laptop, and as an iPhone, where the whole note must use **one** listening session |
| `navigation.mjs` | Moving around by tapping, as screens are kept alive in the background: a delegate added on Delegates appears in New note at once; hands-free doesn't look on after leaving |
| `home-and-admin.mjs` | Home page states, a Home button on every screen, Future features "+" on iPhone only |
| `delegates.mjs` | Full delegate details, two Toms, teaching a misheard name, someone who's left, an old saved list |
| `bank-holidays.mjs` | The latest gov.uk list is fetched and saved; Christmas Day is moved, with the reason |

Screenshots from each run are in `test-results/e2e/<test>/` (not saved to GitHub). Run one test on its own with `node scripts/e2e/<test>.mjs http://localhost:3000` while `npm run dev` is running. Two tools in the same folder: `screenshot.mjs` (full-page screenshots at any width, flagging sideways overflow) and `installable.mjs` (whether the browser can install Dispatch as an app). The tests use Edge, or Chrome if there's no Edge; set `E2E_BROWSER` to the path of another Chromium-based browser.

`npm run check:bank-holidays` compares the built-in bank holiday list with gov.uk's. Run it when gov.uk publishes another year.
