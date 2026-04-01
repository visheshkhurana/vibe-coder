"use client";
import { useAppState } from "@/hooks/useAppState";
import HomePage from "@/components/home/HomePage";
import WorkspaceShell from "@/components/ide/WorkspaceShell";

export default function App() {
  const { view } = useAppState();

  if (view === "workspace") return <WorkspaceShell />;
  return <HomePage />;
}
