"use client";

// Phase 0 spike: checks what an installed web app can do on iPhone (and desktop)
// before we build on it. See DispatchSpec.md §9 and §14.

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AppIcon } from "@/components/brand";

/* ---------- small helpers ---------- */

type Verdict = { result?: string; note?: string };
type Verdicts = Record<string, Verdict>;

const STORAGE_KEY = "dispatch-spike-v1";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const TESTS: { id: string; title: string; options?: string[] }[] = [
  { id: "install", title: "1. Installed from Home Screen" },
  { id: "mic", title: "2. Record from the microphone" },
  { id: "mic-repeat", title: "3. Microphone permission after reopening", options: ["Didn't ask again", "Asked again"] },
  { id: "stt", title: "4. Built-in speech recognition", options: ["Accurate", "Some mistakes", "Didn't work"] },
  { id: "stt-diag", title: "4b. Speech recognition, detailed", options: ["Worked in app", "Worked in Safari only", "Failed in both"] },
  { id: "tts", title: "5. Read aloud" },
  { id: "tts-silent", title: "5b. Read aloud with silent mode ON", options: ["A worked", "B worked", "Both worked", "Neither"] },
  { id: "clip-silent", title: "5c. Recorded voice clip with silent mode ON", options: ["Heard it", "No sound"] },
  { id: "handsfree", title: "6. Hands-free conversation" },
  { id: "push", title: "7. Notifications" },
  { id: "badge", title: "8. App icon badge" },
  { id: "wake", title: "9. Keep the screen awake" },
  { id: "copy", title: "10. Copy into Outlook" },
  { id: "siri", title: "11. Siri Shortcut", options: ["Opened the app", "Opened Safari", "Didn't work"] },
  { id: "desktop", title: "12. Desktop install (on your PC)" },
];
const DEFAULT_OPTIONS = ["Worked", "Partly", "Didn't work"];

type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onsoundstart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
  onsoundend?: (() => void) | null;
  onaudioend?: (() => void) | null;
  onnomatch?: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

// How often the mic and the voice have been used since the app was opened. Test 6 logs these to
// check whether earlier tests leave something behind that stops the mic hearing words.
const usage = { listens: 0, speaks: 0 };

function getRecognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function detectEnv() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return {
    userAgent: nav.userAgent,
    installed: window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true,
    secure: window.isSecureContext,
    microphone: !!nav.mediaDevices?.getUserMedia,
    mediaRecorder: typeof MediaRecorder !== "undefined",
    speechRecognition: !!getRecognitionCtor(),
    speechSynthesis: "speechSynthesis" in window,
    wakeLock: "wakeLock" in nav,
    badge: "setAppBadge" in nav,
    push: "serviceWorker" in nav && "PushManager" in window,
    notifications: "Notification" in window,
    clipboard: !!nav.clipboard?.writeText,
  };
}
type Env = ReturnType<typeof detectEnv>;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function loadVerdicts(): Verdicts {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Verdicts;
  } catch {
    return {};
  }
}

const SAMPLE_SUBJECT = "Q3 board numbers – by Fri 21 Nov";
const SAMPLE_BODY = `Hi Priya,

Can you own getting the Q3 numbers ready for the board pack?

Context: The board meets on the 25th and wants to see how we tracked against forecast.
Action: Pull Q3 revenue and costs against forecast, with a line on any variance over 5%.
Outcome: A one-page summary I can drop straight into the pack.
Deadline: 17:30, Fri 21 Nov

Thanks, Killian`;

const noopSubscribe = () => () => {};

/* ---------- page ---------- */

export default function SpikePage() {
  // Render only in the browser, so device checks and saved answers never mismatch the server render.
  const inBrowser = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return inBrowser ? <Spike /> : <p className="p-6">Loading tests…</p>;
}

function Spike() {
  const [env] = useState<Env>(detectEnv);
  const [verdicts, setVerdicts] = useState<Verdicts>(loadVerdicts);
  const [auto, setAuto] = useState<Record<string, string>>({});
  const [copiedAll, setCopiedAll] = useState(false);

  const note = (id: string, text: string) => setAuto((a) => ({ ...a, [id]: text }));

  function setVerdict(id: string, patch: Verdict) {
    setVerdicts((v) => {
      const next = { ...v, [id]: { ...v[id], ...patch } };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: answers just won't survive a reload */
      }
      return next;
    });
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch((e) => setAuto((a) => ({ ...a, push: `Service worker failed: ${String(e)}` })));
    }
  }, []);

  function resultsText() {
    const supports = Object.entries(env)
      .filter(([k]) => k !== "userAgent")
      .map(([k, v]) => `${k}: ${v ? "yes" : "no"}`)
      .join(", ");
    const lines = [
      "Dispatch – Phase 0 test results",
      `Date: ${new Date().toLocaleString("en-GB")}`,
      `Device: ${env.userAgent}`,
      `Supports: ${supports}`,
      "",
      ...TESTS.map((t) => {
        const v = verdicts[t.id] ?? {};
        const parts = [`${t.title}: ${v.result ?? "(not tested)"}`];
        if (v.note) parts.push(`  Note: ${v.note}`);
        if (auto[t.id]) parts.push(`  Detected: ${auto[t.id]}`);
        return parts.join("\n");
      }),
    ];
    return lines.join("\n");
  }

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(resultsText());
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 3000);
    } catch {
      alert("Couldn't copy automatically. Select the results box at the bottom and copy it by hand.");
    }
  }

  const card = (id: string, children: ReactNode) => {
    const t = TESTS.find((x) => x.id === id)!;
    return (
      <TestCard key={id} title={t.title} options={t.options ?? DEFAULT_OPTIONS} verdict={verdicts[id] ?? {}} onVerdict={(p) => setVerdict(id, p)}>
        {children}
      </TestCard>
    );
  };

  return (
    <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Dispatch home">
            <AppIcon size={40} outlined />
            <span className="font-display text-[24px] leading-none font-extrabold tracking-tight">dispatch</span>
          </Link>
          <Link href="/admin" className="btn-secondary">
            ← Admin
          </Link>
        </div>
        <h1 className="pt-2 font-display text-[34px] leading-none font-extrabold tracking-tight">Phase 0 tests</h1>
        <p className="text-[15px] leading-relaxed text-dim">
          Work down the list on your iPhone, using the app opened from your Home Screen. After each test, tap how it went
          (add a note if anything was odd). When you&apos;re done, tap <b className="text-ink">Copy results</b> and paste
          them to Claude.
        </p>
        <button onClick={copyResults} className="btn-primary">
          {copiedAll ? "Copied ✓" : "Copy results"}
        </button>
      </header>

      {card("install", <InstallTest env={env} />)}
      {card("mic", <MicTest onInfo={(t) => note("mic", t)} />)}
      {card(
        "mic-repeat",
        <p>
          Fully close Dispatch (swipe up from the bottom and flick it away), open it again from the Home Screen, scroll
          back to test 2 and record again. Did the iPhone ask for microphone permission again?
        </p>
      )}
      {card("stt", <SpeechRecognitionTest env={env} onInfo={(t) => note("stt", t)} />)}
      {card("stt-diag", <SpeechRecognitionDiagTest env={env} onInfo={(t) => note("stt-diag", t)} />)}
      {card("tts", <ReadAloudTest env={env} onInfo={(t) => note("tts", t)} />)}
      {card("tts-silent", <ReadAloudSilentTest env={env} onInfo={(t) => note("tts-silent", t)} />)}
      {card("clip-silent", <VoiceClipTest onInfo={(t) => note("clip-silent", t)} />)}
      {card("handsfree", <HandsFreeTest env={env} onInfo={(t) => note("handsfree", t)} />)}
      {card("push", <PushTest env={env} onInfo={(t) => note("push", t)} />)}
      {card("badge", <BadgeTest env={env} onInfo={(t) => note("badge", t)} />)}
      {card("wake", <WakeLockTest env={env} onInfo={(t) => note("wake", t)} />)}
      {card("copy", <CopyTest />)}
      {card("siri", <SiriTest />)}
      {card("desktop", <DesktopTest />)}

      <section className="space-y-3">
        <h2 className="font-display text-[26px] leading-none font-extrabold tracking-tight">Results</h2>
        <button onClick={copyResults} className="btn-primary">
          {copiedAll ? "Copied ✓" : "Copy results"}
        </button>
        <textarea
          readOnly
          value={resultsText()}
          className="h-64 w-full rounded-xl border-2 border-ink bg-white p-2 font-mono text-xs text-ink"
        />
      </section>

      <Link href="/admin" className="btn-secondary w-full">
        ← Back to Admin
      </Link>
    </main>
  );
}

