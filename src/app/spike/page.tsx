"use client";

// Phase 0 spike: checks what an installed web app can do on iPhone (and desktop)
// before we build on it. See DispatchSpec.md §9 and §14.

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

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
  onresult: ((e: { results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
  onspeechstart?: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

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
    <main className="mx-auto w-full max-w-xl px-4 py-6 space-y-5">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Dispatch · Phase 0 tests</h1>
        <p className="text-sm opacity-80">
          Work down the list on your iPhone, using the app opened from your Home Screen. After each test, tap how it went
          (add a note if anything was odd). When you&apos;re done, tap <b>Copy results</b> and paste them to Claude.
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

      <section className="space-y-2">
        <h2 className="font-semibold">Results</h2>
        <button onClick={copyResults} className="btn-primary">
          {copiedAll ? "Copied ✓" : "Copy results"}
        </button>
        <textarea readOnly value={resultsText()} className="w-full h-64 rounded-lg border border-slate-300 bg-white/60 p-2 font-mono text-xs dark:bg-slate-900 dark:border-slate-700" />
      </section>
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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-700">
      <h2 className="font-semibold">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onVerdict({ result: o })}
            className={`rounded-full border px-3 py-1 text-sm ${
              verdict.result === o ? "border-brand bg-brand text-white dark:text-slate-900" : "border-slate-300 dark:border-slate-600"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <input
        value={verdict.note ?? ""}
        onChange={(e) => onVerdict({ note: e.target.value })}
        placeholder="Note (optional)"
        className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm dark:border-slate-600"
      />
    </section>
  );
}

function Status({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-slate-800">{children}</p>;
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

function listenOnce(
  timeoutMs: number,
  onPartial?: (t: string) => void,
  onEvent?: (e: string) => void
): Promise<{ text: string; error?: string }> {
  return new Promise((resolve) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return resolve({ text: "", error: "not supported" });
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = false;
    rec.interimResults = !!onPartial;
    let text = "";
    let error: string | undefined;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ text: text.trim(), error });
    };
    if (onEvent) {
      rec.onstart = () => onEvent("mic started");
      rec.onspeechstart = () => onEvent("mic heard speech");
    }
    rec.onresult = (e) => {
      text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      onPartial?.(text);
    };
    rec.onerror = (e) => {
      error = e.error;
      onEvent?.(`mic ERROR: ${e.error}`);
    };
    rec.onend = () => {
      onEvent?.("mic stopped");
      finish();
    };
    const timer = setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      setTimeout(finish, 1500);
    }, timeoutMs);
    try {
      rec.start();
    } catch (e) {
      error = String(e);
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
    const r = await listenOnce(12000, setText);
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
      <select value={voiceName} onChange={(e) => setVoiceName(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-transparent px-2 py-2 dark:border-slate-600">
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

type AudioSessionNav = Navigator & { audioSession?: { type: string } };

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

function HandsFreeTest({ env, onInfo }: { env: Env; onInfo: (t: string) => void }) {
  const voices = useVoices(env.speechSynthesis);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function run() {
    const t0 = Date.now();
    const lines: string[] = [];
    const add = (l: string) => {
      lines.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${l}`);
      setLog([...lines]);
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    setRunning(true);
    setCopied(false);
    const synth = window.speechSynthesis;
    const session = (navigator as AudioSessionNav).audioSession?.type ?? "n/a";
    add(
      `setup: ${env.installed ? "app" : "Safari"}, ${voices.length} voices, audio session ${session}, ` +
        `speaking=${synth.speaking}, pending=${synth.pending}`
    );
    // Clear anything an earlier test left stuck in the speech queue.
    synth.cancel();
    const voice = pickVoice(voices, "");
    const say = async (text: string) => {
      add(`Dispatch: ${text}`);
      await speak(text, voice, add);
    };
    // No await before this first speak(): iPhone only allows it straight from the tap.
    await say("Who should own this action?");
    for (let round = 0; round < 4; round++) {
      await wait(400); // let the speaker hand over to the microphone
      const r = await listenOnce(8000, undefined, add);
      add(`You: "${r.text}"${r.error ? ` (error: ${r.error})` : ""}`);
      await wait(300);
      if (!r.text) {
        await say("I didn't catch that. Stopping the test.");
        break;
      }
      if (/\bstop\b/i.test(r.text)) {
        await say("OK, stopping.");
        break;
      }
      await say(`I heard ${r.text}. Say another name, or say stop.`);
    }
    add("finished");
    onInfo(lines.join(" | "));
    setRunning(false);
  }

  async function copyLog() {
    try {
      await navigator.clipboard.writeText(log.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!env.speechRecognition || !env.speechSynthesis)
    return <Status>Needs both speech recognition and read-aloud, and at least one isn&apos;t available here.</Status>;
  return (
    <>
      <p>
        First: switch <b>silent mode off</b>, turn the volume up, then <b>close Dispatch fully</b> (swipe it away) and reopen
        it. Come straight to this test.
      </p>
      <p>
        Tap Start <b>once</b>, then don&apos;t touch the screen. Dispatch asks a question out loud; answer with a name. It
        repeats what it heard and listens again. Say &ldquo;stop&rdquo; to finish.
      </p>
      <div className="flex gap-2">
        <button onClick={run} disabled={running} className="btn-primary">
          {running ? "Running…" : "Start hands-free test"}
        </button>
        {log.length > 0 && !running && (
          <button onClick={copyLog} className="btn-secondary">
            {copied ? "Copied ✓" : "Copy log"}
          </button>
        )}
      </div>
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
      <p className="opacity-70">Don&apos;t send it — just check it pastes well, then discard the draft.</p>
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
