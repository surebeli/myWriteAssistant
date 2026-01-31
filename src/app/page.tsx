"use client";

import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "@/components/layout/sidebar";
import { MainEditor } from "@/components/layout/main-editor";
import { AIPanel } from "@/components/layout/ai-panel";
import { LibraryView } from "@/components/library/library-view";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { WelcomeDialog } from "@/components/settings/welcome-dialog";

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      {currentView === "editor" ? <MainEditor /> : <LibraryView />}
      <AIPanel />
      
      {/* 全局弹窗 */}
      <SettingsDialog />
      <WelcomeDialog />
    </div>
  );
}

