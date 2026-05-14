/**
 * OpenAI / Azure OpenAI vision provider.
 *
 * Same code path for both — Azure mode flips on when AZURE_OPENAI_ENDPOINT is set.
 * Uses the Chat Completions API (gpt-4o-mini / gpt-4o for OpenAI, or any deployed
 * vision model for Azure).
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

export class OpenAIProvider implements AIVisionProvider {
  readonly name: 'openai' | 'azure-openai';
  readonly model: string;

  constructor(public readonly azure: boolean) {
    this.name = azure ? 'azure-openai' : 'openai';
    this.model = azure
      ? (config.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o-mini')
      : config.OPENAI_MODEL;
  }

  private buildUrl(): string {
    if (this.azure) {
      const endpoint = (config.AZURE_OPENAI_ENDPOINT ?? '').replace(/\/$/, '');
      const deployment = config.AZURE_OPENAI_DEPLOYMENT;
      const apiVersion = config.AZURE_OPENAI_API_VERSION;
      return `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
    }
    return `${config.OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.azure) {
      if (!config.AZURE_OPENAI_API_KEY) {
        throw new HttpError(500, 'ai_misconfigured', 'AZURE_OPENAI_API_KEY not set.');
      }
      headers['api-key'] = config.AZURE_OPENAI_API_KEY;
    } else {
      if (!config.OPENAI_API_KEY) {
        throw new HttpError(500, 'ai_misconfigured', 'OPENAI_API_KEY not set.');
      }
      headers.Authorization = `Bearer ${config.OPENAI_API_KEY}`;
    }
    return headers;
  }

  async analyzeMealPhoto(imageBuffer: Buffer, mimeType: string): Promise<AnalyzeResult> {
    const url = this.buildUrl();
    const headers = this.buildHeaders();
    const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

    const body: Record<string, unknown> = {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this meal. Return JSON only.' },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.2,
    };
    // Azure URLs already include the deployment; OpenAI needs `model` in the body.
    if (!this.azure) body.model = this.model;

    const start = Date.now();
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      logger.error({ err, azure: this.azure }, 'openai fetch failed');
      throw new HttpError(502, 'ai_unavailable', `Couldn't reach ${this.name}. Try again in a moment.`);
    }
    const latency_ms = Date.now() - start;

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 401) {
        throw new HttpError(500, 'ai_misconfigured', `${this.name} key rejected (401). Check credentials.`);
      }
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const detail = retryAfter ? `Try again in ${retryAfter} seconds.` : 'Try again in a moment.';
        logger.warn({ provider: this.name, body: text.slice(0, 500) }, 'openai 429');
        throw new HttpError(503, 'ai_rate_limited', `${this.name} rate-limited. ${detail}`);
      }
      logger.warn({ provider: this.name, status: res.status, body: text.slice(0, 500) }, 'openai non-200');
      throw new HttpError(502, 'ai_error', `${this.name} couldn't process this image.`);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    };
    logger.info({ ms: latency_ms, provider: this.name, model: this.model }, 'openai response');

    const content = json.choices?.[0]?.message?.content ?? '';
    if (!content) {
      throw new HttpError(502, 'ai_empty', `${this.name} returned an empty response. Try again.`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(content));
    } catch {
      logger.warn({ content: content.slice(0, 500) }, 'openai unparseable JSON');
      throw new HttpError(502, 'ai_parse_error', `${this.name} response didn't parse. Try a clearer photo.`);
    }

    return {
      estimate: normalizeEstimate(parsed),
      raw: json,
      provider: this.name,
      model: this.model,
      latency_ms,
    };
  }
}
