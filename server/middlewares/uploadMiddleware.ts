import multer from 'multer';
import path from 'path';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.epub', '.txt']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/epub+zip',
  'text/plain',
  'application/octet-stream', // Some clients send octet-stream for epub/pdf
]);

// Maximum file size: 50MB for development environment
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const storage = multer.memoryStorage();

export const uploadBookFile = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error(
          `Invalid file format '${ext}'. Only PDF, EPUB, and TXT files are accepted for library documents.`
        )
      );
    }

    if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      // If extension matches standard types, allow lenient fallback
      if (!['.pdf', '.epub', '.txt'].includes(ext)) {
        return cb(new Error(`Unsupported MIME type '${file.mimetype}'.`));
      }
    }

    cb(null, true);
  },
});
