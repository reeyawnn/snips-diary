import { DashboardShell } from "@/components/layout/DashboardShell";
import { mockSnippets } from "@/data/mockSnippets";

export default function Home() {
  return <DashboardShell snippets={mockSnippets} />;
}
