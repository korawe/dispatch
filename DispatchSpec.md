# Dispatch: Product & Build Spec (MVP)

*Version 0.2 · 16 Nov 2026 · Status: all decisions confirmed; ready for Phase 0*

---

## 1. Summary

Dispatch turns a quick voice note into a clear delegation email. You speak, and Dispatch works out who owns each action, what needs doing, why, what "done" looks like and when it's due. It asks about anything missing and drafts a short, friendly email for each person. You hand the email to Outlook to send, and Dispatch tracks the action until you mark it complete.

**Who it's for:** you (single user) in the MVP. Recipients are your EA and your direct reports.

**Where it runs:** iPhone (on the go) and desktop (at your desk), as one installable web app.

## 2. Goals and success measures

The MVP is a personal test. It succeeds if:

1. **You use it every day.** It becomes your default way to delegate for at least two weeks.
2. **Delegating is faster.** A voice note becomes a ready-to-send email in about a minute.
3. **The emails are clearer.** Your team finds the owners, actions and deadlines clearer than before.

## 3. Scope

### In the MVP
- Voice capture on iPhone and desktop.
- AI extraction of actions and drafting of emails (one email per person per note).
- Clarifying questions when an owner or deadline is missing or unclear, plus a CC prompt.
- Three ways to finish: **Read back** (spoken), **Review** (on screen) or **Just send**.
- Corrections by voice or on-screen editing.
- Hand-off by copy and paste: copy buttons for To, CC, subject and body, to paste into a new Outlook email.
- A people list (your EA and direct reports) that you maintain.
- Open and completed action lists: mark complete, reopen, edit deadline, delete, and view by person or by deadline.
- Overdue reminders: a 09:00 weekday summary notification and an in-app badge.
- Hands-free voice prompts on iPhone, within iOS limits (§9).

### Out of scope (later)
- Sending email from your Outlook account (Microsoft Graph; needs IT admin consent).
- Other users or managers, and multi-account support.
- A native iPhone app or App Store release.
- Team-facing features. Direct reports only receive emails and never use Dispatch.
- Reading replies or auto-closing actions from email.
- Push notifications at the exact moment a deadline passes. You chose the summary and badge only.

## 4. People list

You set this up once in **Settings → People** and maintain it there.

| Field | Notes |
|---|---|
| Name | As you'd say it, e.g. "Priya" |
| Full name | Used in the greeting if needed |
| Role | e.g. "EA", "Head of Ops". Gives the AI context |
| Email | Required |
| Also known as | Nicknames or alternative pronunciations, e.g. "Pree", to help speech recognition |
| Is EA | Flag. No special routing in the MVP; it gives the AI context only |
| Active | Hide people who've left without losing their history |

Rules:
- Only people on the list can be owners or CCs. If the note names someone who isn't on the list, Dispatch asks you to pick an existing person or add them (name and email) on the spot.
- If a name matches more than one person, Dispatch asks which one you meant.

## 5. Core flow

```
Record → Transcribe → Draft → Clarify → Choose → (Read back | Review) → Hand off → Tracked
```

1. **Record.** Tap the big record button (or the home-screen icon, then tap) and speak. Tap again to stop. There's no fixed limit, but the guidance is under 2 minutes.
2. **Transcribe.** The audio is turned into text (§10.3).
3. **Draft.** The AI pulls out each action and groups actions by owner, giving one email per person per note. For each action it identifies the owner, context and intention, the action and expected outcome, and the deadline.
4. **Clarify.** Dispatch asks one question at a time, by voice in hands-free mode or on screen:
   - **Missing or unclear owner:** "Who should own *booking the offsite*?" Each action has exactly one owner. If you name two people, it asks who owns it, and the other person can go on CC.
   - **Missing or vague deadline** ("soon", "ASAP", none given): "When is *booking the offsite* due?"
   - **Unknown or ambiguous person:** see §4.
   - **CC prompt, for each email:** "Anyone to copy in on Priya's email?" People you named as a reference are suggested as CCs. You confirm, add or say "no".