/* ---------- shared card ---------- */

function TestCard(props: {
  title: string;
  options: string[];
  verdict: Verdict;
  onVerdict: (p: Verdict) => void;
  children: ReactNode;
}) {
  const { title, options, verdict, onVerdict, children } = props;
  return (
    <section className="space-y-3 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
      <h2 className="font-display text-[19px] leading-tight font-extrabold tracking-tight">{title}</h2>
      <div className="space-y-2 text-[15px] leading-relaxed">{children}</div>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onVerdict({ result: o })}
            aria-pressed={verdict.result === o}
            className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold ${verdict.result === o ? "bg-sun" : "bg-white"}`}
          >
            {verdict.result === o ? `✓ ${o}` : o}
          </button>
        ))}
      </div>
      <input
        value={verdict.note ?? ""}
        onChange={(e) => onVerdict({ note: e.target.value })}
        placeholder="Note (optional)"
        className="w-full rounded-xl border-2 border-ink bg-white px-3 py-2 text-base placeholder:text-dim"
      />
    </section>
  );
}

function Status({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-periwinkle px-3 py-2 font-mono text-xs text-ink">{children}</p>;
}

/* ---------- individual tests ---------- */

function InstallTest({ env }: { env: Env }) {
  return (
    <>
      <p>
        On iPhone: open this page in Safari, tap <b>Share</b> → <b>Add to Home Screen</b> → <b>Add</b>, then open Dispatch
        from the new Home Screen icon and come back to this page.
      </p>
      <Status>
        Opened as installed app: {env.installed ? "yes ✓" : "no – you're in the browser"} · Secure (https): {env.secure ? "yes" : "no"}
      </Status>
    </>
  );
}

function MicTest({ onInfo }: { onInfo: (t: string) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const startRef = useRef(0);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
        (m) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(m)
      );
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(blob));
        const secs = ((Date.now() - startRef.current) / 1000).toFixed(1);
        const info = `${secs}s, ${(blob.size / 1024).toFixed(0)} KB, format ${rec.mimeType || "unknown"}`;
        setMsg(info);
        onInfo(info);
        setState("done");
      };
      recRef.current = rec;
      startRef.current = Date.now();
      rec.start();
      setState("recording");
      setMsg("Recording… say a sentence, then tap Stop.");
    } catch (e) {
      const info = `Could not start: ${String(e)}`;
      setMsg(info);
      onInfo(info);
      setState("error");
    }
  }

  return (
    <>
      <p>Tap Record, say a sentence, tap Stop, then play it back. Note whether the iPhone asked for microphone permission.</p>
      <div className="flex gap-2">
        {state !== "recording" ? (
          <button onClick={start} className="btn-primary">● Record</button>
        ) : (
          <button onClick={() => recRef.current?.stop()} className="btn-primary">■ Stop</button>
        )}
      </div>
      {msg && <Status>{msg}</Status>}
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}
    </>
  );
}

type ListenOptions = {
  onPartial?: (t: string) => void;
  /** Gets a plain-English line for every recogniser event, for the step-by-step logs. */
  onEvent?: (e: string) => void;
  /** Called once the mic is actually listening, so the screen can say "speak now". */
  onListening?: () => void;
  /** End the turn after this long with no new words. */
  silenceMs?: number;
  /**
   * How a turn ends once you've paused: "stop" (Dispatch calls stop(), the original way), "abort"
   * (Dispatch calls abort()), or "iphone" (Dispatch waits for the iPhone to end it, and only aborts
   * if it hasn't after 6 seconds). With no words at all, "stop" stops and the others abort.
   */
  endWith?: TurnEnd;
};

type TurnEnd = "iphone" | "abort" | "stop";

type ListenResult = {
  text: string;
  error?: string;
  /** Short names of the recogniser events that fired before the turn ended, in order. */
  events: string[];
  /** Who ended the turn: the iPhone, or Dispatch by stop() or abort(). */
  endedBy: string;
  /** Milliseconds from start() to the "mic started" event. Broken sessions have started almost instantly. */
  startDelay?: number;
};

// When the mic was last used, kept across app restarts, to measure how long the iPhone takes to recover.
const LAST_MIC_KEY = "dispatch-spike-last-mic";
type LastMic = { at: number; endedBy: string; heard: boolean };

function rememberMicUse(endedBy: string, heard: boolean) {
  try {
    window.localStorage.setItem(LAST_MIC_KEY, JSON.stringify({ at: Date.now(), endedBy, heard } satisfies LastMic));
  } catch {
    /* storage unavailable */
  }
}

function readLastMic(): LastMic | null {
  try {
    return JSON.parse(window.localStorage.getItem(LAST_MIC_KEY) ?? "null") as LastMic | null;
  } catch {
    return null;
  }
}

function describeLastMic(last: LastMic | null, now = Date.now()) {
  if (!last) return "none recorded";
  const secs = Math.max(0, Math.round((now - last.at) / 1000));
  const ago = secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
  return `${ago} ago, ended by ${last.endedBy}, ${last.heard ? "heard words" : "heard nothing"}`;
}

// Plain-English labels for the recogniser's events, for the logs.
const EVENT_LABELS: Record<string, string> = {
  start: "mic started",
  audiostart: "mic capturing audio",
  soundstart: "mic heard sound",
  speechstart: "mic heard speech",
  speechend: "speech ended",
  soundend: "sound ended",
  audioend: "mic stopped capturing",
  nomatch: "no match",
  end: "mic stopped",
};

/**
 * Listens for one reply. `timeoutMs` is how long to wait for the first words; with
 * `silenceMs` set, it then stops once the words stop changing for that long.
 */
function listenOnce(
  timeoutMs: number,
  { onPartial, onEvent, onListening, silenceMs, endWith = "stop" }: ListenOptions = {}
): Promise<ListenResult> {
  return new Promise((resolve) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return resolve({ text: "", error: "not supported", events: [], endedBy: "not supported" });
    usage.listens++;
    const startedAt = Date.now();
    let startDelay: number | undefined;
    let endedBy = "iPhone";
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = false;
    // Pause detection needs the words as they come in.
    rec.interimResults = !!onPartial || !!silenceMs;
    let text = "";
    let error: string | undefined;
    let settled = false;
    let stopping = false;
    let listening = false;
    const events: string[] = [];
    // Anything after the turn has ended is marked "late": words arriving then would have been missed.
    const log = (name: string, line: string) => {
      if (!settled) events.push(name);
      onEvent?.(`${settled ? "(late) " : ""}${line}`);
    };
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      rememberMicUse(endedBy, !!text.trim());
      resolve({ text: text.trim(), error, events, endedBy, startDelay });
    };
    const stopMic = (why: string | undefined, how: "stop" | "abort") => {
      if (stopping) return;
      stopping = true;
      endedBy = how === "abort" ? "Dispatch abort" : "Dispatch stop";
      if (why) onEvent?.(why);
      try {
        if (how === "abort") rec.abort();
        else rec.stop();
      } catch {
        /* already stopped */
      }
      // Safety net in case the browser never fires "end".
      setTimeout(finish, 3000);
    };
    // After words: stop or abort once you've paused, or give the iPhone 6 seconds to end the turn itself.
    const afterWords = () =>
      endWith === "iphone"
        ? stopMic("the iPhone didn't end the turn within 6s of your last words; aborting", "abort")
        : stopMic(`pause detected (${(silenceMs ?? 0) / 1000}s), ${endWith === "abort" ? "aborting" : "stopping"} mic`, endWith);
    const markListening = () => {
      if (listening) return;
      listening = true;
      onListening?.();
    };
    rec.onstart = () => {
      if (startDelay === undefined) startDelay = Date.now() - startedAt;
      log("start", `${EVENT_LABELS.start} (${(startDelay / 1000).toFixed(1)}s after asking)`);
      markListening();
    };
    rec.onaudiostart = () => {
      log("audiostart", EVENT_LABELS.audiostart);
      markListening();
    };
    rec.onsoundstart = () => log("soundstart", EVENT_LABELS.soundstart);
    rec.onspeechstart = () => log("speechstart", EVENT_LABELS.speechstart);
    rec.onspeechend = () => log("speechend", EVENT_LABELS.speechend);
    rec.onsoundend = () => log("soundend", EVENT_LABELS.soundend);
    rec.onaudioend = () => log("audioend", EVENT_LABELS.audioend);
    rec.onnomatch = () => log("nomatch", EVENT_LABELS.nomatch);
    rec.onresult = (e) => {
      const next = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      const last = e.results[e.results.length - 1];
      const isFinal = !!last?.isFinal;
      log(isFinal ? "final" : "words", `${isFinal ? "final words" : "words so far"}: "${next.trim()}"`);
      if (settled || next === text) return;
      text = next;
      onPartial?.(text);
      if (silenceMs) {
        clearTimeout(timer);
        timer = setTimeout(afterWords, endWith === "iphone" ? 6000 : silenceMs);
      }
    };
    rec.onerror = (e) => {
      if (!settled) error = e.error;
      log("error", `mic ERROR: ${e.error}`);
    };
    rec.onend = () => {
      log("end", EVENT_LABELS.end);
      finish();
    };
    const noWordsHow = endWith === "stop" ? "stop" : "abort";
    let timer = setTimeout(
      () => stopMic(silenceMs ? `no words after ${timeoutMs / 1000}s, ${noWordsHow === "abort" ? "aborting" : "stopping"} mic` : undefined, noWordsHow),
      timeoutMs
    );
    try {
      rec.start();
    } catch (e) {
      error = String(e);
      endedBy = "start failed";
      onEvent?.(`mic start() failed: ${error}`);
      finish();
    }
  });
}

function SpeechRecognitionTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  async function go() {
    setListening(true);
    setText("");
    setErr("");
    const r = await listenOnce(12000, { onPartial: setText });
    setListening(false);
    setText(r.text);
    if (r.error) setErr(r.error);
    onInfo(`Heard: "${r.text}"${r.error ? ` (error: ${r.error})` : ""}`);
  }

  if (!env.speechRecognition) return <Status>Built-in speech recognition isn&apos;t available here.</Status>;
  return (
    <>
      <p>
        Tap Listen and say: <i>&ldquo;Priya, can you send the Q3 numbers to finance by Friday? Copy in Tom.&rdquo;</i> Check how
        accurate the words below are, especially the names.
      </p>
      <button onClick={go} disabled={listening} className="btn-primary">
        {listening ? "Listening…" : "🎙 Listen"}
      </button>
      {(text || err) && <Status>{text || "(nothing heard)"}{err && ` · error: ${err}`}</Status>}
    </>
  );
}

// Logs every event the recogniser fires, so we can see exactly where it stops.
function SpeechRecognitionDiagTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const all = useRef<string[]>([]);

  function run(mode: "simple" | "continuous") {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const where = env.installed ? "app" : "Safari";
    const t0 = Date.now();
    const add = (l: string) => {
      all.current = [...all.current, `[${where} ${mode} ${((Date.now() - t0) / 1000).toFixed(1)}s] ${l}`];
      setLines(all.current);
      onInfo(all.current.join(" | "));
    };
    setBusy(true);
    usage.listens++;
    const rec = new Ctor() as Recognition & Record<string, unknown>;
    rec.lang = "en-GB";
    rec.continuous = mode === "continuous";
    rec.interimResults = mode === "continuous";
    for (const ev of ["start", "audiostart", "soundstart", "speechstart", "speechend", "soundend", "audioend", "nomatch"]) {
      rec[`on${ev}`] = () => add(ev);
    }
    rec.onresult = (e) =>
      add(
        `result: "${Array.from(e.results)
          .map((r) => r[0]?.transcript ?? "")
          .join(" ")}"`
      );
    rec.onerror = (e) => add(`ERROR: ${e.error}`);
    rec.onend = () => {
      add("end");
      setBusy(false);
    };
    try {
      rec.start();
      add("start() called");
    } catch (e) {
      add(`start() threw: ${String(e)}`);
      setBusy(false);
    }
    // Stop after 10 seconds whatever happens.
    setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    }, 10000);
  }

  if (!env.speechRecognition) return <Status>Built-in speech recognition isn&apos;t available here.</Status>;
  return (
    <>
      <p>
        Tap <b>Listen (simple)</b> and say a short sentence. Then tap <b>Listen (continuous)</b> and do the same. Each stops
        on its own within 10 seconds.
      </p>
      <p>
        Do this <b>in the installed app</b> first. Then open <b>dispatch-85on.vercel.app/spike</b> in <b>Safari</b> and do
        it there too. The grey log shows which one you were in.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => run("simple")} disabled={busy} className="btn-primary">🎙 Listen (simple)</button>
        <button onClick={() => run("continuous")} disabled={busy} className="btn-primary">🎙 Listen (continuous)</button>
      </div>
      {lines.length > 0 && <Status>{lines.map((l, i) => <span key={i} className="block">{l}</span>)}</Status>}
    </>
  );
}

