/**
 * Image processing helpers (sharp).
 * Resize input photos to a sane max dimension before passing to Gemini + storage.
 */
import sharp from 'sharp';
import { logger } from '../lib/logger.js';

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  byteLength: number;
}

/**
 * Resize to max 1024px on the longest side, re-encode as JPEG quality 82,
 * strip EXIF (auto-rotates first so the user's orientation is preserved).
 * Returns a buffer ready to send to Gemini and to write to storage.
 */
export async function processMealPhoto(input: Buffer): Promise<ProcessedImage> {
  const sharpInstance = sharp(input, { failOn: 'none' })
    .rotate() // applies EXIF orientation then strips it
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true });

  const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });
  logger.debug(
    { inBytes: input.byteLength, outBytes: data.byteLength, w: info.width, h: info.height },
    'processed meal photo',
  );

  return {
    buffer: data,
    mimeType: 'image/jpeg',
    width: info.width,
    height: info.height,
    byteLength: data.byteLength,
  };
}
