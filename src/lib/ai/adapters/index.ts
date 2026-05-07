import { claudeAdapter } from "./claude";
import { doubaoAdapter } from "./doubao";
import { kimiAdapter } from "./kimi";
import { openaiAdapter } from "./openai";

export { claudeAdapter } from "./claude";
export { doubaoAdapter } from "./doubao";
export { kimiAdapter } from "./kimi";
export { openaiAdapter } from "./openai";

/** Aggregate list of all installed adapters; imported by the registry. */
export const adapters = [doubaoAdapter, claudeAdapter, openaiAdapter, kimiAdapter];
