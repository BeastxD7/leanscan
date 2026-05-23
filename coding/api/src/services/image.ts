/**
 * Image processing helpers (sharp).
 * Resize input photos to a sane max dimension before passing to the AI
 * provider and writing to storage.
 *
 * HEIC note: iOS 11+ defaults to HEIC for camera photos. Our production
 * Dockerfile uses node:22-bookworm-slim so Sharp's prebuilt libvips
 * includes HEIC decoding. If you ever switch back to Alpine, you'll need
 * to either install libheif at the system level OR force-convert HEIC
 * client-side before upload.
 */
import sharp from 'sharp';
import { logger } from '../lib/logger.js';
import { HttpError } from '../middleware/errorHandler.js';

export interface ProcessedImage {
  buffer: Buffer;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
  byteLength: number;
}

// Sharp throws a generic Error for unsupported formats. We pattern-match
// the message to give the user something actionable instead of a 500.
function isDecodeError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : '';
  return (
    msg.includes('heif') ||
    msg.includes('unsupported image format') ||
    msg.includes('input file is missing') ||
    msg.includes('input buffer contains unsupported image format') ||
    msg.includes('bad seek') // libheif on a HEIC the prebuilt can't open
  );
}

/**
 * Resize to max 1024px on the longest side, re-encode as JPEG quality 82,
 * strip EXIF (auto-rotates first so the user's orientation is preserved).
 * Returns a buffer ready to send to the AI provider and to write to storage.
 *
 * Throws HttpError(415) on unsupported formats so the client can show a
 * specific "use a JPEG/PNG instead" message rather than a generic crash.
 */
export async function processMealPhoto(input: Buffer): Promise<ProcessedImage> {
  try {
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
  } catch (err) {
    if (isDecodeError(err)) {
      logger.warn(
        { err, bytes: input.byteLength },
        'photo decode failed — likely unsupported format (HEIC/HEIF or corrupted)',
      );
      throw new HttpError(
        415,
        'unsupported_image_format',
        "Couldn't read this photo. Try a JPEG or PNG, or take the photo again.",
      );
    }
    logger.error({ err, bytes: input.byteLength }, 'photo processing failed');
    throw err;
  }
}
