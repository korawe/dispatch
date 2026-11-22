import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { NoteFlow } from "./note-flow";

export const metadata: Metadata = { title: "New note · Dispatch" };

export default function NotePage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <ClientOnly fallback={<p className="text-dim">Loading…</p>}>
        <NoteFlow />
      </ClientOnly>
    </main>
  );
}
