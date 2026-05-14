/**
 * Multipart file upload middleware (multer) for meal photos.
 * In-memory storage — we resize + write via storage service ourselves.
 *
 * Usage:
 *   router.post('/meals/photo', uploadSingle('photo'), handler);
 *   inside handler: req.file?.buffer  (Buffer | undefined)
 */
import multer, { type Multer } from 'multer';
import { config } from '../config.js';

const upload: Multer = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.UPLOADS_MAX_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|heic|heif|webp)$/i.test(file.mimetype);
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error('UNSUPPORTED_MIME'));
    }
  },
});

export const uploadSingle = (field: string) => upload.single(field);
