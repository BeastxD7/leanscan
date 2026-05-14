/**
 * @deprecated Moved to `src/services/ai/`. Use the factory:
 *   import { getAIProvider } from '../services/ai/index.js';
 *   const { estimate } = await getAIProvider().analyzeMealPhoto(buffer, mime);
 *
 * Kept as a re-export so any straggling imports don't break.
 */
export type { MealEstimate, AnalyzeResult } from './ai/types.js';
export { GeminiProvider } from './ai/gemini.js';

import { GeminiProvider } from './ai/gemini.js';

/** @deprecated Use getAIProvider() instead. */
export async function analyzeMealPhoto(imageBuffer: Buffer, mimeType: string) {
  return new GeminiProvider().analyzeMealPhoto(imageBuffer, mimeType);
}
