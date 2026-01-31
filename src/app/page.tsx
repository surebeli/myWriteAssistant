"use client";

import { useAppStore } from "@/stores/app-store";
import { Toolbar } from "@/components/layout/toolbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MainEditor } from "@/components/layout/main-editor";
import { AIPanel } from "@/components/layout/ai-panel";
import { StatusBar } from "@/components/layout/status-bar";
import { LibraryView } from "@/components/library/library-view";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { WelcomeDialog } from "@/components/settings/welcome-dialog";

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        {currentView === "editor" ? <MainEditor /> : <LibraryView />}
        <AIPanel />
      </div>
      <StatusBar />
      
      {/* 全局弹窗 */}
      <SettingsDialog />
      <WelcomeDialog />
    </div>
  );
}

