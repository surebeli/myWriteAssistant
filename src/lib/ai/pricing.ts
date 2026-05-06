import type { AIProviderId } from "./types";

/** Pricing record for a specific provider + model pair. */
export interface AIModelPricing {
  provider: AIProviderId;
  model: string;
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  effectiveDate: string;
}

/** In-memory catalog of known model pricing (populated at runtime). */
export const MODEL_PRICING: AIModelPricing[] = [];

/**
 * Estimate the USD cost of a call from token counts and known pricing.
 * @param params - Provider, model, and token counts.
 * @returns Estimated USD cost, or undefined if pricing is unknown.
 */
export function estimateUsd(params: {
  provider: AIProviderId;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
}): number | undefined {
  if (params.tokensIn == null || params.tokensOut == null) {
    return undefined;
  }

  const pricing = MODEL_PRICING.find(
    (item) => item.provider === params.provider && item.model === params.model,
  );

  if (!pricing) {
    return undefined;
  }

  return (
    (params.tokensIn / 1_000_000) * pricing.inputUsdPerMillionTokens +
    (params.tokensOut / 1_000_000) * pricing.outputUsdPerMillionTokens
  );
}
