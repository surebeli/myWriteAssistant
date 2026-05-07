import { claudeAdapter } from "./claude";
import { doubaoAdapter } from "./doubao";
import { openaiAdapter } from "./openai";

export { claudeAdapter } from "./claude";
export { doubaoAdapter } from "./doubao";
export { openaiAdapter } from "./openai";

/** Aggregate list of all installed adapters; imported by the registry. */
export const adapters = [doubaoAdapter, claudeAdapter, openaiAdapter];