5. **Choose:** "Read it back, review on screen, or just send?"
   - **Read back:** Dispatch speaks each email aloud. You correct it by voice ("change the deadline to Thursday", "add Tom on copy", "drop the second action") or switch to screen editing. When you're done, it moves to hand-off.
   - **Review:** the drafts are shown on screen with every field editable. You can also hold the mic button to dictate a correction.
   - **Just send:** goes straight to hand-off.
6. **Hand off.** In the MVP, "send" means you copy the email into Outlook and send it yourself.
   - For each email, Dispatch shows **Copy** buttons for To, CC, subject and body. Each copied part gets a tick, so you can see what's done.
   - With more than one email, it goes through them one by one ("Next: Tom's email").
7. **Tracked.** The first time you copy any part of an email, its actions move to your **Open actions** list. For 10 seconds you can **Undo**, in case you didn't mean to send it. After that, you can still delete it from the list.

You can cancel at any point. Nothing is tracked until you hand an email off.

## 6. Email format

### Rules
- Friendly but **concise**: short sentences, no waffle, British English.
- Written in the first person, as you.
- **Always ends with `Thanks, Killian`.**
- **One email per person per note.** That person is the recipient; anyone else named is on CC. For a separate topic, record a separate note.
- Every action has four parts: **Context & intention → Action → Expected outcome → Deadline.** The recipient is the owner, and the email says so plainly.
- Deadlines always show the actual day and date, never just "Friday".
- Plain text, so it survives the hand-off to Outlook. The labels below keep it scannable.

### Subject line
- One action: `<short title> – by <Day dd Mon>`, e.g. `Q3 board numbers – by Fri 21 Nov`
- Several actions: `<n> actions: <title 1>, <title 2>… – first due <Day dd Mon>`

### Example: one action

```
Subject: Q3 board numbers – by Fri 21 Nov

Hi Priya,

Can you own getting the Q3 numbers ready for the board pack?

Context: The board meets on the 25th and wants to see how we tracked against forecast. I'd like no surprises in the room.
Action: Pull Q3 revenue and costs against forecast, with a line on any variance over 5%.
Outcome: A one-page summary I can drop straight into the pack.
Deadline: 17:30, Fri 21 Nov

Thanks, Killian
```

### Example: several actions

```
Subject: 2 actions: offsite booking, supplier review – first due Wed 19 Nov

Hi Tom,

Two things for you to own:

1. Book the team offsite
   Context: We need a day together before planning season.
   Action: Find and book a venue for 12 people in early December.
   Outcome: Venue confirmed and invite sent to the team.
   Deadline: 17:30, Wed 19 Nov

2. Supplier review
   Context: Renewal is due and I want options before we commit.
   Action: Compare our current supplier against two alternatives.
   Outcome: A short recommendation with costs.
   Deadline: 17:30, Fri 28 Nov

Thanks, Killian
```

*(The names and content in the examples are made up. Expect to tune the format in the first week of testing.)*

## 7. Deadlines and time rules

| Rule | Setting |
|---|---|
| Time zone | UK (Europe/London, so it handles GMT and BST automatically) |
| "End of day" | 17:30 |
| A deadline with a date but no time | 17:30 that day |
| Working days | Mon–Fri. Relative deadlines skip weekends |
| Bank holidays | England & Wales bank holidays are skipped (source: the gov.uk bank holidays feed, cached and refreshed weekly) |
| "In 3 days" said on a Thursday | Tuesday, 17:30 |
| A deadline that lands on a weekend or bank holiday | Moved to the next working day (17:30), flagged in the read-back or review |
| A deadline in the past | Dispatch asks you to confirm or change it |
| Vague ("soon", "ASAP", "when you can") | Dispatch asks for a date (§5 step 4) |

The settings (end-of-day time, summary time, bank holiday region and sign-off) live in **Settings** so they can be changed later without code changes.

## 8. Actions list

Two tabs: **Open** and **Completed**.

- **View by:** Deadline (default; overdue first, then soonest) or Person (grouped by owner, each group sorted by deadline).
- **Each row:** title, owner, deadline (day and date), and an overdue marker if past due. Tap a row for the full action (context, action, outcome, CCs, date sent).
- **Actions:**
  - **Mark complete:** one tap; the action moves to Completed with a completion date.
  - **Reopen:** from Completed, back to Open.
  - **Edit deadline:** pick a new date and time; the same rules as §7 apply.
  - **Delete:** asks for confirmation, then removes the action entirely.
