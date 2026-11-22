"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { isActive, isValidEmail, makePerson, parseAka, savePeople, type Person, type PersonDetails } from "@/lib/people";
import { usePeople } from "@/lib/use-local";

export const inputClass = "w-full rounded-xl border-2 border-ink bg-white px-3 py-3 text-base placeholder:text-dim";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-sm text-dim">{hint}</span>}
    </label>
  );
}

/**
 * A delegate's details, to add someone or edit them (DispatchSpec.md §4). Name and email are needed; role, full
 * name and "also known as" are under More details. `others` is everyone else, to spot a name that's taken.
 */
export function PersonForm({
  initial,
  editing = false,
  others = [],
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: {
  initial?: Partial<PersonDetails>;
  /** Editing someone already on the list: shows More details open, and "Still delegating to them". */
  editing?: boolean;
  others?: Person[];
  submitLabel: string;
  onSubmit: (details: PersonDetails) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [aka, setAka] = useState((initial?.aka ?? []).join(", "));
  const [active, setActive] = useState(initial?.active !== false);
  const [more, setMore] = useState(editing);
  const [error, setError] = useState("");

  // Someone else current with the same name: a full name tells them apart (§4).
  const clash = others.find((p) => isActive(p) && name.trim() && p.name.trim().toLowerCase() === name.trim().toLowerCase());

  function submit() {
    if (!name.trim()) return setError("Add their name, as you'd say it.");
    if (!isValidEmail(email)) return setError("That email address doesn't look right.");
    setError("");
    onSubmit({ name, email, role, fullName, aka: parseAka(aka), active });
    if (!initial?.email) {
      setName("");
      setEmail("");
      setRole("");
      setFullName("");
      setAka("");
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Name, as you'd say it">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya" className={inputClass} />
      </Field>
      {clash && (
        <p className="rounded-xl border-2 border-ink bg-sun/40 px-3 py-2 text-sm">
          You already have a {clash.name}
          {clash.fullName ? ` (${clash.fullName})` : ""}. Add a full name below so Dispatch can tell them apart.
        </p>
      )}
      <Field label="Email">
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
      </Field>
      {more || clash ? (
        <>
          <Field label="Role (optional)">
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. EA, Head of Ops" className={inputClass} />
          </Field>
          <Field label="Full name (optional)" hint="Tells apart two people with the same name, e.g. Tom Jones and Tom Smith.">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Priya Patel" className={inputClass} />
          </Field>
          <Field
            label="Also known as (optional)"
            hint="Nicknames, or how speech recognition hears their name, separated by commas. Dispatch matches these too."
          >
            <input value={aka} onChange={(e) => setAka(e.target.value)} placeholder="e.g. Pree, Maria" className={inputClass} />
          </Field>
        </>
      ) : (
        <button onClick={() => setMore(true)} className="text-sm font-semibold text-dim underline">
          More details: role, full name, also known as
        </button>
      )}
      {editing && (
        <label className="flex items-start gap-3 rounded-xl border-2 border-ink bg-white px-3 py-2.5">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mt-1 h-5 w-5 accent-cobalt" />
          <span>
            <span className="block font-semibold">Still delegating to them</span>
            <span className="block text-sm text-dim">Untick when someone leaves. They&apos;re hidden from notes but kept here.</span>
          </span>
        </label>
      )}
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

function PersonRow({ person, onEdit }: { person: Person; onEdit: () => void }) {
  const p = person;
  return (
    <li className={`flex items-center gap-3 rounded-[18px] border-2 border-ink bg-white p-3 shadow-pop ${isActive(p) ? "" : "opacity-60"}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-bold">
        {p.name.charAt(0).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">
          {p.name}
          {p.fullName && p.fullName !== p.name && <span className="font-normal text-dim"> · {p.fullName}</span>}
        </span>
        <span className="block truncate text-sm text-dim">{p.role ? `${p.role} · ${p.email}` : p.email}</span>
        {p.aka?.length ? <span className="block truncate text-sm text-dim">Also known as: {p.aka.join(", ")}</span> : null}
      </span>
      <button onClick={onEdit} className="btn-secondary">
        Edit
      </button>
    </li>
  );
}

/**
 * Delegates: the people list (DispatchSpec.md §4), saved on this device. People you no longer delegate to are
 * listed separately, out of the way of notes but not deleted.
 */
export function PeopleManager() {
  // Always the latest list, including delegates added during a note (see lib/local.ts).
  const people = usePeople();
  const [editing, setEditing] = useState<string | null>(null);

  const update = (next: Person[]) => savePeople(next); // every screen updates from this
  const current = people.filter(isActive);
  const former = people.filter((p) => !isActive(p));

  const row = (p: Person) =>
    editing === p.id ? (
      <li key={p.id} className="rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
        <PersonForm
          initial={p}
          editing
          others={people.filter((q) => q.id !== p.id)}
          submitLabel="Save"
          onSubmit={(details) => {
            update(people.map((q) => (q.id === p.id ? { ...makePerson(details), id: p.id } : q)));
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onDelete={() => {
            if (!confirm(`Delete ${p.name}? To keep them but hide them from notes, untick "Still delegating to them" instead.`)) return;
            update(people.filter((q) => q.id !== p.id));
            setEditing(null);
          }}
        />
      </li>
    ) : (
      <PersonRow key={p.id} person={p} onEdit={() => setEditing(p.id)} />
    );

  return (
    <>
      <div className="space-y-2">
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-tight">Delegates</h1>
        <p className="text-[15px] leading-relaxed text-dim">
          The people you delegate to: your EA and direct reports. Dispatch uses their names and email addresses for the To
          and CC lines. They&apos;re saved on this device.
        </p>
      </div>

      {current.length > 0 && <ul className="space-y-3">{current.map(row)}</ul>}

      <section className="space-y-3 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
        <h2 className="font-display text-[20px] font-extrabold tracking-tight">
          {current.length ? "Add a delegate" : "Add your first delegate"}
        </h2>
        <PersonForm others={people} submitLabel="Add delegate" onSubmit={(details) => update([...people, makePerson(details)])} />
      </section>

      {former.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-extrabold tracking-tight">No longer delegating to</h2>
          <p className="text-sm text-dim">Hidden from notes. Edit someone to bring them back.</p>
          <ul className="space-y-3">{former.map(row)}</ul>
        </section>
      )}

      {current.length > 0 && (
        <Link href="/note" className="btn-primary w-full">
          Start a note
        </Link>
      )}
    </>
  );
}