function useVoices(enabled: boolean) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (!enabled) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    const id = setTimeout(load, 0);
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      clearTimeout(id);
      window.speechSynthesis.removeEventListener("voiceschanged", load);
    };
  }, [enabled]);
  return voices;
}

function speak(text: string, voice?: SpeechSynthesisVoice, onEvent?: (e: string) => void): Promise<void> {
  return new Promise((resolve) => {
    usage.speaks++;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    if (voice) u.voice = voice;
    let done = false;
    let started = false;
    const finish = (how: string) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      onEvent?.(how);
      resolve();
    };
    u.onstart = () => {
      started = true;
      onEvent?.("voice started");
    };
    u.onend = () => finish("voice finished");
    u.onerror = (e) => finish(`voice ERROR: ${e.error}`);
    // Safety net in case the browser never fires "end".
    const timer = setTimeout(
      () =>
        finish(
          started
            ? "voice timed out while speaking"
            : `voice NEVER STARTED (speaking=${synth.speaking}, pending=${synth.pending}, paused=${synth.paused})`
        ),
      3000 + text.length * 90
    );
    synth.speak(u);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], name: string) {
  return voices.find((v) => v.name === name) ?? voices.find((v) => v.lang === "en-GB") ?? voices.find((v) => v.lang.startsWith("en"));
}

function ReadAloudTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const voices = useVoices(env.speechSynthesis);
  const [voiceName, setVoiceName] = useState("");
  const gbVoices = voices.filter((v) => v.lang === "en-GB");
  const list = gbVoices.length ? gbVoices : voices.filter((v) => v.lang.startsWith("en"));

  function play() {
    const v = pickVoice(voices, voiceName);
    onInfo(`${voices.length} voices, ${gbVoices.length} en-GB; played with "${v?.name ?? "default"}"`);
    void speak(SAMPLE_BODY.replace(/\n+/g, ". "), v);
  }

  if (!env.speechSynthesis) return <Status>Read-aloud isn&apos;t available here.</Status>;
  return (
    <>
      <p>Tap Play to hear a sample email. Try a couple of voices and note which sounds best.</p>
      <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="w-full rounded-xl border-2 border-ink bg-white px-2 py-2 text-base">
        <option value="">Default British voice</option>
        {list.map((v) => (
          <option key={v.name} value={v.name}>
            {v.name} ({v.lang})
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button onClick={play} className="btn-primary">▶ Play</button>
        <button onClick={() => window.speechSynthesis.cancel()} className="btn-secondary">Stop</button>
      </div>
    </>
  );
}

// Half a second of silence as a WAV file, generated in the browser.
function silentWavUrl() {
  const samples = 4000; // 0.5s at 8kHz, 8-bit mono
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  str(36, "data");
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128); // 128 = silence for 8-bit audio
  return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
}

// Safari's Audio Session API: lets a page say how it uses sound ("playback", "play-and-record", …) and
// reports whether its sound is active or interrupted.
type AudioSessionNav = Navigator & {
  audioSession?: { type: string; state?: string; onstatechange?: (() => void) | null };
};

function ReadAloudSilentTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const voices = useVoices(env.speechSynthesis);
  const [lines, setLines] = useState<string[]>([]);
  const all = useRef<string[]>([]);

  function log(l: string) {
    all.current = [...all.current, l];
    setLines(all.current);
    onInfo(all.current.join(" | "));
  }

  // Speaks and reports what the browser did: started? finished? error?
  function speakWithReport(label: string, done?: () => void) {
    const t0 = Date.now();
    usage.speaks++;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`Test ${label}. This is Dispatch, reading aloud. Can you hear me?`);
    u.lang = "en-GB";
    const v = pickVoice(voices, "");
    if (v) u.voice = v;
    let started = false;
    u.onstart = () => {
      started = true;
      log(`${label}: started speaking`);
    };
    u.onend = () => {
      log(`${label}: finished after ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      done?.();
    };
    u.onerror = (e) => {
      log(`${label}: error "${e.error}"`);
      done?.();
    };
    window.speechSynthesis.speak(u);
    setTimeout(() => {
      if (!started) log(`${label}: never started (speaking=${window.speechSynthesis.speaking}, pending=${window.speechSynthesis.pending})`);
    }, 2500);
  }

  // A: tell Safari this page plays media (which ignores the silent switch), then speak.
  function tryA() {
    const nav = navigator as AudioSessionNav;
    if (!nav.audioSession) {
      log("A: audioSession not available on this device");
      return;
    }
    try {
      nav.audioSession.type = "playback";
      log(`A: audioSession = "${nav.audioSession.type}"`);
    } catch (e) {
      log(`A: couldn't set audioSession: ${String(e)}`);
    }
    speakWithReport("A", () => {
      // Put it back so the other tests behave normally.
      try {
        nav.audioSession!.type = "auto";
      } catch {
        /* ignore */
      }
    });
  }

  // B: play a short silent media clip first, then speak once it has finished.
  function tryB() {
    // Speak a blank first, straight from the tap, so iPhone allows the real speech that comes later.
    usage.speaks++;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(" "));
    const clip = new Audio(silentWavUrl());
    clip.onended = () => {
      log("B: silent clip finished");
      speakWithReport("B");
    };
    clip
      .play()
      .then(() => log("B: silent clip playing"))
      .catch((e) => log(`B: silent clip blocked: ${String(e)}`));
  }

  if (!env.speechSynthesis) return <Status>Read-aloud isn&apos;t available here.</Status>;
  return (
    <>
      <p>
        Turn silent mode <b>on</b> and turn the volume up. Tap <b>Try A</b> and wait 10 seconds, then tap <b>Try B</b> and
        wait 10 seconds. Which one could you hear? (Turn silent mode back afterwards.)
      </p>
      <div className="flex gap-2">
        <button onClick={tryA} className="btn-primary">▶ Try A</button>
        <button onClick={tryB} className="btn-primary">▶ Try B</button>
      </div>
      {lines.length > 0 && <Status>{lines.map((l, i) => <span key={i} className="block">{l}</span>)}</Status>}
    </>
  );
}

// Plays a pre-recorded clip as ordinary media, the way a cloud voice service's audio would be played.
function VoiceClipTest({ onInfo }: { onInfo: (t: string) => void }) {
  const [msg, setMsg] = useState("");
  function play() {
    const a = new Audio("/voice-sample.wav");
    a.onended = () => {
      setMsg("Clip finished playing");
      onInfo("Clip finished playing");
    };
    a.play()
      .then(() => setMsg("Playing…"))
      .catch((e) => {
        setMsg(`Blocked: ${String(e)}`);
        onInfo(`Blocked: ${String(e)}`);
      });
  }
  return (
    <>
      <p>
        Keep silent mode <b>on</b> and the volume up. Tap Play. This is how a cloud voice would sound to you. Can you hear
        it?
      </p>
      <button onClick={play} className="btn-primary">▶ Play clip</button>
      {msg && <Status>{msg}</Status>}
    </>
  );
}

type SavedRun = { summary: string; log: string[] };
type Stage = "idle" | "speaking" | "showing" | "tap" | "waiting" | "listening" | "done";
type SessionMode = "screen" | "spoken" | "spoken-pr";

const MODE_LABELS: Record<SessionMode, string> = {
  screen: "one session, on-screen questions",
  spoken: "one session, spoken questions",
  "spoken-pr": "one session, spoken questions, play-and-record",
};

// The words a run asks for, one per turn.
const WORDS = ["John", "Paul", "Mary", "Sarah", "stop"];

