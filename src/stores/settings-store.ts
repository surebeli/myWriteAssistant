import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface SettingsState {
  // AI 配置
  aiConfig: AIConfig;
  setAIConfig: (config: Partial<AIConfig>) => void;

  // 持久化完成标记
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  
  // 工作目录
  workspacePath: string | null;
  workspaceHandle: FileSystemDirectoryHandle | null;
  setWorkspacePath: (path: string | null) => void;
  setWorkspaceHandle: (handle: FileSystemDirectoryHandle | null) => void;
  
  // 首次启动标记
  isFirstLaunch: boolean;
  setFirstLaunch: (value: boolean) => void;
  
  // 设置弹窗状态
  settingsDialogOpen: boolean;
  settingsDialogTab: 'ai' | 'workspace' | 'appearance';
  openSettingsDialog: (tab?: 'ai' | 'workspace' | 'appearance') => void;
  closeSettingsDialog: () => void;
}

const defaultAIConfig: AIConfig = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // AI 配置
      aiConfig: defaultAIConfig,
      setAIConfig: (config) => set((state) => ({
        aiConfig: { ...state.aiConfig, ...config },
      })),

      // 持久化完成标记
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      
      // 工作目录 - handle 不能持久化，需要重新请求权限
      workspacePath: null,
      workspaceHandle: null,
      setWorkspacePath: (path) => set({ workspacePath: path }),
      setWorkspaceHandle: (handle) => set({ 
        workspaceHandle: handle,
        workspacePath: handle?.name || null,
      }),
      
      // 首次启动
      isFirstLaunch: true,
      setFirstLaunch: (value) => set({ isFirstLaunch: value }),
      
      // 设置弹窗
      settingsDialogOpen: false,
      settingsDialogTab: 'ai',
      openSettingsDialog: (tab = 'ai') => set({ 
        settingsDialogOpen: true, 
        settingsDialogTab: tab,
      }),
      closeSettingsDialog: () => set({ settingsDialogOpen: false }),
    }),
    {
      name: 'mywriteassistant-settings',
      // 只持久化可序列化的字段
      partialize: (state) => ({
        aiConfig: state.aiConfig,
        workspacePath: state.workspacePath,
        isFirstLaunch: state.isFirstLaunch,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