- Each action in a multi-action email is tracked separately.
- Editing a deadline in Dispatch doesn't email anyone. Telling the owner is up to you.

## 9. Voice and hands-free mode

### What it does
- After you tap to start, Dispatch can run the whole flow by voice. It **speaks** its questions, the "read back / review / send" choice and the read-back, and **listens** for your answers.
- Example commands: "read it back", "review", "send", "change the deadline to Thursday", "add Tom on copy", "remove the second action", "cancel", "next".
- The on-screen controls are always there too. You can switch between voice and touch at any point.
- A setting, **Speak prompts** (on/off), lets you keep it silent at your desk, with prompts shown on screen only.

### iPhone limits (to confirm in the Phase 0 spike, §14)
- **Starting needs a tap.** iOS needs a tap before a web app can use the microphone or speak, so each session starts with a tap. After that, the flow can be hands-free.
- **The app must be open and on screen.** It won't work from the lock screen or in the background. Dispatch tries to keep the screen awake during a session.
- **No "Hey Siri, Dispatch" directly.** We'll check whether an iOS Shortcut ("Hey Siri, Dispatch") can open the installed app. If not, the home-screen icon is the way in.
- **Microphone permission:** home-screen web apps on iOS can ask for mic permission more often than you'd expect. The spike checks how often.
- Use it only where it's safe and legal to do so, e.g. with the phone in a hands-free mount.

Anything beyond these limits, such as lock-screen recording or a true "Hey Siri", would need a native app (out of scope).

### Phase 0 test results (iPhone, 16 Nov 2026)

| Check | Result | What it means |
|---|---|---|
| Install to Home Screen | ✓ Works | On newer iOS, Share sits under the **⋯** button in Safari |
| Microphone recording | ✓ Works | Records in a format cloud speech-to-text services accept |
| Mic permission after reopening | ✓ Remembered | No repeated prompts |
| Built-in speech recognition | ✗ Failed ("aborted", nothing heard) | Don't rely on it. Use a cloud speech-to-text service for everything (§10.3) |
| Read aloud (built-in voices) | ✓ Works with silent mode off; ✗ muted when the phone is on silent | Neither workaround (test 5b, A and B) gets round silent mode |
| Recorded voice clip (as a cloud voice would deliver) | ✓ Plays with silent mode on | A cloud text-to-speech service works even when the phone is on silent |
| Hands-free conversation | ✗ Failed | Followed from the two failures above. Needs a rebuild on cloud speech-to-text, then a re-test |
| Notifications | ✓ Works (test notification arrived) | Morning summary is feasible |
| App icon badge | ✓ Works | |
| Copy into Outlook | ✓ Works | Copy-button hand-off is fine |
| Keep screen awake | Not yet tested | |
| Siri Shortcut | Not yet tested | |
| Desktop install | Not yet tested | |

## 10. Platform and technology

### 10.1 App
- **Next.js web app (PWA)**, installable:
  - **iPhone:** Safari → Share → Add to Home Screen. This is required for notifications and the app badge on iPhone.
  - **Desktop:** in Edge or Chrome, **Install app**, which creates a desktop shortcut you can pin to the taskbar.
