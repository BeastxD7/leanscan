/**
 * Local-filesystem storage for meal photos.
 *
 * Layout under UPLOADS_DIR:
 *   meals/{userId}/{mealId}-{timestamp}.jpg
 *
 * In production the UPLOADS_DIR points at a DigitalOcean volume.
 * Backups via cron (rsync to a separate backup target) — set up in Phase 7.
 *
 * Photos are NEVER served directly via static URL. The mobile app fetches them
 * through an authenticated route (GET /v1/meals/:id/photo) that streams the file
 * after verifying the JWT user owns that meal.
 */
import { mkdir, writeFile, readFile, unlink, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { HttpError } from '../middleware/errorHandler.js';

/** Guard against path traversal — relative path must not escape UPLOADS_DIR. */
function safeJoin(relative: string): string {
  const full = normalize(join(config.UPLOADS_DIR, relative));
  if (!full.startsWith(normalize(config.UPLOADS_DIR))) {
    throw new HttpError(400, 'invalid_path', 'Invalid storage path');
  }
  return full;
}

export const storage = {
  /**
   * Build a deterministic relative path for a meal photo.
   * Returns: meals/<userId>/<mealId>-<uuid>.<ext>
   */
  mealPhotoPath(userId: string, mealId: string, ext = 'jpg'): string {
    const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
    return `meals/${userId}/${mealId}-${randomUUID()}.${safeExt}`;
  },

  async put(relativePath: string, data: Buffer): Promise<string> {
    if (data.byteLength > config.UPLOADS_MAX_BYTES) {
      throw new HttpError(413, 'file_too_large', 'File exceeds size limit');
    }
    const full = safeJoin(relativePath);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, data);
    logger.debug({ path: relativePath, bytes: data.byteLength }, 'wrote file');
    return relativePath;
  },

  async get(relativePath: string): Promise<Buffer> {
    const full = safeJoin(relativePath);
    return readFile(full);
  },

  stream(relativePath: string): NodeJS.ReadableStream {
    const full = safeJoin(relativePath);
    return createReadStream(full);
  },

  async exists(relativePath: string): Promise<boolean> {
    try {
      await stat(safeJoin(relativePath));
      return true;
    } catch {
      return false;
    }
  },

  async delete(relativePath: string): Promise<void> {
    try {
      await unlink(safeJoin(relativePath));
    } catch (err) {
      // Idempotent — ignore "not found"
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  },
};
