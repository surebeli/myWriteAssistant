"use client";

import { create } from "zustand";

export type AssistantMode = "proactive" | "chat";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  // 可选：AI 回复可以有建议操作
  actions?: {
    type: "insert" | "copy";
    label: string;
  }[];
}

interface ProactiveState {
  currentSentence: string;
  suggestion: string | null;
  isGenerating: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
}

interface AIState {
  // 当前模式
  mode: AssistantMode;
  
  // Proactive 模式状态
  proactive: ProactiveState;
  
  // Chat 模式状态
  chat: ChatState;
}

interface AIActions {
  // 模式切换
  setMode: (mode: AssistantMode) => void;
  
  // Chat 操作
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  clearMessages: () => void;
  
  // Proactive 操作
  setCurrentSentence: (sentence: string) => void;
  setSuggestion: (suggestion: string | null) => void;
  setProactiveGenerating: (isGenerating: boolean) => void;
  clearSuggestion: () => void;
}

type AIStore = AIState & AIActions;

// 生成唯一 ID
function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useAIStore = create<AIStore>((set) => ({
  // 初始状态
  mode: "chat",
  
  proactive: {
    currentSentence: "",
    suggestion: null,
    isGenerating: false,
  },
  
  chat: {
    messages: [],
    isStreaming: false,
    streamingContent: "",
  },
  
  // 模式切换
  setMode: (mode) => set({ mode }),
  
  // Chat 操作
  addMessage: (message) =>
    set((state) => ({
      chat: {
        ...state.chat,
        messages: [
          ...state.chat.messages,
          {
            ...message,
            id: generateMessageId(),
            timestamp: new Date().toISOString(),
          },
        ],
      },
    })),
  
  updateLastMessage: (content) =>
    set((state) => {
      const messages = [...state.chat.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { chat: { ...state.chat, messages } };
    }),
  
  setStreaming: (isStreaming) =>
    set((state) => ({
      chat: { ...state.chat, isStreaming },
    })),
  
  setStreamingContent: (streamingContent) =>
    set((state) => ({
      chat: { ...state.chat, streamingContent },
    })),
  
  clearMessages: () =>
    set((state) => ({
      chat: { ...state.chat, messages: [], streamingContent: "" },
    })),
  
  // Proactive 操作
  setCurrentSentence: (currentSentence) =>
    set((state) => ({
      proactive: { ...state.proactive, currentSentence },
    })),
  
  setSuggestion: (suggestion) =>
    set((state) => ({
      proactive: { ...state.proactive, suggestion },
    })),
  
  setProactiveGenerating: (isGenerating) =>
    set((state) => ({
      proactive: { ...state.proactive, isGenerating },
    })),
  
  clearSuggestion: () =>
    set((state) => ({
      proactive: { ...state.proactive, suggestion: null },
    })),
}));
