// Making sense of short spoken answers to Dispatch's questions (Phase 1, no AI: decision 33).

const normalise = (said: string) =>
  said
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** "Another action?": yes, no, or null when it's not clear. */
export function yesOrNo(said: string): "yes" | "no" | null {
  const s = normalise(said).replace(/,/g, " ");
  if (!s) return null;
  if (
    /^(no|nope|nah)\b/.test(s) ||
    /\b(that's (all|it|everything)|that is (all|it|everything)|nothing else|no more|all done|done|finished)\b/.test(s)
  )
    return "no";
  if (/\b(yes|yeah|yep|yup|sure|another|one more|go on|okay|ok)\b/.test(s)) return "yes";
  return null;
}

/** "Anyone to copy in?": true for "no", "no one", "nobody"… */
export function isNoOne(said: string) {
  const s = normalise(said).replace(/,/g, " ");
  return /^(no|nope|nah|none)\b/.test(s) || /\b(no one|no-one|noone|nobody|not anyone|nothing)\b/.test(s);
}

/** Splits "Tom and Priya" or "copy in Tom, Priya" into names. */
export function splitNames(said: string): string[] {
  return normalise(said)
    .replace(/\b(copy in|copy|cc|please|also)\b/g, " ")
    .split(/\s*(?:,|&|\band\b|\bplus\b)\s*/)
    .map((name) => name.trim())
    .filter(Boolean);
}

/**
 * Skipping an optional question (decision 37): "skip", "pass", "nothing", "none", "no". Saying only "next" or
 * "stop" skips too, since it arrives as an empty answer.
 */
export function isSkip(said: string) {
  return /^(skip( (it|this|that))?|pass|nothing|none|no|n\/a|not needed|not really)$/.test(normalise(said).replace(/,/g, ""));
}

/** "Back" or "go back": return to the previous question. */
export function isBack(said: string) {
  return /^(go )?back$/.test(normalise(said));
}
