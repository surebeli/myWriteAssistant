import { create } from 'zustand';

type AssistantMode = 'proactive' | 'chat';

interface AppState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // AI Panel state
  aiPanelOpen: boolean;
  toggleAIPanel: () => void;
  
  // Assistant mode
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  
  // Current view
  currentView: 'editor' | 'library';
  setCurrentView: (view: 'editor' | 'library') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar - open by default
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // AI Panel - open by default
  aiPanelOpen: true,
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  
  // Assistant mode - proactive by default
  assistantMode: 'proactive',
  setAssistantMode: (mode) => set({ assistantMode: mode }),
  
  // Current view
  currentView: 'editor',
  setCurrentView: (view) => set({ currentView: view }),
}));
