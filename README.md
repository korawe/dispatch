# Dispatch

Turn a quick voice note into clear delegation emails. Single-user test app.

- Spec: [DispatchSpec.md](DispatchSpec.md). This is the source of truth for what we're building and in which phase.
- Stack: Next.js (installable web app), Supabase and Vercel from Phase 1 onwards.

## Current phase: 0 (setup and iPhone tests)

- `/` is a placeholder home page.
- `/spike` is a checklist that tests the iPhone's limits: microphone, speech recognition, read-aloud, hands-free, notifications, badge, keep-awake, copy and Siri. It uses the chosen look (Pulse, with the Aurora speech-bubble logo in Pulse colours; spec decision 31).
- `/looks` shows the five look-and-feel options that were considered (`/looks?look=pulse` opens one directly).
- `/api/push-test` sends one test notification. It's for Phase 0 only and will be replaced by real reminders in Phase 5.

## Run locally

```
npm install
npm run dev
```

Environment variables (in `.env.local`, which is git-ignored, and in Vercel project settings):

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key |
| `VAPID_PRIVATE_KEY` | Web push private key (secret) |

Regenerate the push keys with `npx web-push generate-vapid-keys`. Regenerate the app icons from `scripts/icon.svg` with `node scripts/make-icons.mjs`.
