"use client";

// The future features list: the shared list in features.ts, plus any added on this iPhone. Adding is only
// on the iPhone (the user's choice, 22 Nov); additions are saved on the phone (decision 34).

import { useState } from "react";
import { newId, readLocal, writeLocal } from "@/lib/local";
import { isIPhone } from "@/lib/voice";
import { inputClass } from "../../people/people-manager";
import type { Feature } from "./features";

type AddedFeature = Feature & { id: string };

const ADDED_KEY = "dispatch-features-v1";
const STATUSES: Feature["status"][] = ["Idea", "Planned", "In progress", "Done"];

function FeatureCard({ feature, onDelete }: { feature: Feature; onDelete?: () => void }) {
  return (
    <li className="space-y-2 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
      <h2 className="font-display text-[20px] leading-tight font-extrabold tracking-tight">{feature.title}</h2>
      <p className="flex flex-wrap items-center gap-2 text-sm text-dim">
        <span className="rounded-full border-2 border-ink bg-sun px-2.5 py-0.5 text-xs font-bold text-ink">{feature.status}</span>
        Added {feature.added}
        {onDelete && " · on this iPhone"}
      </p>
      {feature.detail && <p className="text-[15px] leading-relaxed whitespace-pre-line">{feature.detail}</p>}
      {onDelete && (
        <button onClick={onDelete} className="text-sm font-semibold text-dim underline">
          Delete
        </button>
      )}
    </li>
  );
}

function AddFeatureForm({ onAdd, onCancel }: { onAdd: (f: AddedFeature) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<Feature["status"]>("Idea");

  function add() {
    if (!title.trim()) return;
    onAdd({
      id: newId(),
      title: title.trim(),
      detail: detail.trim(),
      status,
      added: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });
  }

  return (
    <div className="space-y-3 rounded-[18px] border-2 border-ink bg-white p-4 shadow-pop">
      <h2 className="font-display text-[20px] font-extrabold tracking-tight">New feature</h2>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calendar holds for deadlines" className={inputClass} />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Details</span>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={4}
          placeholder="What it does, and why it would help"
          className={inputClass}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as Feature["status"])} className={inputClass}>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button onClick={add} disabled={!title.trim()} className="btn-primary">
          Add feature
        </button>
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function FeatureList({ shared }: { shared: Feature[] }) {
  const [added, setAdded] = useState<AddedFeature[]>(() => readLocal<AddedFeature[]>(ADDED_KEY, []));
  const [canAdd] = useState(isIPhone);
  const [adding, setAdding] = useState(false);

  const save = (next: AddedFeature[]) => {
    setAdded(next);
    writeLocal(ADDED_KEY, next);
  };

  return (
    <>
      {canAdd ? (
        adding ? (
          <AddFeatureForm
            onAdd={(f) => {
              save([...added, f]);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button onClick={() => setAdding(true)} className="btn-primary w-full">
            ＋ Add a feature
          </button>
        )
      ) : (
        <p className="rounded-xl border-2 border-ink bg-periwinkle px-3 py-2.5 text-[15px]">
          Adding features is only available on your iPhone.
        </p>
      )}
      <ul className="space-y-3">
        {shared.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
        {added.map((f) => (
          <FeatureCard
            key={f.id}
            feature={f}
            onDelete={() => {
              if (confirm(`Delete "${f.title}"?`)) save(added.filter((x) => x.id !== f.id));
            }}
          />
        ))}
      </ul>
    </>
  );
}