// Runs are saved on the phone, so nothing is lost if the app is closed. New key for round 7, so the list
// starts empty (rounds 1 to 6 are recorded in the spec).
const RUNS_KEY = "dispatch-spike-handsfree-runs-v5";
const MAX_RUNS = 8;
const RECOVERY_SECS = 5 * 60;

function loadRuns(): SavedRun[] {
  try {
    const runs: unknown = JSON.parse(window.localStorage.getItem(RUNS_KEY) ?? "[]");
    return Array.isArray(runs) ? (runs as SavedRun[]) : [];
  } catch {
    return [];
  }
}

function saveRuns(runs: SavedRun[]) {
  try {
    window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch {
    /* storage unavailable: runs just won't survive closing the app */
  }
}

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Ready",
  speaking: "🔊 Dispatch is speaking…",
  showing: "Read the question…",
  tap: "👆 Your turn: tap the button, then speak",
  waiting: "Starting the mic… wait",
  listening: "🎙 Listening – speak now",
  done: "Finished",
};

const wordsOf = (s: string) => s.trim().split(/\s+/).filter(Boolean);

// Keeps the screen on during a run and logs if the app leaves the screen. Returns a function that undoes both.
function keepAwake(env: Env, add: (l: string) => void) {
  let lock: WakeLockSentinel | null = null;
  if (env.wakeLock) {
    navigator.wakeLock
      .request("screen")
      .then((l) => {
        lock = l;
        add("screen kept awake");
      })
      .catch((e) => add(`couldn't keep the screen awake: ${String(e)}`));
  }
  const onVisibility = () => add(document.visibilityState === "visible" ? "app back on screen" : "APP WENT OFF SCREEN");
  document.addEventListener("visibilitychange", onVisibility);
  return async () => {
    document.removeEventListener("visibilitychange", onVisibility);
    await (lock as WakeLockSentinel | null)?.release().catch(() => {});
  };
}

// Loudest point of a recording between two times (ms from its start), as a percentage of full scale.
async function measureRecording(blob: Blob, splitMs: number) {
  const audio = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(await blob.arrayBuffer());
  const data = audio.getChannelData(0);
  const index = (ms: number) => Math.min(data.length, Math.max(0, Math.round((ms / 1000) * audio.sampleRate)));
  const peak = (fromMs: number, toMs: number) => {
    let p = 0;
    for (let i = index(fromMs); i < index(toMs); i++) p = Math.max(p, Math.abs(data[i]));
    return Math.round(p * 100);
  };
  return { before: peak(0, splitMs), after: peak(splitMs + 300, audio.duration * 1000), seconds: audio.duration };
}

/**
 * Hands-free loop with ONE listening session for the whole conversation. Rounds 1 to 4 showed that after a
 * turn that heard words, the next new session usually hears nothing for minutes, however the turn ended. So
 * this keeps the mic on throughout (continuous recognition), and works out each answer from the words that
 * arrive after the question, ending a turn after a 1.5s pause. It also logs any words heard while Dispatch
 * is speaking, and whether iOS ends the session by itself (Dispatch restarts it, at most twice).
 *
 * Round 5: on-screen questions heard 5 of 5; spoken questions heard nothing once the voice played. Round 6
 * adds "spoken-pr", which tells Safari up front that the page plays and records at the same time
 * (audioSession.type = "play-and-record"), so the iPhone needn't switch its sound set-up when the voice
 * starts. Every mode logs the audio session's state changes. Round 6: play-and-record didn't help.
 *
 * Round 7 tries two ways round it. "Tap to answer": Dispatch asks out loud, and each listen starts from a tap
 * (taps worked all day in test 4). "Recording check": records with the ordinary microphone, the way a voice
 * memo or a cloud speech service would, while Dispatch speaks and after. It then measures how loud the
 * recording is after the voice stops, to see whether that path survives the voice.
 */
function HandsFreeTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const voices = useVoices(env.speechSynthesis);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [prompt, setPrompt] = useState("");
  const [want, setWant] = useState("");
  const [heard, setHeard] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [runs, setRuns] = useState<SavedRun[]>(loadRuns);
  const [copied, setCopied] = useState(false);
  const [lastMic, setLastMic] = useState<LastMic | null>(readLastMic);
  const [now, setNow] = useState(() => Date.now());
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  // In "tap to answer", the big button calls this, so the listen starts inside your tap.
  const tapRef = useRef<(() => void) | null>(null);

  // Refresh the "last mic use" line every few seconds, so you can see when the wait is up.
  useEffect(() => {
    const id = setInterval(() => {
      setLastMic(readLastMic());
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(id);
  }, []);

  async function run(mode: SessionMode) {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const t0 = Date.now();
    const lines: string[] = [];
    const add = (l: string) => {
      lines.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${l}`);
      setLog([...lines]);
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    setRunning(true);
    setCopied(false);
    setHeard("");
    const synth = window.speechSynthesis;
    const nav = navigator as AudioSessionNav;
    const where = env.installed ? "app" : "Safari";
    const lastAtStart = describeLastMic(readLastMic());
    add(
      `setup: ${MODE_LABELS[mode]}, ${where}, app opened ${Math.round(performance.now() / 1000)}s ago, ` +
        `earlier in this session: mic used ${usage.listens}×, voice used ${usage.speaks}×; last mic use: ${lastAtStart}; ` +
        `${voices.length} voices, audio session ${nav.audioSession?.type ?? "n/a"}`
    );
    // Clear anything an earlier test left stuck in the speech queue.
    synth.cancel();
    const voice = pickVoice(voices, "");

    // Watch the audio session, and in "spoken-pr" mode declare play-and-record before any sound or mic.
    const audioSession = nav.audioSession;
    if (audioSession) {
      add(`audio session state at start: ${audioSession.state ?? "n/a"}`);
      audioSession.onstatechange = () => add(`audio session state: ${audioSession.state ?? "n/a"} (type ${audioSession.type})`);
    }
    if (mode === "spoken-pr") {
      if (!audioSession) add("audio session setting isn't available on this device");
      else {
        try {
          audioSession.type = "play-and-record";
          add(`audio session type set to: ${audioSession.type}`);
        } catch (e) {
          add(`couldn't set the audio session type: ${String(e)}`);
        }
      }
    }

    // The one listening session.
    usage.listens++;
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    let segments: string[] = [];
    let generation = 0; // goes up each time the session (re)starts, because the words start afresh
    let live = false;
    let finished = false;
    let restarts = 0;
    let speakingNow = false;
    let startDelay: number | undefined;
    let startCalledAt = Date.now();
    let changedAt = 0;
    const heardWhileSpeaking: string[] = [];
    const allText = () => segments.join(" ").replace(/\s+/g, " ").trim();

    rec.onstart = () => {
      live = true;
      generation++;
      segments = [];
      const delay = Date.now() - startCalledAt;
      if (startDelay === undefined) startDelay = delay;
      add(`mic started (${(delay / 1000).toFixed(1)}s after asking)`);
    };
    rec.onaudiostart = () => add("mic capturing audio");
    rec.onspeechstart = () => add("mic heard speech");
    rec.onresult = (e) => {
      segments = Array.from(e.results).map((r) => r[0]?.transcript ?? "");
      changedAt = Date.now();
      const text = allText();
      add(`words so far: "${text}"${speakingNow ? " (while Dispatch was speaking)" : ""}`);
      if (speakingNow) heardWhileSpeaking.push(text);
    };
    rec.onerror = (e) => add(`mic ERROR: ${e.error}`);
    rec.onend = () => {
      live = false;
      add(finished ? "session ended" : "SESSION ENDED BY ITSELF");
      if (!finished && restarts < 2) {
        restarts++;
        add(`restarting the session (restart ${restarts} of 2)`);
        startCalledAt = Date.now();
        try {
          rec.start();
        } catch (err) {
          add(`restart failed: ${String(err)}`);
        }
      }
    };

    const say = async (text: string) => {
      setPrompt(text);
      if (mode !== "screen") {
        setStage("speaking");
        add(`Dispatch: ${text}`);
        speakingNow = true;
        await speak(text, voice, add);
        await wait(500); // words from the voice arrive a little after it finishes
        speakingNow = false;
      } else {
        // Shown for roughly as long as saying it would take, so both modes keep the same rhythm.
        setStage("showing");
        add(`Dispatch (on screen): ${text}`);
        await wait(1000 + text.length * 55);
      }
    };

    // Start the session and ask the first question straight from the tap (iPhone needs a tap for both).
    startCalledAt = Date.now();
    try {
      rec.start();
    } catch (e) {
      add(`mic start() failed: ${String(e)}`);
    }
    setWant(WORDS[0]);
    const firstQuestion = say(`Say ${WORDS[0]}.`);

    // Keep the screen on, so it can't lock part-way through a run.
    let lock: WakeLockSentinel | null = null;
    if (env.wakeLock) {
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          lock = l;
          add("screen kept awake");
        })
        .catch((e) => add(`couldn't keep the screen awake: ${String(e)}`));
    }
    const onVisibility = () => add(document.visibilityState === "visible" ? "app back on screen" : "APP WENT OFF SCREEN");
    document.addEventListener("visibilitychange", onVisibility);

    await firstQuestion;
    const turns: { want: string; text: string }[] = [];
    let w = 0;
    let misses = 0;
    while (w < WORDS.length) {
      setWant(WORDS[w]);
      await wait(300);
      // The answer is whatever words arrive after this point.
      const baseGeneration = generation;
      const baseCount = wordsOf(allText()).length;
      const answerNow = () => (generation === baseGeneration ? wordsOf(allText()).slice(baseCount) : wordsOf(allText())).join(" ");
      add(`--- turn ${turns.length + 1}: asking for "${WORDS[w]}"${live ? "" : " (mic not running)"} ---`);
      setHeard("");
      const opened = Date.now();
      let answer = "";
      // Wait for words, then for a 1.5s pause; give up after 8s with no words.
      for (;;) {
        setStage(live ? "listening" : "waiting");
        await wait(100);
        answer = answerNow();
        setHeard(answer);
        if (answer && Date.now() - changedAt >= 1500) break;
        if (!answer && Date.now() - opened >= 8000) break;
      }
      turns.push({ want: WORDS[w], text: answer });
      add(`You: "${answer}"`);
      if (!answer) {
        misses++;
        if (misses >= 2) {
          await say("I still didn't catch that. Stopping the test.");
          break;
        }
        await say(`Sorry, I didn't catch that. Say ${WORDS[w]} again.`);
        continue;
      }
      misses = 0;
      w++;
      if (w < WORDS.length) await say(`Got it. Now say ${WORDS[w]}.`);
      else await say("That's all five. Test finished.");
    }

    finished = true;
    try {
      rec.abort();
    } catch {
      /* already ended */
    }
    await wait(600); // let the "session ended" event arrive for the log
    rememberMicUse("Dispatch abort (one session)", turns.some((t) => t.text));
    setLastMic(readLastMic());
    setNow(Date.now());
    document.removeEventListener("visibilitychange", onVisibility);
    if (audioSession) {
      audioSession.onstatechange = null;
      if (mode === "spoken-pr") {
        try {
          audioSession.type = "auto"; // put it back so the other tests behave normally
        } catch {
          /* ignore */
        }
      }
    }
    await (lock as WakeLockSentinel | null)?.release().catch(() => {});
    add("finished");

    // One line per run, so runs are easy to compare.
    const heardCount = turns.filter((t) => t.text).length;
    const perTurn = turns.map((t, i) => (t.text ? `${i + 1} ✓ "${t.text}"` : `${i + 1} ✗`)).join(" · ");
    const echo = heardWhileSpeaking.length ? ` · heard while Dispatch spoke: "${heardWhileSpeaking[heardWhileSpeaking.length - 1]}"` : "";
    const summary =
      `${new Date().toLocaleString("en-GB")} · ${MODE_LABELS[mode]} · ${where} · last mic use ${lastAtStart} · ` +
      `mic start ${startDelay === undefined ? "never" : `${(startDelay / 1000).toFixed(1)}s`} · restarts ${restarts} · ` +
      `heard ${heardCount}/${turns.length}: ${perTurn}${echo}`;
    const next = [...loadRuns(), { summary, log: lines }].slice(-MAX_RUNS);
    saveRuns(next);
    setRuns(next);
    onInfo(next.map((r, i) => `Run ${i + 1}: ${r.summary}`).join(" || "));
    setStage("done");
    setWant("");
    setRunning(false);
  }

  // Shared start and finish for the round 7 runs.
  function beginRun(label: string) {
    const t0 = Date.now();
    const lines: string[] = [];
    const add = (l: string) => {
      lines.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${l}`);
      setLog([...lines]);
    };
    setRunning(true);
    setCopied(false);
    setHeard("");
    setRecordingUrl(null);
    const where = env.installed ? "app" : "Safari";
    const lastAtStart = describeLastMic(readLastMic());
    add(
      `setup: ${label}, ${where}, app opened ${Math.round(performance.now() / 1000)}s ago, ` +
        `earlier in this session: mic used ${usage.listens}×, voice used ${usage.speaks}×; last mic use: ${lastAtStart}`
    );
    // Clear anything an earlier test left stuck in the speech queue.
    window.speechSynthesis.cancel();
    const voice = pickVoice(voices, "");
    const say = async (text: string) => {
      setPrompt(text);
      setStage("speaking");
      add(`Dispatch: ${text}`);
      await speak(text, voice, add);
    };
    const finish = (result: string) => {
      add("finished");
      const summary = `${new Date().toLocaleString("en-GB")} · ${label} · ${where} · last mic use ${lastAtStart} · ${result}`;
      const next = [...loadRuns(), { summary, log: lines }].slice(-MAX_RUNS);
      saveRuns(next);
      setRuns(next);
      onInfo(next.map((r, i) => `Run ${i + 1}: ${r.summary}`).join(" || "));
      setLastMic(readLastMic());
      setNow(Date.now());
      setStage("done");
      setWant("");
      setRunning(false);
    };
    return { add, say, finish };
  }

  // Round 7a: Dispatch asks out loud; every listen starts from your tap on the big button.
  async function runTapToAnswer() {
    const { add, say, finish } = beginRun("tap to answer");
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    setWant(WORDS[0]);
    // No await before this first say(): iPhone only allows speech straight from the tap.
    const firstQuestion = say(`Tap the button, then say ${WORDS[0]}.`);
    const release = keepAwake(env, add);
    await firstQuestion;

    const turns: ListenResult[] = [];
    let w = 0;
    let misses = 0;
    while (w < WORDS.length) {
      setWant(WORDS[w]);
      add(`--- turn ${turns.length + 1}: asking for "${WORDS[w]}", waiting for your tap ---`);
      setHeard("");
      setStage("tap");
      const asked = Date.now();
      const tapped = new Promise<ListenResult>((resolve) => {
        tapRef.current = () => {
          tapRef.current = null;
          add(`you tapped after ${((Date.now() - asked) / 1000).toFixed(1)}s`);
          setStage("waiting");
          // Called inside the tap, so the listen starts from it.
          resolve(
            listenOnce(8000, {
              onEvent: add,
              silenceMs: 1500,
              endWith: "iphone",
              onListening: () => setStage("listening"),
              onPartial: setHeard,
            })
          );
        };
      });
      const r = await Promise.race([tapped, wait(60000).then(() => null)]);
      if (!r) {
        tapRef.current = null;
        add("no tap within 60s, stopping");
        break;
      }
      turns.push(r);
      add(`You: "${r.text}" (turn ended by ${r.endedBy}${r.error ? `, error: ${r.error}` : ""})`);
      await wait(300);
      if (!r.text) {
        misses++;
        if (misses >= 2) {
          await say("I still didn't catch that. Stopping the test.");
          break;
        }
        await say(`Sorry, I didn't catch that. Tap, then say ${WORDS[w]} again.`);
        continue;
      }
      misses = 0;
      w++;
      if (w < WORDS.length) await say(`Got it. Tap, then say ${WORDS[w]}.`);
      else await say("That's all five. Test finished.");
    }
    await release();

    const heardCount = turns.filter((t) => t.text).length;
    const perTurn = turns
      .map((t, i) => {
        const start = t.startDelay === undefined ? "mic never started" : `mic start ${(t.startDelay / 1000).toFixed(1)}s`;
        return t.text
          ? `${i + 1} ✓ "${t.text}" (${start})`
          : `${i + 1} ✗ (${start}) [${t.events.join(", ") || "no events"}]${t.error ? ` error ${t.error}` : ""}`;
      })
      .join(" · ");
    finish(`heard ${heardCount}/${turns.length}: ${perTurn}`);
  }

  // Round 7b: records with the ordinary microphone while Dispatch speaks and for 5s after, then measures it.
  async function runRecordingCheck() {
    const { add, say, finish } = beginRun("recording check");
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // From the tap: start the voice, then the recording, so it records while the voice plays (the failing case).
    const voiceDone = say("Recording check. When I stop talking, say a short sentence.");
    const release = keepAwake(env, add);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      add(`couldn't use the microphone: ${String(e)}`);
      await voiceDone;
      await release();
      finish(`couldn't use the microphone: ${String(e)}`);
      return;
    }
    usage.listens++;
    const mime = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find(
      (m) => typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(m)
    );
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    const recordingStart = Date.now();
    recorder.start();
    add("recording started");
    await voiceDone;
    const voiceEnd = Date.now() - recordingStart;
    add(`voice finished, ${(voiceEnd / 1000).toFixed(1)}s into the recording — your turn`);
    setPrompt("Say a short sentence now.");
    setStage("listening");
    await wait(5000);
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((t) => t.stop());
    await release();
    const blob = new Blob(chunks, { type: recorder.mimeType });
    add(`recording: ${(blob.size / 1024).toFixed(0)} KB, ${recorder.mimeType || "unknown format"}`);
    setRecordingUrl(URL.createObjectURL(blob));

    let result: string;
    try {
      const m = await measureRecording(blob, voiceEnd);
      add(`loudest sound while Dispatch spoke: ${m.before}%; after it stopped: ${m.after}% (${m.seconds.toFixed(1)}s recorded)`);
      // Speaking near the phone usually peaks well above 5%; silence stays near 0%.
      result = `loudest after the voice: ${m.after}% (${m.after >= 5 ? "sound captured" : "near silence"}); during the voice: ${m.before}%`;
      rememberMicUse("recording check", m.after >= 5);
    } catch (e) {
      add(`couldn't measure the recording: ${String(e)}`);
      result = `recorded ${(blob.size / 1024).toFixed(0)} KB, couldn't measure it: ${String(e)}`;
      rememberMicUse("recording check", blob.size > 0);
    }
    setPrompt("Play the recording below: can you hear yourself?");
    finish(result);
  }

  async function copyRuns() {
    const text = runs.map((r, i) => [`Run ${i + 1}: ${r.summary}`, ...r.log].join("\n")).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
      alert("Couldn't copy automatically. Use Copy results at the top of the page instead.");
    }
  }

  function clearRuns() {
    if (!confirm("Delete the saved hands-free runs?")) return;
    saveRuns([]);
    setRuns([]);
    setLog([]);
    setCopied(false);
  }

  if (!env.speechRecognition || !env.speechSynthesis)
    return <Status>Needs both speech recognition and read-aloud, and at least one isn&apos;t available here.</Status>;
  const listeningNow = stage === "listening";
  const sinceLast = lastMic ? Math.round((now - lastMic.at) / 1000) : Infinity;
  const rested = sinceLast >= RECOVERY_SECS;
  return (
    <>
      <p>
        On iPhone, the built-in speech recognition stops hearing anything once Dispatch&apos;s voice plays (rounds 5
        and 6). This round checks two ways round it.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          Switch <b>silent mode off</b> and turn the volume up. Wait until the line below says <b>5 minutes are up</b>.
        </li>
        <li>
          Tap <b>Start: tap to answer</b>. Dispatch asks for a word out loud. When the big <b>Tap, then say…</b> button
          appears, tap it and say only that word. Do this for all five.
        </li>
        <li>
          Then tap <b>Start: recording check</b> (no need to wait). Dispatch speaks; when it stops and the box turns
          yellow, say a short sentence. Afterwards, play the recording below it: can you hear yourself?
        </li>
        <li>
          Tap <b>Copy all runs</b> and paste them to Claude, with what you heard.
        </li>
      </ol>

      <Status>
        Last mic use: {describeLastMic(lastMic, now)}
        {lastMic && (rested ? " · ✓ 5 minutes are up" : ` · wait ${Math.ceil((RECOVERY_SECS - sinceLast) / 60)} more min`)}
      </Status>

      <div
        aria-live="polite"
        className={`rounded-2xl border-2 border-ink px-3 py-4 text-center ${listeningNow ? "bg-sun shadow-pop" : "bg-periwinkle"}`}
      >
        {prompt && <p className="text-sm text-dim">Dispatch: {prompt}</p>}
        {want && running && <p className="font-display text-[28px] font-extrabold tracking-tight">Say: {want}</p>}
        <p className="text-lg font-bold">{STAGE_LABELS[stage]}</p>
        {stage === "tap" && (
          <button onClick={() => tapRef.current?.()} className="btn-primary mt-3 w-full py-4 text-lg">
            🎙 Tap, then say {want}
          </button>
        )}
        {heard && <p className="font-mono text-sm">&ldquo;{heard}&rdquo;</p>}
      </div>
      {recordingUrl && <audio controls src={recordingUrl} className="w-full" />}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => void runTapToAnswer()} disabled={running} className="btn-primary">
          Start: tap to answer
        </button>
        <button onClick={() => void runRecordingCheck()} disabled={running} className="btn-primary">
          Start: recording check
        </button>
        <button onClick={() => void run("screen")} disabled={running} className="btn-secondary">
          Start: on-screen questions (mic on)
        </button>
      </div>
      {runs.length > 0 && !running && (
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={copyRuns} className="btn-secondary">
            {copied ? "Copied ✓" : `Copy all runs (${runs.length})`}
          </button>
          <button onClick={clearRuns} className="btn-secondary">
            Clear saved runs
          </button>
        </div>
      )}
      {log.length > 0 && <Status>{log.map((l, i) => <span key={i} className="block">{l}</span>)}</Status>}
    </>
  );
}

function PushTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const [perm, setPerm] = useState<string>(env.notifications ? Notification.permission : "unsupported");
  const [sub, setSub] = useState<PushSubscriptionJSON | null>(null);
  const [msg, setMsg] = useState("");

  async function enable() {
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== "granted") {
        setMsg(`Permission: ${p}`);
        onInfo(`Permission: ${p}`);
        return;
      }
      if (!VAPID_PUBLIC_KEY) throw new Error("Push key missing from this build (NEXT_PUBLIC_VAPID_PUBLIC_KEY).");
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const s =
        existing ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) }));
      setSub(s.toJSON());
      setMsg("Notifications on ✓ Now tap 'Send test in 10 seconds'.");
      onInfo("Permission granted, subscribed");
    } catch (e) {
      setMsg(`Failed: ${String(e)}`);
      onInfo(`Subscribe failed: ${String(e)}`);
    }
  }

  async function sendTest() {
    setMsg("Sending in 10 seconds — go to your Home Screen or lock the phone now…");
    try {
      const res = await fetch("/api/push-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, delaySeconds: 10, count: 3 }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      const info = data.ok ? "Server sent the notification ✓" : `Server error: ${data.error}`;
      setMsg(info);
      onInfo(info);
    } catch (e) {
      setMsg(`Request failed (this can happen if you left the app; check whether the notification arrived): ${String(e)}`);
    }
  }

  if (!env.push || !env.notifications)
    return (
      <Status>
        Notifications aren&apos;t available here.{" "}
        {!env.installed && "On iPhone they only work in the app opened from the Home Screen."}
      </Status>
    );
  return (
    <>
      <p>
        Tap <b>Allow notifications</b> and accept. Then tap <b>Send test</b> and within 10 seconds go to your Home Screen or
        lock the phone. A &ldquo;Dispatch test&rdquo; notification should appear. Tap it: it should open this page.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={enable} className="btn-primary">Allow notifications</button>
        <button onClick={sendTest} disabled={!sub} className="btn-secondary">Send test in 10 seconds</button>
      </div>
      <Status>Permission: {perm}{msg && ` · ${msg}`}</Status>
    </>
  );
}

function BadgeTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const [msg, setMsg] = useState("");
  async function set(n: number) {
    try {
      if (n) await navigator.setAppBadge(n);
      else await navigator.clearAppBadge();
      const info = n ? `Badge set to ${n}` : "Badge cleared";
      setMsg(`${info} — check the Home Screen icon.`);
      onInfo(info);
    } catch (e) {
      setMsg(`Failed: ${String(e)}`);
      onInfo(`Failed: ${String(e)}`);
    }
  }
  if (!env.badge) return <Status>App badges aren&apos;t available here.</Status>;
  return (
    <>
      <p>Do test 7 first: iPhone only shows badges once notifications are allowed. Tap Set badge, then go to the Home Screen and look at the Dispatch icon.</p>
      <div className="flex gap-2">
        <button onClick={() => set(3)} className="btn-primary">Set badge to 3</button>
        <button onClick={() => set(0)} className="btn-secondary">Clear</button>
      </div>
      {msg && <Status>{msg}</Status>}
    </>
  );
}

function WakeLockTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");
  const lockRef = useRef<WakeLockSentinel | null>(null);

  async function acquire() {
    try {
      lockRef.current = await navigator.wakeLock.request("screen");
      lockRef.current.addEventListener("release", () => setMsg("Wake lock released"));
      setMsg("Screen will stay awake ✓ Leave the phone untouched for longer than its Auto-Lock time.");
      onInfo("Wake lock acquired");
    } catch (e) {
      setMsg(`Failed: ${String(e)}`);
      onInfo(`Failed: ${String(e)}`);
    }
  }

  useEffect(() => {
    if (!on) return;
    // Wake locks drop when the app is hidden; take it again when you come back.
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  async function toggle() {
    if (on) {
      await lockRef.current?.release();
      lockRef.current = null;
      setOn(false);
      setMsg("Off");
    } else {
      setOn(true);
      await acquire();
    }
  }

  if (!env.wakeLock) return <Status>Keep-awake isn&apos;t available here.</Status>;
  return (
    <>
      <p>Turn it on, put the phone down and don&apos;t touch it for longer than your Auto-Lock setting (Settings → Display &amp; Brightness). Did the screen stay on?</p>
      <button onClick={toggle} className="btn-primary">{on ? "Turn off" : "Keep screen awake"}</button>
      {msg && <Status>{msg}</Status>}
    </>
  );
}

function CopyButton({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    } catch {
      alert("Copy failed on this device.");
    }
  }
  return (
    <button onClick={copy} className="btn-secondary">
      {done ? `${label} copied ✓` : `Copy ${label}`}
    </button>
  );
}

function CopyTest() {
  return (
    <>
      <p>
        Copy the subject, start a new email in Outlook and paste it in. Do the same with the body. Does the formatting
        (line breaks, the dash, the labels) come through cleanly?
      </p>
      <div className="flex flex-wrap gap-2">
        <CopyButton label="subject" text={SAMPLE_SUBJECT} />
        <CopyButton label="body" text={SAMPLE_BODY} />
      </div>
      <Status>
        <span className="block font-semibold">{SAMPLE_SUBJECT}</span>
        <span className="block whitespace-pre-wrap">{SAMPLE_BODY}</span>
      </Status>
      <p className="text-dim">Don&apos;t send it — just check it pastes well, then discard the draft.</p>
    </>
  );
}

function SiriTest() {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Copy the app address below.</li>
        <li>Open the <b>Shortcuts</b> app → <b>+</b> → <b>Add Action</b> → search <b>Open URLs</b> → add it.</li>
        <li>Tap the URL field and paste the address.</li>
        <li>Rename the shortcut (tap the name at the top) to <b>Dispatch</b>, then tap <b>Done</b>.</li>
        <li>Say <b>&ldquo;Hey Siri, Dispatch&rdquo;</b>.</li>
      </ol>
      <p>Did it open the installed Dispatch app (no Safari address bar), or Safari?</p>
      <div className="flex gap-2 items-center">
        <CopyButton label="address" text={url} />
        <span className="font-mono text-xs break-all">{url}</span>
      </div>
    </>
  );
}

function DesktopTest() {
  return (
    <ol className="list-decimal pl-5 space-y-1">
      <li>On your PC, open this address in <b>Edge</b> or <b>Chrome</b>.</li>
      <li>
        Edge: <b>⋯</b> menu → <b>Apps</b> → <b>Install this site as an app</b>. Chrome: the install icon at the right of the
        address bar, or <b>⋮</b> → <b>Cast, save and share</b> → <b>Install page as app</b>.
      </li>
      <li>Tick the options to add a <b>desktop shortcut</b> and <b>pin to taskbar</b> if offered (or right-click its taskbar icon → Pin to taskbar).</li>
      <li>Open it from the desktop shortcut and the taskbar. Does it open in its own window?</li>
    </ol>
  );
}
