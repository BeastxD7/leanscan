/**
 * AWS Bedrock vision provider — uses Anthropic Claude models for vision.
 *
 * Default model: anthropic.claude-3-5-sonnet-20241022-v2:0 (or whatever is set
 * in BEDROCK_MODEL_ID — make sure your account has access via the Bedrock console).
 *
 * Auth: standard AWS credential chain. Set either:
 *   - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (+ optional AWS_SESSION_TOKEN)
 *   - or rely on the default chain (IAM role, ~/.aws/credentials, etc.)
 */
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
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

let client: BedrockRuntimeClient | null = null;
function getClient(): BedrockRuntimeClient {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: config.AWS_REGION,
      ...(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: config.AWS_ACCESS_KEY_ID,
              secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
              ...(config.AWS_SESSION_TOKEN ? { sessionToken: config.AWS_SESSION_TOKEN } : {}),
            },
          }
        : {}),
    });
  }
  return client;
}

export class BedrockProvider implements AIVisionProvider {
  readonly name = 'bedrock';
  get model(): string {
    return config.BEDROCK_MODEL_ID;
  }

  async analyzeMealPhoto(imageBuffer: Buffer, mimeType: string): Promise<AnalyzeResult> {
    // Anthropic Messages API on Bedrock (works with all Claude 3.x models).
    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      // Bumped from 800 for multi-item output (up to 8 items × ~80 tokens each).
      max_tokens: 1500,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBuffer.toString('base64'),
              },
            },
            { type: 'text', text: 'Analyze this meal. Return JSON only.' },
          ],
        },
      ],
    };

    const cmd = new InvokeModelCommand({
      modelId: this.model,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(body),
    });

    const start = Date.now();
    let response;
    try {
      response = await getClient().send(cmd);
    } catch (err) {
      const e = err as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
      const status = e.$metadata?.httpStatusCode ?? 502;
      logger.error({ err, status }, 'bedrock invoke failed');
      if (status === 401 || status === 403 || e.name === 'AccessDeniedException') {
        throw new HttpError(
          500,
          'ai_misconfigured',
          'AWS credentials rejected by Bedrock. Check AWS keys and model access in the Bedrock console.',
        );
      }
      if (status === 429 || e.name === 'ThrottlingException') {
        throw new HttpError(503, 'ai_rate_limited', 'Bedrock throttled. Try again in a moment.');
      }
      if (e.name === 'ValidationException') {
        throw new HttpError(
          500,
          'ai_misconfigured',
          `Bedrock validation error — check BEDROCK_MODEL_ID has vision support. (${e.message ?? ''})`,
        );
      }
      throw new HttpError(502, 'ai_error', "Bedrock couldn't process this image. Try a clearer photo.");
    }
    const latency_ms = Date.now() - start;

    const text = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(text) as {
      content?: Array<{ type: string; text?: string }>;
      stop_reason?: string;
    };
    logger.info({ ms: latency_ms, model: this.model, stop_reason: parsedResponse.stop_reason }, 'bedrock response');

    const content =
      parsedResponse.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
    if (!content) {
      throw new HttpError(502, 'ai_empty', 'Bedrock returned an empty response. Try again.');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(content));
    } catch {
      logger.warn({ content: content.slice(0, 500) }, 'bedrock unparseable JSON');
      throw new HttpError(502, 'ai_parse_error', "Bedrock response didn't parse. Try a clearer photo.");
    }

    return {
      estimate: normalizeEstimate(parsed),
      raw: parsedResponse,
      provider: this.name,
      model: this.model,
      latency_ms,
    };
  }
}
