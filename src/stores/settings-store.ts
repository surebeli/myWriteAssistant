import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { keyStorage } from '@/lib/ai/key-storage';
import type { AIProviderId, AISettingsV2 } from '@/lib/ai/types';

interface AIConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface SettingsState {
  schemaVersion: 2;
  ai: AISettingsV2;
  setAISettings: (settings: AISettingsV2) => void;

  // Legacy facade for the pre-v0.2 settings dialog. T05 replaces this UI.
  aiConfig: AIConfig;
  setAIConfig: (config: Partial<AIConfig>) => void;
  
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

export const defaultAISettings: AISettingsV2 = {
  mode: 'simple',
  simple: { providerId: 'doubao' },
  perScenario: {},
};

function legacyProviderToProviderId(provider: AIConfig['provider']): AIProviderId {
  if (provider === 'anthropic') {
    return 'claude';
  }

  if (provider === 'custom') {
    return 'openai';
  }

  return provider;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      schemaVersion: 2,
      ai: defaultAISettings,
      setAISettings: (settings) => set({
        schemaVersion: 2,
        ai: settings,
      }),

      // AI 配置 legacy facade. API keys are intentionally excluded from persist.
      aiConfig: defaultAIConfig,
      setAIConfig: (config) => set((state) => {
        const nextConfig = { ...state.aiConfig, ...config };
        const providerId = legacyProviderToProviderId(nextConfig.provider);

        if (typeof config.apiKey === 'string') {
          void keyStorage.set(providerId, config.apiKey);
        }

        return {
          aiConfig: nextConfig,
          schemaVersion: 2,
          ai: {
            mode: 'simple',
            simple: {
              providerId,
              modelOverride: nextConfig.model || undefined,
              baseURLOverride: nextConfig.baseUrl || undefined,
            },
            perScenario: state.ai.perScenario,
          },
        };
      }),
      
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
      storage: createJSONStorage(() => globalThis.localStorage),
      // 只持久化可序列化的字段
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        ai: state.ai,
        aiConfig: { ...state.aiConfig, apiKey: '' },
        workspacePath: state.workspacePath,
        isFirstLaunch: state.isFirstLaunch,
      }),
    }
  )
);
