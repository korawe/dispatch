# Dispatch: Product & Build Spec (MVP)

*Version 0.4 · 22 Nov 2026 · Status: Phase 0 nearly done (Siri and desktop tests to come); look and feel (31), hands-free (32), no AI for now (33) and the Phase 1 approach (34) decided*

---

## 1. Summary

Dispatch turns a quick voice note into a clear delegation email. You speak, and Dispatch works out who owns each action, what needs doing, why, what "done" looks like and when it's due. It asks about anything missing and drafts a short, friendly email for each person. You hand the email to Outlook to send, and Dispatch tracks the action until you mark it complete.

**For now there's no AI (decision 33):** Dispatch asks you for each part of each action in turn and builds the emails from a fixed template, at no cost. Drafting from one free-form note is planned for later (§10.4).

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
- Guided capture: Dispatch asks for each action's owner, what needs doing, why it matters and what done looks like (both optional), and the deadline (unless you've already said it), and builds one email per person per note from a template (no AI for now, decisions 33 and 37).
- Checks on names and deadlines (unknown or ambiguous person, vague, past or non-working-day date), plus a CC prompt.
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
- AI drafting from one free-form note (planned; §10.4, decision 33).

## 4. Delegates (the people list)

The app calls the people you delegate to **Delegates**. You set them up once under **Add delegates** on the home page and maintain them there.

| Field | Notes |
|---|---|
| Name | As you'd say it, e.g. "Priya" |
| Full name | Used in the greeting if needed |
| Role | e.g. "EA", "Head of Ops". Shown in the people list; would give AI drafting context later |
| Email | Required |
| Also known as | Nicknames or alternative pronunciations, e.g. "Pree", to help speech recognition |
| Is EA | Flag. No special routing in the MVP |
| Active | Hide people who've left without losing their history |

Rules:
- Only people on the list can be owners or CCs. If the note names someone who isn't on the list, Dispatch asks you to pick an existing person or add them (name and email) on the spot.
- If a name matches more than one person, Dispatch asks which one you meant.

## 5. Core flow

```
Start → Capture each action → Check → CC → Choose → (Read back | Review) → Hand off → Tracked
```

1. **Start.** Tap the big mic button (or open Dispatch from the home-screen icon, then tap).
2. **Capture each action.** Dispatch asks for one action at a time, out loud or on screen depending on Speak prompts (§9). Each spoken answer is turned into text (§10.3), and you can type any answer instead.
   - **Who owns it?** One person from your people list (§4). Each action has exactly one owner; if you name two people, it asks which one owns it and suggests the other for CC.
   - **What needs doing?** You can say when it's due in the same breath, e.g. "Pull the Q3 numbers by Friday".
   - **Why does it matter?** Optional: say "skip" or just "next", or tap Skip.
   - **What does done look like?** Optional, as above.
   - **When is it due?** Only asked if you haven't already said it in one of the answers above (decision 37). Worked out by the rules in §7, e.g. "Friday" or "in 3 days". If the answers mention two different dates, or a date in the past, it's asked, with what you said filled in.
   - **Another action?** Yes starts the next one; no moves on. Each action so far is listed with its deadline. One taken from what you said is shown with your words ("From what you said: “by Friday”"), and read aloud if Read questions aloud is on. **Change date** corrects it; the old words are then taken out of your answer, so the email doesn't say Friday in one line and Monday in the next.

   Actions are grouped by owner, giving one email per person per note.
3. **Check.** Dispatch only asks when something needs fixing:
   - **Unknown or ambiguous person:** see §4.
   - **Vague deadline** ("soon", "ASAP", "when you can"): "When is *booking the offsite* due?" A deadline in the past or on a non-working day is handled as in §7.
4. **CC, for each email:** "Anyone to copy in on Priya's email?" People suggested during capture are offered. You confirm, add or say "no".
5. **Choose:** "Read it back, review on screen, or just send?"
   - **Read back:** Dispatch speaks each email aloud. You correct it by voice by saying which part to change ("deadline", "owner", "action", "add a CC", "drop the second action"), then the new answer, tapping the mic button first on iPhone (§9). Or switch to screen editing. When you're done, it moves to hand-off.
   - **Review:** the drafts are shown on screen with every field editable. You can also hold the mic button to dictate into a field.
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
- Every action has four parts: **Context & intention → Action → Expected outcome → Deadline.** The recipient is the owner, and the email says so plainly. Context and outcome are optional in guided capture (decision 37); a skipped one is left out of the email rather than shown empty.
- Deadlines always show the actual day and date, never just "Friday".
- Plain text, so it survives the hand-off to Outlook. The labels below keep it scannable.
- **For now (decision 33), it's a fixed template filled with your own answers,** lightly tidied (a capital letter at the start, a full stop at the end). The opening line is fixed: "Can you own this, please?" for one action, or "Two things for you to own:" for several. So how concise each email is depends on how you phrase your answers. The examples below show the style that AI drafting would aim for later.

