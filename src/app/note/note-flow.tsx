"use client";

// A note, start to finish (DispatchSpec.md §5, decision 33): Dispatch asks for each action's owner, title,
// context, action, outcome and deadline; then who to copy in on each email; then shows the emails with copy
// buttons for Outlook. Answers can be typed or spoken (decision 32): "Answer by voice" listens for one answer;
// with Speak questions on, Dispatch reads each question aloud; with it off, "Go hands-free" keeps the mic on
// for the whole note. Progress is saved on the device, so closing the app mid-note loses nothing.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TopBar } from "@/components/top-bar";
import { formatDay, formatDeadline, parseDeadline, type Deadline } from "@/lib/dates";
import { buildDraft, groupByOwner, tidyTitle, type CapturedAction, type EmailDraft } from "@/lib/email";
import { readLocal, writeLocal } from "@/lib/local";
import { loadPeople, makePerson, matchPeople, savePeople, type Person } from "@/lib/people";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import { canListen, canSpeak, isIPhone, speak, stopSpeaking, VoiceSession } from "@/lib/voice";
import { isBack, isNoOne, splitNames, yesOrNo } from "@/lib/voice-answers";
import { inputClass, PersonForm } from "../people/people-manager";

type Step = "owner" | "title" | "context" | "action" | "outcome" | "deadline" | "another" | "cc" | "drafts";
type TextStep = "title" | "context" | "action" | "outcome";
const ACTION_STEPS: Step[] = ["owner", "title", "context", "action", "outcome", "deadline"];

type Answers = { ownerId: string; title: string; context: string; action: string; outcome: string; deadlineText: string };

type Note = {
  actions: CapturedAction[];
  answers: Answers; // the action being captured
  step: Step;
  ccIndex: number; // which email's CC question
  cc: Record<string, string[]>; // owner id -> ids of people to copy in
  emails: EmailDraft[];
  emailIndex: number;
  copied: string[]; // "<email index>:<part>"
};

const NOTE_KEY = "dispatch-note-v1";
const emptyAnswers = (): Answers => ({ ownerId: "", title: "", context: "", action: "", outcome: "", deadlineText: "" });
const emptyNote = (): Note => ({ actions: [], answers: emptyAnswers(), step: "owner", ccIndex: 0, cc: {}, emails: [], emailIndex: 0, copied: [] });

/** The saved note, or a fresh one if nothing's saved or it doesn't look right. */
function loadNote(): Note {
  const saved = readLocal<Partial<Note> | null>(NOTE_KEY, null);
  if (!saved || !Array.isArray(saved.actions) || !saved.answers || !Array.isArray(saved.emails)) return emptyNote();
  return { ...emptyNote(), ...saved, answers: { ...emptyAnswers(), ...saved.answers } };
}

const QUESTIONS: Record<TextStep, { ask: string; hint: string; multiline: boolean; back: Step; next: Step }> = {
  title: { ask: "Give it a short title", hint: "For the subject line, e.g. Q3 board numbers", multiline: false, back: "owner", next: "context" },
  context: {
    ask: "Why does it matter?",
    hint: "The background, for the email's Context line, e.g. The board wants to see how we tracked against forecast",
    multiline: true,
    back: "title",
    next: "action",
  },
  action: { ask: "What needs doing?", hint: "e.g. Pull Q3 revenue and costs against forecast", multiline: true, back: "context", next: "outcome" },
  outcome: {
    ask: "What does done look like?",
    hint: "e.g. A one-page summary I can drop into the pack",
    multiline: true,
    back: "action",
    next: "deadline",
  },
};

// Where "back" (said or tapped) goes from each answer.
const BACK: Partial<Record<Step, Step>> = { title: "owner", context: "title", action: "context", outcome: "action", deadline: "outcome" };