- Same stack as ForFeit but **fully separate**: its own GitHub repo, Supabase project and Vercel project. No shared code, data or keys.
- Local project folder: `C:\Users\KillianO\dispatch\`

### 10.2 Backend
- **Supabase:** Postgres database, authentication and scheduled jobs. Choose the **London region** when creating the project.
- **Vercel:** hosting and server routes. All AI calls go through the server, so API keys never reach the browser.
- **Login:** an email one-time code (more reliable in iPhone home-screen apps than magic links). Sign-up is locked to your email address only.
- Row-level security on every table.

### 10.3 Speech
- **Speech-to-text:** Claude doesn't take audio input, so transcription needs a separate step. Two options, to be compared in the Phase 0 spike:
  - (a) **Built-in browser speech recognition:** free and fast, but reliability in iPhone home-screen apps and accuracy with names are unproven.
  - (b) **A cloud speech-to-text API:** records audio and sends it to a transcription service. More consistent across phone and desktop. Usually priced per minute of audio.
  - **Decided after Phase 0 testing:** use (b) for everything, including the short spoken replies in hands-free mode, because (a) failed on your iPhone (§9). Pick the provider once the AI policy check is done (§12).
- **Text-to-speech** (read-back and prompts): **decided, the browser's built-in voices (free).**
  - On iPhone they're muted when the phone is on silent, so you switch silent off to hear Dispatch.
  - Prompts and read-backs always show on screen as well, so nothing is lost on silent.
  - A cloud voice would play on silent (test 5c), so it remains an option later, at a small cost.

### 10.4 AI drafting
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`), called through the official Anthropic TypeScript SDK from a server route.
- **One call to draft each note.** The input is the transcript, your people list, today's date and time, the list of upcoming working days (so dates resolve correctly) and the email rules from §6. The output is **structured JSON** (enforced by a schema). For each email, it contains the recipient, CCs, subject and actions. Each action has a title, context, action, outcome and deadline, plus a list of anything missing or ambiguous that Dispatch needs to ask about.
- **Corrections:** one call per voice correction. It takes the current draft and your instruction, and returns the updated draft in the same JSON shape.
- **Code checks the AI's work:** the deadline rules (§7), whether a person exists on the list (§4) and the email format. The AI drafts; the code enforces the rules.
- **Settings:** low or medium effort, since this is short extraction and drafting, tuned during testing. The fixed instructions and people list are cached to cut cost. A refusal fallback is enabled.
- The AI never sends anything. It only produces drafts for you to check and hand off.

### 10.5 Notifications
- **Morning summary:** at **09:00 on weekdays** (England & Wales working days), if anything is overdue, a push notification such as "3 actions overdue: Priya (2), Tom (1)". Tapping it opens the Open list filtered to overdue. If nothing is overdue, nothing is sent.
- **App badge:** the home-screen icon shows the number of overdue actions. In-app, there's an overdue banner at the top of the Open list.
- **How:** web push (works on iPhone only for apps added to the Home Screen) and a scheduled job that runs at 09:00 UK time and copes with the clock changes.

## 11. Data model (outline)

| Table | Key fields |
|---|---|
| `people` | id, name, full_name, role, email, aliases[], is_ea, active |
| `emails` | id, recipient_id, cc_ids[], subject, body, status (`draft` / `handed_off`), handed_off_at, created_at |
| `actions` | id, email_id, owner_id, title, context, action, outcome, deadline_at, status (`open` / `completed`), completed_at, created_at, updated_at |
| `capture_sessions` | id, transcript, state, created_at. Temporary; see below |
| `push_subscriptions` | id, endpoint, keys, device_label, created_at |
| `settings` | eod_time (17:30), summary_time (09:00), timezone (Europe/London), holiday_region (england-and-wales), sign_off ("Thanks, Killian"), speak_prompts |
| `bank_holidays` | date, region, title (cached from gov.uk) |

**Retention:**
- **Audio** is never stored. It's deleted as soon as it has been transcribed.
- **Transcripts** are kept only while a note is in progress. They're deleted when its emails are handed off or the note is cancelled, with an automatic purge of anything older than 24 hours.
- **Emails and actions** are kept, because they're needed for the tracking lists.

## 12. Privacy, security and policy

- **AI policy:** your company has an AI policy, and you'll agree Dispatch with IT before using it beyond testing. Until then:
  - **Test with non-sensitive notes.** Avoid HR or performance matters, client names and personal data.
  - The review should cover where speech-to-text and Claude process data, and what each provider keeps.
- **Single user:** only your email can sign in. All data is behind login and row-level security.
- **Secrets:** API keys live only in Vercel and Supabase server settings, never in the app code or the browser.
- **Hosting terms:** Vercel's free (Hobby) plan is meant for personal, non-commercial use. If Dispatch becomes a work tool, check the plan with IT at the same time as the AI policy.

## 13. Running costs (rough)

| Item | Estimate |
|---|---|
| Claude Opus 5.5 | About 5–10p per note, including clarifying questions and a correction or two. At around 10 notes a working day, that's roughly **£5–£15 a month**. To be confirmed by measuring real usage in week 1 |
| Speech-to-text | Priced per minute of audio; expected to be small at a few minutes a day. To be confirmed once the provider is chosen |
| Supabase, Vercel | Free tiers should cover a single user (see the hosting-terms note in §12) |

