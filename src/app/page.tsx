import { Sidebar } from "@/components/layout/Sidebar";
import { mockSnippets } from "@/data/mockSnippets";

export default function Home() {
  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-950">
      <Sidebar snippets={mockSnippets} />
      <main className="flex min-w-0 flex-1 items-center justify-center px-6 py-10">
        <p className="max-w-sm text-center text-sm text-neutral-500">
          Select a snippet or create a new one.
        </p>
      </main>
    </div>
  );
}