/** What Dispatch says aloud for the current question, when Speak questions is on. */
function questionFor(n: Note, people: Person[]): string {
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "this person";
  switch (n.step) {
    case "owner":
      return n.actions.length ? "Who owns the next action?" : "Who owns this action?";
    case "title":
      return "Give it a short title.";
    case "context":
    case "action":
    case "outcome":
      return QUESTIONS[n.step].ask;
    case "deadline":
      return "When is it due?";
    case "another":
      return "Another action?";
    case "cc":
      return `Anyone to copy in on ${name([...groupByOwner(n.actions).keys()][n.ccIndex])}'s email?`;
    case "drafts":
      return "Your emails are ready to copy into Outlook.";
  }
}

function Question({ ask, hint }: { ask: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight">{ask}</h1>
      {hint && <p className="text-[15px] leading-relaxed text-dim">{hint}</p>}
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border-2 border-ink px-4 py-2 text-[15px] font-semibold ${selected ? "bg-sun" : "bg-white"}`}
    >
      {selected ? `✓ ${children}` : children}
    </button>
  );
}

function Buttons({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 pt-1">{children}</div>;
}

function DeadlinePreview({ deadline, pastOk, onPastOk }: { deadline: Deadline | null; pastOk: boolean; onPastOk: () => void }) {
  if (!deadline) return null;
  const box = "rounded-xl border-2 border-ink px-3 py-2.5 text-[15px]";
  switch (deadline.kind) {
    case "ok":
      return (
        <div className={`${box} bg-periwinkle`}>
          <p className="font-bold">Due {formatDeadline(deadline.at)}</p>
          {deadline.moved && <p className="text-sm text-dim">{deadline.moved}.</p>}
        </div>
      );
    case "past":
      return (
        <div className={`${box} bg-candy/40`}>
          <p className="font-bold">That&apos;s in the past: {formatDeadline(deadline.at)}</p>
          {pastOk ? (
            <p className="text-sm">OK, using it anyway.</p>
          ) : (
            <button onClick={onPastOk} className="btn-secondary mt-2">
              Use it anyway
            </button>
          )}
        </div>
      );
    case "vague":
      return (
        <p className={`${box} bg-sun/40`}>
          That&apos;s a bit vague. When exactly? For example: Friday, in 3 days, 25 November.
        </p>
      );
    case "unknown":
      return (
        <p className={`${box} bg-white`}>
          I can&apos;t work out a date from that. Try: Friday, tomorrow at 3pm, in 3 days, 25 November.
        </p>
      );
  }
}

export function NoteFlow() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>(loadPeople);
  const [note, setNote] = useState<Note>(loadNote);
  const [deadline, setDeadline] = useState<Deadline | null>(() =>
    note.answers.deadlineText.trim() ? parseDeadline(note.answers.deadlineText) : null
  );
  const [pastOk, setPastOk] = useState(false);
  const [adding, setAdding] = useState(false);

  // Voice (decision 32).
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [voiceOk] = useState(canListen);
  const [speechOk] = useState(canSpeak);
  const [armed, setArmed] = useState(false); // the iPhone only speaks once a tap has started it
  const [handsFree, setHandsFree] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const sessionRef = useRef<VoiceSession | null>(null);
  const lastSpokenRef = useRef("");
  // The latest note and people, for voice answers that arrive after a render.
  const noteRef = useRef(note);
  const peopleRef = useRef(people);
  useEffect(() => {
    noteRef.current = note;
    peopleRef.current = people;
  }, [note, people]);

  // Save progress on the device after every change.
  useEffect(() => writeLocal(NOTE_KEY, note), [note]);

  const a = note.answers;
  const go = (step: Step) => setNote((n) => ({ ...n, step }));
  const answer = (patch: Partial<Answers>) => setNote((n) => ({ ...n, answers: { ...n.answers, ...patch } }));
  const personById = (id: string) => people.find((p) => p.id === id);
  const ownerIds = [...groupByOwner(note.actions).keys()];
  const hasProgress = note.actions.length > 0 || note.step !== "owner" || a.ownerId !== "";

  // Speak each new question, when Speak questions is on and a tap has allowed it.
  const question = questionFor(note, people);
  const questionKey = `${note.actions.length}:${note.step}:${note.ccIndex}`;
  useEffect(() => {
    if (!settings.speakPrompts || !armed || lastSpokenRef.current === questionKey) return;
    lastSpokenRef.current = questionKey;
    void speak(question);
  }, [settings.speakPrompts, armed, questionKey, question]);

  // Hands-free: each new question starts a new answer.
  useEffect(() => {
    if (handsFree) sessionRef.current?.openWindow();
  }, [handsFree, questionKey]);

  // Stop listening and speaking when leaving the screen.
  useEffect(
    () => () => {
      sessionRef.current?.stop();
      stopSpeaking();
    },
    []
  );

  function startAgain() {
    if (!confirm("Start again? This note's answers will be cleared.")) return;
    stopHandsFree();
    setNote(emptyNote());
    setDeadline(null);
    setPastOk(false);
  }

  /** Adds the action being captured, with this deadline, and moves on to "Another action?". */
  function addActionWith(d: Deadline) {
    if (!("at" in d)) return;
    const deadlineIso = d.at.toISOString();
    setNote((n) => {
      const { ownerId, title, context, action, outcome } = n.answers;
      const captured: CapturedAction = { ownerId, title, context, action, outcome, deadline: deadlineIso };
      return { ...n, actions: [...n.actions, captured], answers: emptyAnswers(), step: "another" };
    });
    setDeadline(null);
    setPastOk(false);
  }

  function addAction() {
    if (!deadline || !("at" in deadline) || (deadline.kind === "past" && !pastOk)) return;
    addActionWith(deadline);
  }

  function removeAction(index: number) {
    if (!confirm(`Remove "${tidyTitle(note.actions[index].title)}"?`)) return;
    setNote((n) => {
      const actions = n.actions.filter((_, i) => i !== index);
      return { ...n, actions, step: actions.length ? n.step : "owner" };
    });
  }

  function buildEmails(n: Note, ppl: Person[]): EmailDraft[] {
    const find = (id: string) => ppl.find((p) => p.id === id);
    return [...groupByOwner(n.actions).entries()].flatMap(([ownerId, actions]) => {
      const owner = find(ownerId);
      if (!owner) return [];
      const ccPeople = (n.cc[ownerId] ?? []).map(find).filter((p): p is Person => !!p);
      return [buildDraft(owner, actions, ccPeople)];
    });
  }

  /** On to the next email's CC question, or to the finished emails after the last one. */
  function nextCc() {
    const current = noteRef.current;
    const ppl = peopleRef.current;
    const lastOne = current.ccIndex + 1 >= groupByOwner(current.actions).size;
    if (lastOne) stopHandsFree(); // copying into Outlook needs taps anyway
    setNote((n) =>
      n.ccIndex + 1 < groupByOwner(n.actions).size
        ? { ...n, ccIndex: n.ccIndex + 1 }
        : { ...n, emails: buildEmails(n, ppl), emailIndex: 0, copied: [], step: "drafts" }
    );
  }

  /**
   * Applies a spoken answer to the current question. Returns null if it was used, or what to tell you if not.
   * Reads the latest note from a ref, because answers arrive after the render that started listening.
   */
  function applyVoiceAnswer(said: string): string | null {
    const n = noteRef.current;
    const ppl = peopleRef.current;
    const text = said.trim();
    if (!text) return "I didn't hear anything. Try again, or type your answer.";
    const back = BACK[n.step];
    if (isBack(text) && back) {
      go(back);
      return null;
    }
    switch (n.step) {
      case "owner": {
        const found = matchPeople(ppl, text);
        if (found.length === 1) {
          setNote((m) => ({ ...m, answers: { ...m.answers, ownerId: found[0].id }, step: "title" }));
          return null;
        }
        return found.length > 1
          ? `More than one person matches "${text}". Tap the one you mean.`
          : `"${text}" isn't on your people list. Tap someone, or add them as someone new.`;
      }
      case "title":
      case "context":
      case "action":
      case "outcome": {
        const step = n.step;
        setNote((m) => ({ ...m, answers: { ...m.answers, [step]: text } as Answers, step: QUESTIONS[step].next }));
        return null;
      }
      case "deadline": {
        const d = parseDeadline(text);
        answer({ deadlineText: text });
        setDeadline(d);
        setPastOk(false);
        if (d.kind === "ok") {
          addActionWith(d);
          return null;
        }
        if (d.kind === "past") return `That's in the past: ${formatDeadline(d.at)}. Say another date, or tap Use it anyway.`;
        if (d.kind === "vague") return "That's a bit vague. When exactly?";
        return `I couldn't work out a date from "${text}". Try Friday, in 3 days, or 25 November.`;
      }
      case "another": {
        const choice = yesOrNo(text);
        if (choice === "yes") go("owner");
        else if (choice === "no") setNote((m) => ({ ...m, ccIndex: 0, step: "cc" }));
        else return "Say yes for another action, or no if that's everything.";
        return null;
      }
      case "cc": {
        const ownerId = [...groupByOwner(n.actions).keys()][n.ccIndex];
        if (isNoOne(text)) {
          setNote((m) => ({ ...m, cc: { ...m.cc, [ownerId]: [] } }));
          nextCc();
          return null;
        }
        const others = ppl.filter((p) => p.id !== ownerId);
        const ids: string[] = [];
        const unknown: string[] = [];
        for (const name of splitNames(text)) {
          const found = matchPeople(others, name);
          if (found.length === 1) ids.push(found[0].id);
          else unknown.push(name);
        }
        if (unknown.length || !ids.length)
          return `I didn't recognise ${unknown.map((u) => `"${u}"`).join(" or ") || "that"}. Say their names, or say no one.`;
        setNote((m) => ({ ...m, cc: { ...m.cc, [ownerId]: [...new Set(ids)] } }));
        nextCc();
        return null;
      }
      default:
        return null;
    }
  }

  /** "Answer by voice": listens for one answer. Starts inside the tap, as the iPhone requires. */
  function answerByVoice() {
    stopSpeaking();
    sessionRef.current?.stop();
    setVoiceMessage("");
    setHeard("");
    const session = new VoiceSession({
      keepOpen: false,
      // On iPhone: a single-phrase listen that the iPhone ends itself, exactly as in test 6 round 7 (5 of 5).
      // Cutting its mic off after it has heard words stops it hearing anything for minutes.
      continuous: !isIPhone(),
      waitForBrowserEnd: isIPhone(),
      onListening: setListening,
      onWords: setHeard,
      onProblem: setVoiceMessage,
      onAnswer: (text) => {
        const problem = applyVoiceAnswer(text);
        setVoiceMessage(problem ?? "");
        setHeard(problem ? text : "");
        if (problem && settings.speakPrompts && armed) void speak(problem);
      },
    });
    sessionRef.current = session;
    if (session.start()) session.openWindow();
  }

  /** "Go hands-free": one listening session for the rest of the note, with questions on screen only. */
  function startHandsFree() {
    stopSpeaking();
    sessionRef.current?.stop();
    setVoiceMessage("");
    setHeard("");
    const session = new VoiceSession({
      keepOpen: true,
      onListening: setListening,
      onWords: setHeard,
      onProblem: setVoiceMessage,
      onAnswer: (text) => {
        const problem = applyVoiceAnswer(text);
        setVoiceMessage(problem ?? "");
        setHeard(problem ? text : "");
        if (problem) session.openWindow(); // same question again
      },
    });
    sessionRef.current = session;
    if (session.start()) {
      setHandsFree(true);
      session.openWindow();
    }
  }

  function stopHandsFree() {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setHandsFree(false);
    setListening(false);
    setHeard("");
  }

  /** Speak questions on or off. Turning it on reads the current question (the tap lets the iPhone speak). */
  function toggleSpeak() {
    const next = { ...settings, speakPrompts: !settings.speakPrompts };
    setSettings(next);
    saveSettings(next);
    if (next.speakPrompts) {
      stopHandsFree(); // decision 32: spoken questions mean a tap per answer
      hearQuestion();
    } else {
      stopSpeaking();
    }
  }

  function hearQuestion() {
    setArmed(true);
    lastSpokenRef.current = questionKey;
    void speak(question);
  }

  async function copy(part: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNote((n) => {
        const key = `${n.emailIndex}:${part}`;
        return n.copied.includes(key) ? n : { ...n, copied: [...n.copied, key] };
      });
    } catch {
      alert("Couldn't copy automatically. Select the text and copy it by hand.");
    }
  }

  function finish() {
    if (!confirm("Finished with this note? It will be cleared from this device.")) return;
    setNote(emptyNote());
    router.push("/");
  }

  // Where you are, above each question.
  let progress = "";
  if (ACTION_STEPS.includes(note.step)) progress = `Action ${note.actions.length + 1} · question ${ACTION_STEPS.indexOf(note.step) + 1} of 6`;
  else if (note.step === "another") progress = `${note.actions.length} action${note.actions.length === 1 ? "" : "s"} so far`;
  else if (note.step === "cc") progress = `Copying people in · email ${note.ccIndex + 1} of ${ownerIds.length}`;
  else progress = `Email ${note.emailIndex + 1} of ${note.emails.length}`;

  let body: ReactNode;
  switch (note.step) {
    case "owner":
      body = (
        <>
          <Question ask="Who owns this action?" hint="Each action has one owner. You can copy other people in later." />
          {people.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <Chip
                  key={p.id}
                  selected={a.ownerId === p.id}
                  onClick={() => setNote((n) => ({ ...n, answers: { ...n.answers, ownerId: p.id }, step: "title" }))}
                >
                  {p.name}
                </Chip>
              ))}
            </div>
          )}
          {adding || people.length === 0 ? (
            <div className="space-y-3 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
              <p className="font-semibold">{people.length ? "Someone new" : "Add the first person you delegate to"}</p>
              <PersonForm
                submitLabel="Add and choose"
                onSubmit={(name, email) => {
                  const person = makePerson(name, email);
                  const next = [...people, person];
                  setPeople(next);
                  savePeople(next);
                  setAdding(false);
                  setNote((n) => ({ ...n, answers: { ...n.answers, ownerId: person.id }, step: "title" }));
                }}
                onCancel={people.length ? () => setAdding(false) : undefined}
              />
            </div>
          ) : (
            <Buttons>
              <button onClick={() => setAdding(true)} className="btn-secondary">
                ＋ Someone new
              </button>
              {note.actions.length > 0 && (
                <button onClick={() => go("another")} className="btn-secondary">
                  Back
                </button>
              )}
            </Buttons>
          )}
        </>
      );
      break;

    case "title":
    case "context":
    case "action":
    case "outcome": {
      const step = note.step;
      const q = QUESTIONS[step];
      const value = a[step];
      const props = {
        value,
        onChange: (e: { target: { value: string } }) => answer({ [step]: e.target.value } as Partial<Answers>),
        placeholder: "Type, or tap the mic on your keyboard",
        className: inputClass,
      };
      body = (
        <>
          <p className="text-[15px]">
            For <b>{personById(a.ownerId)?.name ?? "?"}</b>
            {step !== "title" && a.title && <> · {tidyTitle(a.title)}</>}
          </p>
          <Question ask={q.ask} hint={q.hint} />
          {q.multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
          <Buttons>
            <button onClick={() => go(q.next)} disabled={!value.trim()} className="btn-primary">
              Next
            </button>
            <button onClick={() => go(q.back)} className="btn-secondary">
              Back
            </button>
          </Buttons>
        </>
      );
      break;
    }

    case "deadline":
      body = (
        <>
          <p className="text-[15px]">
            For <b>{personById(a.ownerId)?.name ?? "?"}</b> · {tidyTitle(a.title)}
          </p>
          <Question ask="When is it due?" hint="e.g. Friday, tomorrow at 3pm, in 3 days, 25 November. With no time, it's 17:30." />
          <input
            value={a.deadlineText}
            onChange={(e) => {
              answer({ deadlineText: e.target.value });
              setDeadline(e.target.value.trim() ? parseDeadline(e.target.value) : null);
              setPastOk(false);
            }}
            placeholder="Type, or tap the mic on your keyboard"
            className={inputClass}
          />
          <DeadlinePreview deadline={deadline} pastOk={pastOk} onPastOk={() => setPastOk(true)} />
          <Buttons>
            <button
              onClick={addAction}
              disabled={!(deadline?.kind === "ok" || (deadline?.kind === "past" && pastOk))}
              className="btn-primary"
            >
              Add action
            </button>
            <button onClick={() => go("outcome")} className="btn-secondary">
              Back
            </button>
          </Buttons>
        </>
      );
      break;

    case "another":
      body = (
        <>
          <Question ask="Another action?" />
          <ul className="space-y-2">
            {note.actions.map((act, i) => (
              <li key={i} className="flex items-center gap-3 rounded-[18px] border-2 border-ink bg-white p-3 shadow-pop">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{tidyTitle(act.title)}</span>
                  <span className="block text-sm text-dim">
                    {personById(act.ownerId)?.name ?? "?"} · {formatDay(new Date(act.deadline))}
                  </span>
                </span>
                <button onClick={() => removeAction(i)} className="text-sm font-semibold text-dim underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <button onClick={() => go("owner")} className="btn-primary">
              Yes, add another
            </button>
            <button onClick={() => setNote((n) => ({ ...n, ccIndex: 0, step: "cc" }))} className="btn-secondary">
              No, that&apos;s everything
            </button>
          </div>
        </>
      );
      break;

    case "cc": {
      const ownerId = ownerIds[note.ccIndex];
      const selected = note.cc[ownerId] ?? [];
      const toggle = (id: string) =>
        setNote((n) => {
          const current = n.cc[ownerId] ?? [];
          const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
          return { ...n, cc: { ...n.cc, [ownerId]: next } };
        });
      const others = people.filter((p) => p.id !== ownerId);
      body = (
        <>
          <Question
            ask={`Anyone to copy in on ${personById(ownerId)?.name ?? "this"}'s email?`}
            hint={others.length ? "Tap everyone to copy in." : "There's no one else on your people list yet."}
          />
          <div className="flex flex-wrap gap-2">
            {others.map((p) => (
              <Chip key={p.id} selected={selected.includes(p.id)} onClick={() => toggle(p.id)}>
                {p.name}
              </Chip>
            ))}
          </div>
          <Buttons>
            <button onClick={nextCc} className="btn-primary">
              {selected.length ? "Done" : "No one"}
            </button>
            <button
              onClick={() => (note.ccIndex ? setNote((n) => ({ ...n, ccIndex: n.ccIndex - 1 })) : go("another"))}
              className="btn-secondary"
            >
              Back
            </button>
          </Buttons>
        </>
      );
      break;
    }

    case "drafts": {
      const email = note.emails[note.emailIndex];
      if (!email) {
        body = <p>Nothing to send. Start again to write a note.</p>;
        break;
      }
      const owner = personById(email.ownerId);
      const done = (part: string) => note.copied.includes(`${note.emailIndex}:${part}`);
      const edit = (patch: Partial<EmailDraft>) =>
        setNote((n) => ({ ...n, emails: n.emails.map((e, i) => (i === n.emailIndex ? { ...e, ...patch } : e)) }));
      const copyButton = (part: string, text: string) => (
        <button onClick={() => copy(part, text)} className={done(part) ? "btn-secondary" : "btn-primary"}>
          {done(part) ? "✓ Copied" : "Copy"}
        </button>
      );
      const nextEmail = note.emails[note.emailIndex + 1];
      body = (
        <>
          <Question ask={`${owner?.name ?? "Their"}'s email`} hint="Paste each part into a new email in Outlook. Copied parts get a tick." />
          <div className="space-y-4 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold tracking-[0.06em] text-dim uppercase">To</span>
                <span className="block truncate">{email.to}</span>
              </span>
              {copyButton("to", email.to)}
            </div>
            {email.cc.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold tracking-[0.06em] text-dim uppercase">CC</span>
                  <span className="block truncate">{email.cc.join("; ")}</span>
                </span>
                {copyButton("cc", email.cc.join("; "))}
              </div>
            )}
            <label className="block space-y-1">
              <span className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold tracking-[0.06em] text-dim uppercase">Subject</span>
                {copyButton("subject", email.subject)}
              </span>
              <input value={email.subject} onChange={(e) => edit({ subject: e.target.value })} className={inputClass} />
            </label>
            <label className="block space-y-1">
              <span className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold tracking-[0.06em] text-dim uppercase">Body</span>
                {copyButton("body", email.body)}
              </span>
              <textarea value={email.body} onChange={(e) => edit({ body: e.target.value })} rows={14} className={inputClass} />
            </label>
          </div>
          <div className="flex flex-col gap-3">
            {nextEmail ? (
              <button onClick={() => setNote((n) => ({ ...n, emailIndex: n.emailIndex + 1 }))} className="btn-primary">
                Next: {personById(nextEmail.ownerId)?.name ?? "next"}&apos;s email
              </button>
            ) : (
              <button onClick={finish} className="btn-primary">
                Finish
              </button>
            )}
            {note.emailIndex > 0 && (
              <button onClick={() => setNote((n) => ({ ...n, emailIndex: n.emailIndex - 1 }))} className="btn-secondary">
                Previous email
              </button>
            )}
          </div>
        </>
      );
      break;
    }
  }

  const showVoice = voiceOk && note.step !== "drafts";
  const pill = "rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold";
  return (
    <div className="space-y-6">
      <TopBar
        right={
          hasProgress ? (
            <button onClick={startAgain} className="text-sm font-semibold text-dim underline">
              Start again
            </button>
          ) : (
            <Link href="/people" className="text-sm font-semibold text-dim underline">
              People
            </Link>
          )
        }
      />
      {showVoice && (
        <div className="flex flex-wrap gap-2">
          {speechOk && (
            <button
              onClick={toggleSpeak}
              aria-pressed={settings.speakPrompts}
              className={`${pill} ${settings.speakPrompts ? "bg-sun" : "bg-white"}`}
            >
              🔊 Speak questions: {settings.speakPrompts ? "on" : "off"}
            </button>
          )}
          {settings.speakPrompts && !armed && (
            <button onClick={hearQuestion} className={`${pill} bg-white`}>
              Hear this question
            </button>
          )}
          {!settings.speakPrompts &&
            (handsFree ? (
              <button onClick={stopHandsFree} className={`${pill} bg-sun`}>
                🎙 Hands-free on · tap to stop
              </button>
            ) : (
              <button onClick={startHandsFree} className={`${pill} bg-white`}>
                🎙 Go hands-free
              </button>
            ))}
        </div>
      )}
      <p className="text-xs font-bold tracking-[0.06em] text-dim uppercase">{progress}</p>
      <div className="space-y-4">{body}</div>
      {showVoice && (listening || heard || voiceMessage) && (
        <div
          aria-live="polite"
          className={`space-y-1 rounded-xl border-2 border-ink px-3 py-2.5 ${listening ? "bg-sun shadow-pop" : "bg-periwinkle"}`}
        >
          {listening && <p className="font-bold">🎙 Listening – speak now</p>}
          {heard && <p className="font-mono text-sm">&ldquo;{heard}&rdquo;</p>}
          {voiceMessage && <p className="text-[15px]">{voiceMessage}</p>}
        </div>
      )}
      {showVoice && !handsFree && !listening && (
        <button onClick={answerByVoice} className="btn-secondary w-full py-3">
          🎙 Answer by voice
        </button>
      )}
    </div>
  );
}