### Subject line
- One action: `<short title> – by <Day dd Mon>`, e.g. `Q3 board numbers – by Fri 21 Nov`
- Several actions: `<n> actions: <title 1>, <title 2>… – first due <Day dd Mon>`
- With no title question (decision 37), the title is the start of what needs doing: up to its first comma or eight words, without a deadline phrase, e.g. "Pull the Q3 numbers by Friday, flag any variance" gives `Pull the Q3 numbers – by Fri 21 Nov`. AI drafting would write a better one later (§10.4). You can edit the subject before copying it.

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
- After you tap to start, Dispatch can run the whole flow by voice. Under each question, **Speak this answer** listens for one answer and **Hands-free** keeps the mic on for the whole note (decision 36). How Dispatch talks to you depends on the **Speak prompts** setting, shown in the app as **Read questions aloud** (decision 32):
  - **Speak prompts on:** Dispatch **speaks** its questions, the "read back / review / send" choice and the read-back. You **tap the big mic button once** to answer each time. This is an iPhone limit (test 6).
  - **Speak prompts off:** the questions and choices show on screen, and the mic stays on for the whole note, so you answer with **no taps**. Good at your desk, or whenever you can glance at the screen.
- **You end each spoken answer by saying "next" or "stop"** (decision 35), so you can pause to think. Neither word is included in the answer. A Done button does the same, and an answer also finishes after 20 seconds with no new words.
- Example commands: "read it back", "review", "send", "change the deadline to Thursday", "add Tom on copy", "remove the second action", "cancel", "next".
- The on-screen controls are always there too. You can switch between voice and touch at any point.

### iPhone limits (to confirm in the Phase 0 spike, §14)
- **Starting needs a tap, and so does each spoken answer when Dispatch speaks.** iOS needs a tap before a web app can use the microphone or speak, so each session starts with a tap. Once Dispatch's voice has played, the built-in speech recognition only hears you again if a tap starts it (test 6). With Speak prompts off, the mic stays on and no more taps are needed.
- **The app must be open and on screen.** It won't work from the lock screen or in the background. Dispatch tries to keep the screen awake during a session.
- **No "Hey Siri, Dispatch" directly.** We'll check whether an iOS Shortcut ("Hey Siri, Dispatch") can open the installed app. If not, the home-screen icon is the way in.
- **Microphone permission:** home-screen web apps on iOS can ask for mic permission more often than you'd expect. The spike checks how often.
- Use it only where it's safe and legal to do so, e.g. with the phone in a hands-free mount.

Anything beyond these limits, such as lock-screen recording or a true "Hey Siri", would need a native app (out of scope).

### Phase 0 test results (iPhone, 16–22 Nov 2026)

| Check | Result | What it means |
|---|---|---|
| Install to Home Screen | ✓ Works | On newer iOS, Share sits under the **⋯** button in Safari |
| Microphone recording | ✓ Works | Records in a format cloud speech-to-text services accept |
| Mic permission after reopening | ✓ Remembered | No repeated prompts |
| Built-in speech recognition | ✓ Worked on re-test, and in the detailed test (4b). The first attempt failed ("aborted"); the cause is unknown. ✓ Windows laptop, Chrome (22 Nov): accurate, but it stopped listening before the end of a longer sentence, most likely at the first pause | Use it, because it's free (§10.3). Keyboard dictation is the fallback (Windows key + H on the laptop). Voice capture keeps listening across pauses and ends an answer when you say "stop" (decision 35), so pauses don't cut you off |
| Read aloud (built-in voices) | ✓ Works with silent mode off; ✗ muted when the phone is on silent | Neither workaround (test 5b, A and B) gets round silent mode |
| Recorded voice clip (as a cloud voice would deliver) | ✓ Plays with silent mode on | A cloud text-to-speech service works even when the phone is on silent |
| Hands-free conversation (test 6, 7 rounds, 16–22 Nov) | ✓ Two free ways work, 5 of 5 words each: **spoken questions with a tap per answer** (round 7), and **the mic on for the whole note with questions on screen, no taps** (round 5). ✗ Spoken questions with no taps: once Dispatch's voice plays out loud, the built-in recognition stops hearing anything, often for minutes and even after reopening the app | Decision 32: the Speak prompts setting picks between the two (§9). A listen started by a tap works even straight after the voice. These didn't help: changing how a turn ends, waiting between turns, or telling Safari the page plays and records at once ("play-and-record"). Turn-taking: the iPhone ends a turn about 1.6s after you stop talking. Once, the phone's audio stuck completely (no voice, mic "audio-capture" error) until the iPhone was restarted. An ordinary recording made while the voice played came out empty, so it's untested whether a paid cloud speech service could manage spoken questions with no taps |
| Notifications | ✓ Works (test notification arrived) | Morning summary is feasible |
| App icon badge | ✓ Works | |
| Copy into Outlook | ✓ Works | Copy-button hand-off is fine |
| Keep screen awake | ◐ The iPhone grants the request (test 6 logs "screen kept awake") | Not yet checked that the screen stays on beyond the auto-lock time (test 9) |
| Siri Shortcut | Not yet tested | |
| Desktop install (Windows laptop, 22 Nov) | ✓ Works: installed from Chrome, with its own window, a desktop icon and a taskbar pin | Edge, which shares Chrome's engine, also confirms the site meets its install requirements. Phase 1's note flow also works at laptop size. Data isn't shared between devices until Phase 3 (decision 34), so the people list is entered on each device |

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
  - **Decided after Phase 0 testing:** use (a), because speech-to-text must be free (decision 29) and it worked in the installed iPhone app on re-test (§9).
    - If it fails, the fallback is the iPhone keyboard's dictation (the mic key), which is also free.
    - Desktop: works in Chrome on Windows (22 Nov). It ends a single-phrase listen at the first pause, so Dispatch keeps listening until you say "stop" (decision 35).
    - For the IT check (§12): built-in recognition comes from Apple on iPhone, Google in Chrome and Microsoft in Edge, so audio may be processed on their servers. Which desktop browser you install Dispatch from decides which company that is.
    - (b) remains an option later.
