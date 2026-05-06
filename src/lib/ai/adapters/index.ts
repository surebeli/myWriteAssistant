import { claudeAdapter } from "./claude";
import { doubaoAdapter } from "./doubao";

export { claudeAdapter } from "./claude";
export { doubaoAdapter } from "./doubao";

/** Aggregate list of all installed adapters; imported by the registry. */
export const adapters = [doubaoAdapter, claudeAdapter];
