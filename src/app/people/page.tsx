import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { TopBar } from "@/components/top-bar";
import { PeopleManager } from "./people-manager";

export const metadata: Metadata = { title: "Delegates · Dispatch" };

export default function PeoplePage() {
  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-4 py-6">
      <TopBar />
      <ClientOnly fallback={<p className="text-dim">Loading…</p>}>
        <PeopleManager />
      </ClientOnly>
    </main>
  );
}