- **Text-to-speech** (read-back and prompts): **decided, the browser's built-in voices (free).**
  - On iPhone they're muted when the phone is on silent, so you switch silent off to hear Dispatch.
  - Prompts and read-backs always show on screen as well, so nothing is lost on silent.
  - A cloud voice would play on silent (test 5c), so it remains an option later, at a small cost.

### 10.4 AI drafting (later; not in the MVP for now)
**Decision 33: no AI for now.** Emails are built from a template (§5, §6), at no cost. If AI drafting is added later, this is the plan:

- **Billing:** the Claude API is billed per use through a Claude Console account, separately from any claude.ai plan; usage is never charged against a plan's allowance. Team, Max and Ultra plans include monthly API credits that the plan's owner can link to one Console account, which would likely cover Dispatch. Spending is capped by the prepaid balance.
- **Model:** start with Claude Haiku 5.5 (`claude-haiku-5-5`), as a setting, with Sonnet 5.5 or Opus 5.5 as step-ups if drafts aren't good enough. It's called through the official Anthropic TypeScript SDK from a server route.
- **One call to draft each note.** The input is the transcript, your people list, today's date and time, the list of upcoming working days (so dates resolve correctly) and the email rules from §6. The output is **structured JSON** (enforced by a schema). For each email, it contains the recipient, CCs, subject and actions. Each action has a title, context, action, outcome and deadline, plus a list of anything missing or ambiguous that Dispatch needs to ask about.
- **Corrections:** one call per voice correction. It takes the current draft and your instruction, and returns the updated draft in the same JSON shape.
- **Code checks the AI's work:** the deadline rules (§7), whether a person exists on the list (§4) and the email format. The AI drafts; the code enforces the rules.
- **Settings:** low or medium effort, since this is short extraction and drafting, tuned during testing. The fixed instructions and people list are cached to cut cost. If the model declines a note, Dispatch falls back to guided capture.
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
  - The review should cover where speech-to-text (and Claude, if AI drafting is added) processes data, and what each provider keeps. With no AI for now (decision 33), your notes go only to the built-in speech recognition: Apple on iPhone, Google in Chrome, Microsoft in Edge.
- **Single user:** only your email can sign in. All data is behind login and row-level security.
- **Secrets:** API keys live only in Vercel and Supabase server settings, never in the app code or the browser.
- **Hosting terms:** Vercel's free (Hobby) plan is meant for personal, non-commercial use. If Dispatch becomes a work tool, check the plan with IT at the same time as the AI policy.

## 13. Running costs (rough)

| Item | Estimate |
|---|---|
| AI drafting | **£0 for now:** no AI (decision 33). If added later, at about 10 notes a working day (3 calls each) and Nov 2026 prices: Claude Haiku 5.5 about 50p a month, Sonnet 5.5 about £9, Opus 5.5 about £18. A Team plan's monthly API credits may cover it (§10.4). Measure real usage in the first week |
| Speech-to-text | **£0:** built-in recognition (decision 30) |
| Supabase, Vercel | Free tiers should cover a single user (see the hosting-terms note in §12) |

For now, everything runs on free tiers.

## 14. Delivery phases

