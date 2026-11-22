# Dispatch

Turn a quick voice note into clear delegation emails. Single-user test app.

- Spec: [DispatchSpec.md](DispatchSpec.md). This is the source of truth for what we're building and in which phase.
- Stack: Next.js (installable web app) on Vercel. Supabase and login arrive in Phase 3 (spec decision 34). No AI for now (decision 33).

## Current phase: 1 (capture → draft)

- `/` is the home page: a big New note button (Continue your note, when one is in progress), Add delegates, and a link to Admin. Every other screen has a Home button in its top bar.
- `/admin` links to the Phase 0 tests, the look-and-feel options and the future features list (`/admin/features`). The shared list is kept in `src/app/admin/features/features.ts`; on an iPhone, a ＋ button adds features saved on that phone.
- `/note` is a note, start to finish: Dispatch asks for each action's owner, title, context, action, outcome and deadline, then who to copy in, then shows the emails with copy buttons for Outlook. Answers can be typed or spoken (spec decision 32): **Answer by voice** listens for one answer; **Speak questions** reads each question aloud (you tap once per answer); **Go hands-free** keeps the mic on for the whole note, with the questions on screen. You end a spoken answer by saying "stop" or tapping Done (decision 35). Each part of an email has a copy icon in its top-right corner. Progress is saved on the device.
- `/people` is Delegates: the simple people list (name and email), saved on the device.
- The logic lives in `src/lib`: `dates.ts` (the deadline rules in spec §7), `email.ts` (the template in §6), `voice.ts` (listening and speaking; "stop" ends an answer), `voice-answers.ts` (yes/no, names, "no one", "back"), `people.ts`, `settings.ts` and `local.ts` (on-device storage).

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

Environment variables (in `.env.local`, which is git-ignored, and in Vercel project settings):

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key (secret) |

Regenerate the push keys with `npx web-push generate-vapid-keys`. Regenerate the app icons from `scripts/icon.svg` with `node scripts/make-icons.mjs`.
