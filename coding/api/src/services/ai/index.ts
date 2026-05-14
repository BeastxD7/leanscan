/**
 * AI provider factory.
 * Provider is selected at process start from AI_PROVIDER env var.
 *
 * Switching: change AI_PROVIDER in .env, restart the API.
 *
 * Supported values:
 *   gemini        — Google Gemini (default; matches our demo)
 *   openai        — OpenAI direct (GPT-4o / 4o-mini etc.)
 *   azure-openai  — Azure-hosted OpenAI deployment
 *   bedrock       — AWS Bedrock running Claude (Anthropic)
 */
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { type AIVisionProvider } from './types.js';
import { GeminiProvider } from './gemini.js';
import { OpenAIProvider } from './openai.js';
import { BedrockProvider } from './bedrock.js';

let cached: AIVisionProvider | null = null;

export function getAIProvider(): AIVisionProvider {
  if (cached) return cached;
  const choice = config.AI_PROVIDER;
  switch (choice) {
    case 'openai':
      cached = new OpenAIProvider(false);
      break;
    case 'azure-openai':
      cached = new OpenAIProvider(true);
      break;
    case 'bedrock':
      cached = new BedrockProvider();
      break;
    case 'gemini':
    default:
      cached = new GeminiProvider();
      break;
  }
  logger.info({ provider: cached.name, model: cached.model }, 'AI provider initialized');
  return cached;
}

// Re-exports for callers
export type { AIVisionProvider, AnalyzeResult, MealEstimate, ConfidenceLevel } from './types.js';
