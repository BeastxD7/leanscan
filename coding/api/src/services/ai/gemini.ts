/**
 * Google Gemini Vision provider.
 * Uses raw fetch — no SDK dep needed.
 */
import { config } from '../../config.js';
import { logger } from '../../lib/logger.js';
import { HttpError } from '../../middleware/errorHandler.js';
import {
  type AIVisionProvider,
  type AnalyzeResult,
  SYSTEM_PROMPT,
  extractJson,
  normalizeEstimate,
} from './types.js';

export class GeminiProvider implements AIVisionProvider {
  readonly name = 'gemini';
  get model(): string {
    return config.GEMINI_MODEL;
  }

  async analyzeMealPhoto(imageBuffer: Buffer, mimeType: string): Promise<AnalyzeResult> {
    if (!config.GEMINI_API_KEY) {
      throw new HttpError(500, 'ai_misconfigured', 'GEMINI_API_KEY not set.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(config.GEMINI_API_KEY)}`;

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Analyze this meal. Return JSON only.' },
            { inlineData: { mimeType, data: imageBuffer.toString('base64') } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 },
      },
    };

    const start = Date.now();
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      logger.error({ err }, 'gemini fetch failed');
      throw new HttpError(502, 'ai_unavailable', "Couldn't reach Gemini. Try again in a moment.");
    }
    const latency_ms = Date.now() - start;

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 400 && /API key/i.test(text)) {
        throw new HttpError(500, 'ai_misconfigured', 'Gemini API key invalid. Check GEMINI_API_KEY.');
      }
      if (res.status === 403) {
        throw new HttpError(500, 'ai_misconfigured', 'Gemini rejected the request. Check key permissions.');
      }
      if (res.status === 429) {
        let detail = 'Try again in a moment.';
        try {
          const parsed = JSON.parse(text) as {
            error?: {
              message?: string;
              details?: Array<{ retryDelay?: string }>;
            };
          };
          const retry = parsed.error?.details?.find((d) => typeof d.retryDelay === 'string')?.retryDelay;
          if (retry) {
            const secs = parseInt(retry, 10);
            if (Number.isFinite(secs) && secs > 0) {
              detail =
                secs < 60
                  ? `Try again in ${secs} seconds.`
                  : `Try again in ${Math.ceil(secs / 60)} minute${Math.ceil(secs / 60) === 1 ? '' : 's'}.`;
            }
          }
          if (parsed.error?.message?.toLowerCase().includes('per day')) {
            detail =
              "You've hit today's free Gemini quota (1500/day). Switch AI_PROVIDER, swap keys, or use manual entry.";
          }
        } catch {
          /* keep default */
        }
        logger.warn({ body: text.slice(0, 500) }, 'gemini 429');
        throw new HttpError(503, 'ai_rate_limited', `Gemini rate-limited. ${detail}`);
      }
      logger.warn({ status: res.status, body: text.slice(0, 500) }, 'gemini non-200');
      throw new HttpError(502, 'ai_error', "Gemini couldn't process this image. Try a clearer photo.");
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string }> };
      }>;
      promptFeedback?: { blockReason?: string };
    };
    logger.info({ ms: latency_ms, model: this.model }, 'gemini response');

    const candidate = data.candidates?.[0];
    if (!candidate) {
      if (data.promptFeedback?.blockReason) {
        throw new HttpError(
          400,
          'photo_blocked',
          `That photo was blocked by safety filters (${data.promptFeedback.blockReason}). Try another.`,
        );
      }
      throw new HttpError(502, 'ai_empty', 'Gemini returned an empty response. Try again.');
    }
    if (
      candidate.finishReason &&
      candidate.finishReason !== 'STOP' &&
      candidate.finishReason !== 'MAX_TOKENS'
    ) {
      throw new HttpError(502, 'ai_finish_reason', `Gemini stopped (${candidate.finishReason}). Try again.`);
    }

    const content = candidate.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    if (!content) {
      throw new HttpError(502, 'ai_empty', 'Gemini returned an empty response. Try again.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(content));
    } catch {
      logger.warn({ content: content.slice(0, 500) }, 'gemini unparseable JSON');
      throw new HttpError(502, 'ai_parse_error', "Gemini response didn't parse. Try a clearer photo.");
    }

    return {
      estimate: normalizeEstimate(parsed),
      raw: data,
      provider: this.name,
      model: this.model,
      latency_ms,
    };
  }
}
