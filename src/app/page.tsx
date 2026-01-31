import { Toolbar } from "@/components/layout/toolbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MainEditor } from "@/components/layout/main-editor";
import { AIPanel } from "@/components/layout/ai-panel";
import { StatusBar } from "@/components/layout/status-bar";

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainEditor />
        <AIPanel />
      </div>
      <StatusBar />
    </div>
  );
}

