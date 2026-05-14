/**
 * Standard API response envelope.
 *
 * Every endpoint returns one of:
 *   { success: true,  message: string, data?: T }
 *   { success: false, message: string, error?: { code, details? } }
 *
 * `message` is always set and is safe to surface to the user (toast / inline).
 * `error.code` is machine-readable for clients that want to branch on it.
 */
import type { Response } from 'express';

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  error?: { code: string; details?: unknown };
}

export type ApiBody<T> = ApiSuccessBody<T> | ApiErrorBody;

/** Build a success body. Don't call res.json() — caller does. */
export function apiSuccess<T>(message: string, data?: T): ApiSuccessBody<T> {
  const body: ApiSuccessBody<T> = { success: true, message };
  if (data !== undefined) body.data = data;
  return body;
}

/** Build an error body. */
export function apiError(message: string, code = 'error', details?: unknown): ApiErrorBody {
  const body: ApiErrorBody = { success: false, message };
  if (code || details !== undefined) {
    body.error = { code, ...(details !== undefined ? { details } : {}) };
  }
  return body;
}

/** One-call shortcut: res.status + json + envelope. */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
): void {
  res.status(statusCode).json(apiSuccess(message, data));
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code = 'error',
  details?: unknown,
): void {
  res.status(statusCode).json(apiError(message, code, details));
}
