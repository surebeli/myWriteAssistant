import { claudeAdapter } from "./claude";
import { deepseekAdapter } from "./deepseek";
import { doubaoAdapter } from "./doubao";
import { kimiAdapter } from "./kimi";
import { openaiAdapter } from "./openai";

export { claudeAdapter } from "./claude";
export { deepseekAdapter } from "./deepseek";
export { doubaoAdapter } from "./doubao";
export { kimiAdapter } from "./kimi";
export { openaiAdapter } from "./openai";

/** Aggregate list of all installed adapters; imported by the registry. */
export const adapters = [doubaoAdapter, claudeAdapter, deepseekAdapter, openaiAdapter, kimiAdapter];
