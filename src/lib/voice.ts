// Listening and speaking with the browser's built-in speech tools (decisions 30 and 32), learned from test 6:
// - On iPhone the mic must be started by a tap, and once Dispatch's voice has played, only a tap-started listen
//   hears you. So "one answer" sessions start from the mic button and stop after one answer, and "hands-free"
//   sessions start from one tap and stay open for the whole note, with nothing spoken.
// - A turn ends after a pause (1.5s). Dispatch decides that itself, so Chrome can't cut you off at your first
//   pause (test 4 on the laptop). The exception is the iPhone's one-answer sessions: there Dispatch lets the
//   iPhone end the turn (waitForBrowserEnd), because cutting its mic off after it has heard words stops it
//   hearing anything for minutes (test 6, and the first real use of voice on 22 Nov).

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
  /** true: one session for the whole note (hands-free). false: one answer, then stop. */
  keepOpen: boolean;
  /** Gets each answer once you've paused (an empty string if a one-answer session heard nothing). */
  onAnswer: (text: string) => void;
  /** The answer so far, as the words arrive. */
  onWords?: (text: string) => void;
  onListening?: (listening: boolean) => void;
  onProblem?: (message: string) => void;
  /** Keep listening across pauses (default true). The iPhone's one-answer sessions work best without. */
  continuous?: boolean;
  /**
   * Let the browser end each answer itself instead of cutting the mic off after a pause. On iPhone, cutting the
   * mic off after it has heard words leaves it hearing nothing for minutes; letting it end the turn itself, with
   * each listen started by a tap, worked 5 of 5 (test 6, round 7). Dispatch then only steps in after 6s.
   */
  waitForBrowserEnd?: boolean;
  /** How long a pause ends an answer. */
  silenceMs?: number;
  /** One-answer sessions give up after this long with no words. */
  noWordsMs?: number;
  /** For tests: makes the recogniser. */
  create?: () => Recognition | null;
};

/** One listening session. Call start() from inside a tap, then openWindow() for each answer. */
export class VoiceSession {
  private rec: Recognition | null = null;
  private segments: string[] = [];
  private generation = 0; // goes up each time the session (re)starts, because the words start afresh
  private baseGeneration = 0;
  private baseCount = 0;
  private windowOpen = false;
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
    this.baseGeneration = this.generation;
    this.baseCount = this.words().length;
    this.windowOpen = true;
    this.clearTimer();
    if (!this.opts.keepOpen) this.timer = setTimeout(() => this.commit(), this.opts.noWordsMs ?? 8000);
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.windowOpen = false;
    this.clearTimer();
    if (!this.hasEnded) {
      try {
        this.rec?.abort();
      } catch {
        /* already stopped */
      }
    }
    this.opts.onListening?.(false);
  }

  private words() {
    return this.segments.join(" ").split(/\s+/).filter(Boolean);
  }

  private answer() {
    const words = this.words();
    return (this.generation === this.baseGeneration ? words.slice(this.baseCount) : words).join(" ");
  }

  private clearTimer() {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private heard() {
    if (!this.windowOpen) return;
    const text = this.answer();
    this.opts.onWords?.(text);
    if (text) {
      this.clearTimer();
      const wait = this.opts.waitForBrowserEnd ? 6000 : (this.opts.silenceMs ?? 1500);
      this.timer = setTimeout(() => this.commit(), wait);
    }
  }

  private commit() {
    if (!this.windowOpen) return;
    this.windowOpen = false;
    this.clearTimer();
    const text = this.answer();
    if (!this.opts.keepOpen) this.stop();
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
    this.opts.onListening?.(false);
    if (this.stopped) return;
    if (this.windowOpen && this.answer()) this.commit(); // use what was heard before it ended
    if (!this.opts.keepOpen) {
      if (this.windowOpen) this.commit(); // heard nothing
      return;
    }
    if (this.stopped) return;
    if (this.restarts++ < 10) {
      try {
        this.rec?.start();
      } catch {
        this.opts.onProblem?.("The mic stopped. Tap Go hands-free to start it again.");
      }
    } else {
      this.opts.onProblem?.("The mic stopped. Tap Go hands-free to start it again.");
    }
  }
}