Cost levers if needed: caching (already planned) and lower effort. Switching to a cheaper Claude model would be your call after looking at draft quality.

## 14. Delivery phases

| Phase | What's built | Done when |
|---|---|---|
| **0. Setup and spike** | Repo, Supabase (London), Vercel, login, installable app shell. Spike: iPhone mic in a home-screen app, built-in speech recognition vs a cloud API, spoken read-back, screen wake, Siri Shortcut, push and badge | Installed on iPhone and desktop. Each §9 limit confirmed or corrected in this spec |
| **1. Capture → draft** | Record, transcribe, one AI call, drafts shown on screen, copy buttons | A note becomes correct drafts, ready to paste into Outlook, on both devices |
| **2. People and clarifying** | People list, unknown or ambiguous name handling, missing owner and deadline questions, CC prompt, deadline rules and bank holidays | No draft can reach hand-off without an owner and a valid deadline |
| **3. Actions list** | Open and Completed lists, by deadline and by person, complete, reopen, edit deadline, delete, undo after hand-off | Full lifecycle of an action works |
| **4. Voice flow** | Spoken prompts, read-back, voice corrections, read back / review / send choice, Speak prompts setting | A full note can be done hands-free after one tap |
| **5. Reminders** | 09:00 weekday summary push, app badge, overdue banner | Overdue actions are surfaced correctly, including across a clock change |
| **6. Two-week trial** | Daily use. Tune email format and prompts. Measure cost and time per note | Success measures in §2 reviewed |

**After the MVP:**
- Send directly from Outlook via Microsoft Graph, once IT consents.
- Read replies to update actions.
- Calendar holds for deadlines.
- Other users.

## 15. Decisions log

| # | Decision | Source |
|---|---|---|
| 1 | New app, kept fully separate from ForFeit | You |
| 2 | Phone and desktop; installable web app; desktop shortcut and taskbar | You |
| 3 | After recording: read back, review on screen, or just send | You |
| 4 | Recipient gets only their actions; reference people on CC; app prompts for CC | You |
| 5 | Email structure: Owner, Context & intention, Action & expected outcome, Deadline | You |
| 6 | Corrections by voice or on screen | You |
| 7 | Missing owner or deadline → ask before drafting | You |
| 8 | MVP drafts only; you send via Outlook; integration later | You |
| 9 | Open and completed lists; reminders for overdue items | You |
| 10 | AI policy and IT sign-off later; MVP is test-only | You |
| 11 | iPhone only (no Android for now); single user | You |
| 12 | Hands-free voice prompts where possible | You |
| 13 | Name: Dispatch | You |
| 14 | Friendly, concise; always "Thanks, Killian" | You |
| 15 | One email per person per note | You |
| 16 | Discard recordings | You |
| 17 | UK time, end of day 17:30, weekdays only, England & Wales bank holidays | You |
| 18 | Summary at 09:00 weekdays, plus in-app badge; no push at the deadline itself | You |
| 19 | Same stack as ForFeit, as separate projects | You |
| 20 | List features: edit deadline, reopen, delete, group by person | You |
| 21 | Hand-off by copy buttons only; no "Open in Outlook" button | You |
| 22 | Subject format: title + deadline (§6) | You |
| 23 | Exactly one owner per action; Dispatch asks who, others can go on CC | You |
| 24 | Action is tracked at hand-off (first copy), with 10-second undo | You |
| 25 | Transcripts deleted after hand-off or cancel (within 24 hours at most) | You |
| 26 | Weekend or bank holiday deadline → next working day, flagged | You |
| 27 | Claude Opus 5.5 for drafting; speech-to-text provider chosen in Phase 0 | You |
| 28 | Read-back and prompts use the free built-in voices; switch silent off to hear them | You (after Phase 0 tests) |
| 29 | Speech-to-text must be free (zero cost) | You (after Phase 0 tests) |

## 16. Open questions

1. Speech-to-text provider (Phase 0 spike, and the AI policy review).
2. Can a Siri Shortcut open the installed app directly? (Phase 0.)