| Phase | What's built | Done when |
|---|---|---|
| **0. Setup and spike** | Repo, Vercel, installable app shell (Supabase and login moved later, decision 34). Spike: iPhone mic in a home-screen app, built-in speech recognition vs a cloud API, spoken read-back, screen wake, Siri Shortcut, push and badge | Installed on iPhone and desktop. Each §9 limit confirmed or corrected in this spec |
| **1. Capture → draft** | Guided capture (voice or typing, §5), the date rules in §7 apart from bank holidays, template drafts shown on screen (§6), copy buttons, and a simple people list (name and email). Everything is stored on the device (decision 34) | A note becomes correct drafts, ready to paste into Outlook, on both devices |
| **2. People and clarifying** | The full people list (role, also known as, active), unknown or ambiguous name handling, missing owner and deadline questions, CC prompt, deadline rules and bank holidays | No draft can reach hand-off without an owner and a valid deadline |
| **3. Actions list** | Supabase (London) and the email-code login, so your phone and PC share people and actions. Open and Completed lists, by deadline and by person, complete, reopen, edit deadline, delete, undo after hand-off | Full lifecycle of an action works |
| **4. Voice flow** | Spoken prompts, read-back, voice corrections, read back / review / send choice, Speak prompts setting | A full note can be done by voice: with Speak prompts on, one tap per answer; with them off, no taps after the first |
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
| 27 | ~~Claude Opus 5.5 for drafting~~ (replaced by decision 33); speech-to-text provider chosen in Phase 0 | You |
| 28 | Read-back and prompts use the free built-in voices; switch silent off to hear them | You (after Phase 0 tests) |
| 29 | Speech-to-text must be free (zero cost) | You (after Phase 0 tests) |
| 30 | Speech-to-text uses the built-in browser recognition, with keyboard dictation as the fallback | Follows from 29 and the re-test of test 4 |
| 31 | Look and feel: "Pulse" (cobalt and sunshine yellow, navy outlines, solid drop shadows, Bricolage Grotesque and Outfit) with the speech bubble and sound wave from "Aurora" as the logo, in Pulse colours (a sunshine-yellow bubble with a cobalt wave on a cobalt tile, not Aurora's purple). Applied to the test page, home page and app icon first; the five options are on `/looks` | You (22 Nov) |
| 32 | Hands-free on iPhone uses the Speak prompts setting. On: Dispatch speaks, and you tap once per answer. Off: the mic stays on and the questions show on screen, with no taps. Both are free and worked 5 of 5 in test 6. Spoken questions with no taps would need a paid speech service, so they aren't pursued | You (22 Nov, after test 6) |
| 33 | No AI for now: Dispatch asks for each part of each action and builds the emails from a fixed template, at zero cost. AI drafting from a free-form note can come later, starting with Claude Haiku 5.5 (about 50p a month); it's billed separately from a claude.ai plan, though a Team plan's API credits may cover it (§10.4) | You (22 Nov) |
| 34 | Phase 1 stores everything on the device and brings a simple people list (name and email) forward from Phase 2. Supabase and the login arrive in Phase 3, when your phone and PC need to share data | You (22 Nov) |
| 35 | A spoken answer ends when you say "stop" or "next" (left out of the answer, even if said twice) or tap Done, not after a pause, so you can stop to think. "Next" was added on 22 Nov because it feels more natural in conversation. On iPhone, with Read questions aloud off, one listening session runs for the whole note, started by the first tap, because starting and stopping one per answer left it hearing nothing (test 6, and twice in real use on 22 Nov). With Read questions aloud on, each answer is a fresh listen that the iPhone ends at your pause (round 7), so there a pause ends the answer | You (22 Nov) |
| 36 | Under each question, two voice buttons side by side: **Speak this answer** (just this one) and **Hands-free** (the mic stays on for the whole note), so you choose how to answer from the first question. The Speak prompts setting is shown as **Read questions aloud**, so it isn't confused with Speak this answer | You (22 Nov) |
| 37 | A shorter capture: no title question (the subject uses the start of the action); **What needs doing?** comes straight after the owner; **Why does it matter?** and **What does done look like?** are optional (skip by voice or tap); **When is it due?** is only asked if no deadline was said in the answers, and one that was said is shown on the next screen, where it can be changed. Capture stays one question at a time, not one free-form answer (that's what AI drafting would bring, §10.4) | You (22 Nov) |

## 16. Open questions

1. ~~Speech-to-text provider~~: built-in recognition (decision 30), subject to the AI policy review.
2. Can a Siri Shortcut open the installed app directly? (Phase 0.)
3. ~~Hands-free on iPhone~~: decided after test 6 (decision 32). Speak prompts on means a tap per answer; off means no taps, with the questions on screen.
4. ~~Which AI model drafts the emails~~: no AI for now (decision 33). Haiku 5.5 is the starting point if AI drafting is added later.
