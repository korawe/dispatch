// The future features list shown on /admin/features. Killian asks Claude to add or remove items from time to
// time; edit this list (newest last) and redeploy.

export type Feature = {
  title: string;
  detail: string;
  /** When it was added, e.g. "22 Nov 2026". */
  added: string;
  status: "Idea" | "Planned" | "In progress" | "Done";
};

export const FEATURES: Feature[] = [
  {
    title: "AI drafting of emails",
    detail:
      "Dispatch writes each email from what you said, instead of copying your voice answers into the template word for word. " +
      "Starting point: Claude Haiku 5.5, about 50p a month at 10 notes a working day. It's billed separately from a claude.ai plan, " +
      "though a Team plan's monthly API credits may cover it (spec §10.4, decision 33).",
    added: "22 Nov 2026",
    status: "Planned",
  },
];
