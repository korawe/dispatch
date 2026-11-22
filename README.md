# Dispatch

Turn a quick voice note into clear delegation emails. Single-user test app.

- Spec: [DispatchSpec.md](DispatchSpec.md). This is the source of truth for what we're building and in which phase.
- Stack: Next.js (installable web app) on Vercel. Supabase and login arrive in Phase 3 (spec decision 34). No AI for now (decision 33).

## Current phase: 1 (capture → draft)

- `/` is the home page: a big New note button (Continue your note, when one is in progress), Add delegates, and a link to Admin. Every other screen has a Home button in its top bar.
- `/admin` links to the Phase 0 tests, the look-and-feel options and the future features list (`/admin/features`). The shared list is kept in `src/app/admin/features/features.ts`; on an iPhone, a ＋ button adds features saved on that phone.
- `/note` is a note, start to finish: Dispatch asks for each action's owner, what needs doing, why it matters and what done looks like (both optional: say "skip" or tap Skip), and when it's due, only if you haven't already said it ("by Friday"; spec decision 37), then who to copy in, then shows the emails with copy buttons for Outlook. Answers can be typed or spoken (spec decision 32). Under each question, **Speak this answer** listens for just that answer, and **Hands-free** keeps the mic on for the whole note. **Read questions aloud** makes Dispatch read each question, with one tap per answer (Hands-free isn't offered then). You end a spoken answer by saying "next" or "stop", or tapping Done (decision 35). On iPhone, Speak this answer and Hands-free share one listening session for the whole note, because starting and stopping one per answer stops the iPhone hearing anything. Each part of an email has a copy icon in its top-right corner. Progress is saved on the device.
- `/people` is Delegates: the simple people list (name and email), saved on the device.
- The logic lives in `src/lib`: `dates.ts` (the deadline rules in spec §7, and spotting a deadline said in passing), `bank-holidays.ts` (the built-in England & Wales list; `/api/bank-holidays` gets the latest from gov.uk, cached for a week, and `bank-holidays-refresh.ts` saves it on the device), `email.ts` (the template in §6), `voice.ts` (listening and speaking; "next" or "stop" ends an answer), `voice-answers.ts` (yes/no, names, "no one", "skip", "back"), `people.ts`, `settings.ts` and `local.ts` (on-device storage).

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
