import type { AIProviderId } from "./types";

export interface AIModelPricing {
  provider: AIProviderId;
  model: string;
  inputUsdPerMillionTokens: number;
  outputUsdPerMillionTokens: number;
  effectiveDate: string;
}

export const MODEL_PRICING: AIModelPricing[] = [];

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
