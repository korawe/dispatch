// Listening and speaking with the browser's built-in speech tools (decisions 30, 32 and 35), learned from test 6:
// - On iPhone the mic must be started by a tap, and once Dispatch's voice has played, only a tap-started listen
//   hears you. So "one answer" sessions start from the mic button, and "hands-free" sessions start from one tap
//   and stay open for the whole note, with nothing spoken.
// - You end each answer by saying "stop" or "next" (decision 35), so you can pause to think. Neither word is part
//   of the answer. A Done button does the same, and an answer also finishes after 20 seconds with no new words.
// - On iPhone, cutting the mic off after it has heard words leaves it hearing nothing for minutes (test 6, and
//   the first real use of voice on 22 Nov). So there Dispatch never cuts a session off after words (letItEnd):
//   one-answer sessions listen phrase by phrase, which the iPhone ends at each pause, and Dispatch starts the
//   next phrase until you say "stop". Chrome keeps one session open until "stop" (it would otherwise cut you
//   off at your first pause, laptop test 4).

type ResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;

/** The parts of the browser's SpeechRecognition that Dispatch uses. */
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((e: { results: ResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type RecognitionWindow = { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

function recognitionConstructor() {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as RecognitionWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const canListen = () => !!recognitionConstructor();
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;
export const isIPhone = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

/** Words that end an answer (decision 35): "stop", or "next", which can feel more natural in conversation. */
export const END_WORDS = ["stop", "next"];

/**
 * If the words end with "stop" or "next" (said once or more, e.g. "stop stop" when the first wasn't picked up),
 * returns them without those words (possibly ""). Otherwise null. They must be the last words: "Priya, next."
 * ends an answer; "next week", "next Friday" and "stopping" don't.
 */
export function withoutEndWord(text: string): string | null {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let end = words.length;
  while (end > 0 && END_WORDS.includes(words[end - 1].toLowerCase().replace(/[^a-z]/g, ""))) end--;
  if (end === words.length) return null;
  return words.slice(0, end).join(" ").replace(/[\s,;:.]+$/, "");
}

/** Reads text aloud in a British voice. Resolves when it finishes (or after a safety timeout). */
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak()) return resolve();
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === "en-GB") ?? voices.find((v) => v.lang.startsWith("en"));
    if (voice) u.voice = voice;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    const timer = setTimeout(finish, 3000 + text.length * 90); // the iPhone sometimes never says it finished
    synth.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export type VoiceOptions = {
  /** true: one session for the whole note (hands-free). false: one answer, then finish. */
  keepOpen: boolean;
  /** Gets each answer, without the closing "stop" or "next" (an empty string if nothing was said). */
  onAnswer: (text: string) => void;
  /** The answer so far, as the words arrive. */
  onWords?: (text: string) => void;
  onListening?: (listening: boolean) => void;
  /** An answer has opened (true) or finished (false): when to show "Listening – say stop". */
  onWindow?: (open: boolean) => void;
  /**
   * The browser ending the session at your pause ends the answer (no restart). For the iPhone with Speak
   * questions on, where a fresh listen per answer that the iPhone ends itself is what works (test 6, round 7).
   */
  endAtPause?: boolean;
  onProblem?: (message: string) => void;
  /** Keep one session open across pauses (default true). iPhone one-answer sessions go phrase by phrase. */
  continuous?: boolean;
  /** Never cut the mic off after it has heard words; let the browser end the session itself (iPhone). */
  letItEnd?: boolean;
  /** Finish an answer after this long with no new words. */
  idleMs?: number;
  /** For tests: makes the recogniser. */
  create?: () => Recognition | null;
};

/** One listening session. Call start() from inside a tap, then openWindow() for each answer. */
export class VoiceSession {
  private rec: Recognition | null = null;
  private segments: string[] = []; // what the browser has heard in the current run of the session
  private generation = 0; // goes up each time the session (re)starts, because the words start afresh
  private baseGeneration = 0;
  private baseCount = 0;
  private carried: string[] = []; // words of this answer heard before a restart
  private windowOpen = false;
  private finishing = false; // this one-answer session is done: let it end, don't restart it
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private hasEnded = false; // the browser has ended the session (so there's nothing to cut off)
  private restarts = 0;
  private opts: VoiceOptions;

  constructor(opts: VoiceOptions) {
    this.opts = opts;
  }

  /** Starts the mic. Returns false if it couldn't. On iPhone this must run inside a tap. */
  start(): boolean {
    const Ctor = recognitionConstructor();
    const rec = this.opts.create ? this.opts.create() : Ctor ? new Ctor() : null;
    if (!rec) {
      this.opts.onProblem?.("This browser can't do speech recognition. Type your answer instead.");
      return false;
    }
    this.rec = rec;
    rec.lang = "en-GB";
    rec.continuous = this.opts.continuous ?? true;
    rec.interimResults = true;
    rec.onstart = () => {
      if (this.windowOpen) this.carried = this.answerWords(); // a restart mid-answer keeps what was said
      this.generation++;
      this.segments = [];
      this.hasEnded = false;
      this.opts.onListening?.(true);
    };
    rec.onresult = (e) => {
      this.segments = Array.from(e.results).map((r) => r[0]?.transcript ?? "");
      this.heard();
    };
    rec.onerror = (e) => this.problem(e.error);
    rec.onend = () => this.ended();
    try {
      rec.start();
    } catch (err) {
      this.opts.onProblem?.(`The mic couldn't start: ${String(err)}`);
      return false;
    }
    return true;
  }

  /** Starts a new answer: only words from now on count. */
  openWindow() {
    this.carried = [];
    this.baseGeneration = this.generation;
    this.baseCount = this.words().length;
    this.windowOpen = true;
    this.finishing = false;
    this.restarts = 0;
    this.resetIdle();
    this.opts.onWindow?.(true);
  }

  /** Stops collecting an answer but keeps the mic session running (hands-free turned off on iPhone). */
  closeWindow() {
    if (!this.windowOpen) return;
    this.windowOpen = false;
    this.carried = [];
    this.clearTimer();
    this.opts.onWindow?.(false);
  }

  /** True while the mic session is running and hasn't been stopped. */
  get alive() {
    return !this.stopped && !this.hasEnded;
  }

  /** The Done button: finishes the answer now, with whatever has been said. */
  finishNow() {
    if (this.windowOpen) this.finish(withoutEndWord(this.answer()) ?? this.answer());
  }

  /** Stops listening altogether (leaving the screen, or turning hands-free off). */
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    const wasOpen = this.windowOpen;
    this.windowOpen = false;
    this.clearTimer();
    this.cutOff();
    this.opts.onListening?.(false);
    if (wasOpen) this.opts.onWindow?.(false);
  }

  private cutOff() {
    if (this.hasEnded) return;
    try {
      this.rec?.abort();
    } catch {
      /* already stopped */
    }
  }

  private words() {
    return this.segments.join(" ").split(/\s+/).filter(Boolean);
  }

  private answerWords() {
    const words = this.words();
    return [...this.carried, ...(this.generation === this.baseGeneration ? words.slice(this.baseCount) : words)];
  }

  private answer() {
    return this.answerWords().join(" ");
  }

  private clearTimer() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private resetIdle() {
    this.clearTimer();
    this.timer = setTimeout(() => this.finishNow(), this.opts.idleMs ?? 20_000);
  }

  private heard() {
    if (!this.windowOpen) return;
    const text = this.answer();
    const done = withoutEndWord(text);
    if (done !== null) return this.finish(done);
    this.opts.onWords?.(text);
    this.resetIdle();
  }

  private finish(text: string) {
    this.windowOpen = false;
    this.clearTimer();
    this.opts.onWindow?.(false);
    if (!this.opts.keepOpen) {
      this.finishing = true;
      this.opts.onListening?.(false);
      if (!this.opts.letItEnd || this.words().length === 0) {
        this.cutOff(); // nothing heard in this run, so nothing to upset
      } else {
        // Let the iPhone end it at your pause; step in only if it hasn't after 6s.
        this.timer = setTimeout(() => this.cutOff(), 6000);
      }
    }
    this.opts.onAnswer(text);
  }

  private problem(error: string) {
    if (error === "not-allowed" || error === "service-not-allowed") {
      this.opts.onProblem?.("Dispatch isn't allowed to use the microphone or speech recognition. Check this app's settings, or type instead.");
      this.stop();
    } else if (error === "audio-capture") {
      this.opts.onProblem?.("The microphone isn't available. On iPhone, restarting the phone fixes this.");
      this.stop();
    } else if (error === "network") {
      this.opts.onProblem?.("Speech recognition needs an internet connection.");
    }
    // "no-speech" and "aborted" need nothing: the session restarts, or was stopped on purpose.
  }

  private ended() {
    this.hasEnded = true;
    if (this.stopped || this.finishing) {
      this.clearTimer();
      this.opts.onListening?.(false);
      return;
    }
    // iPhone with Speak questions on: your pause ends the answer, as in round 7.
    if (this.windowOpen && this.opts.endAtPause) {
      this.finish(withoutEndWord(this.answer()) ?? this.answer());
      return;
    }
    // Ended mid-answer, or between answers in a note-long session: carry on listening.
    if ((this.windowOpen || this.opts.keepOpen) && this.restarts++ < 50) {
      try {
        this.rec?.start();
        return;
      } catch {
        /* fall through */
      }
    }
    this.opts.onListening?.(false);
    if (this.windowOpen) this.finish(this.answer());
    else this.opts.onProblem?.("The mic stopped. Tap to start listening again.");
  }
}
