"use client";

import Link from "next/link";
import { useState } from "react";
import { isValidEmail, makePerson, savePeople, type Person } from "@/lib/people";
import { usePeople } from "@/lib/use-local";

export const inputClass = "w-full rounded-xl border-2 border-ink bg-white px-3 py-3 text-base placeholder:text-dim";

/** Name and email fields, used to add someone or edit them. */
export function PersonForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: Person;
  submitLabel: string;
  onSubmit: (name: string, email: string) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim()) return setError("Add their name, as you'd say it.");
    if (!isValidEmail(email)) return setError("That email address doesn't look right.");
    setError("");
    onSubmit(name, email);
    if (!initial) {
      setName("");
      setEmail("");
    }
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Name, as you&apos;d say it</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="priya@company.com"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          className={inputClass}
        />
      </label>
      {error && <p className="text-sm font-semibold text-[#b3263f]">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button onClick={submit} className="btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="btn-secondary">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Delegates: the people list (DispatchSpec.md §4, the Phase 1 version), shown as "Delegates" in the app.
 * Name and email, saved on this device.
 */
export function PeopleManager() {
  // Always the latest list, including delegates added during a note (see lib/local.ts).
  const people = usePeople();
  const [editing, setEditing] = useState<string | null>(null);

  const update = (next: Person[]) => savePeople(next); // every screen updates from this

  return (
    <>
      <div className="space-y-2">
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-tight">Delegates</h1>
        <p className="text-[15px] leading-relaxed text-dim">
          The people you delegate to: your EA and direct reports. Dispatch uses their names and email addresses for the To
          and CC lines. They&apos;re saved on this device.
        </p>
      </div>

      {people.length > 0 && (
        <ul className="space-y-3">
          {people.map((p) =>
            editing === p.id ? (
              <li key={p.id} className="rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
                <PersonForm
                  initial={p}
                  submitLabel="Save"
                  onSubmit={(name, email) => {
                    update(people.map((q) => (q.id === p.id ? { ...q, name: name.trim(), email: email.trim() } : q)));
                    setEditing(null);
                  }}
                  onCancel={() => setEditing(null)}
                  onDelete={() => {
                    if (!confirm(`Delete ${p.name}?`)) return;
                    update(people.filter((q) => q.id !== p.id));
                    setEditing(null);
                  }}
                />
              </li>
            ) : (
              <li key={p.id} className="flex items-center gap-3 rounded-[18px] border-2 border-ink bg-white p-3 shadow-pop">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="block truncate text-sm text-dim">{p.email}</span>
                </span>
                <button onClick={() => setEditing(p.id)} className="btn-secondary">
                  Edit
                </button>
              </li>
            )
          )}
        </ul>
      )}

      <section className="space-y-3 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
        <h2 className="font-display text-[20px] font-extrabold tracking-tight">
          {people.length ? "Add a delegate" : "Add your first delegate"}
        </h2>
        <PersonForm submitLabel="Add delegate" onSubmit={(name, email) => update([...people, makePerson(name, email)])} />
      </section>

      {people.length > 0 && (
        <Link href="/note" className="btn-primary w-full">
          Start a note
        </Link>
      )}
    </>
  );
}
