import { Router } from 'express';
import { bookController } from '../controllers/bookController.js';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware.js';
import { uploadBookFile } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Public discovery and verification
router.get('/', (req, res, next) => bookController.getAllPublished(req, res, next));
router.get('/authors', (req, res, next) => bookController.getAuthors(req, res, next));
router.post('/verify-hash', (req, res, next) => bookController.verifyPublicHash(req, res, next));
router.get('/verify-hash/:hash', (req, res, next) => bookController.verifyPublicHash(req, res, next));

// Author works management
router.get('/my-books', requireAuth, (req, res, next) =>
  bookController.getMyBooks(req, res, next)
);
router.post('/', requireAuth, (req, res, next) =>
  bookController.createBook(req, res, next)
);

// Individual book access and updates
router.get('/:id', optionalAuth, (req, res, next) =>
  bookController.getById(req, res, next)
);
router.put('/:id', requireAuth, (req, res, next) =>
  bookController.updateBook(req, res, next)
);
router.patch('/:id/status', requireAuth, (req, res, next) =>
  bookController.updatePublicationStatus(req, res, next)
);

// Co-author management
router.post('/:id/authors', requireAuth, (req, res, next) =>
  bookController.addCoAuthor(req, res, next)
);
router.delete('/:id/authors/:authorProfileId', requireAuth, (req, res, next) =>
  bookController.removeCoAuthor(req, res, next)
);

// Book files and versioning
router.post('/:id/files', requireAuth, uploadBookFile.single('file'), (req, res, next) =>
  bookController.uploadFileVersion(req, res, next)
);
router.get('/:id/files', optionalAuth, (req, res, next) =>
  bookController.getFileVersions(req, res, next)
);

// File reading and downloading (with AccessLevel & ownership enforcement)
router.get('/:id/files/:fileId/read', optionalAuth, (req, res, next) =>
  bookController.readFileStream(req, res, next)
);
router.get('/:id/files/:fileId/download', optionalAuth, (req, res, next) =>
  bookController.downloadFileStream(req, res, next)
);

// SHA-256 integrity verification
router.get('/:id/files/:fileId/verify', optionalAuth, (req, res, next) =>
  bookController.verifyFileIntegrity(req, res, next)
);

export const bookRoutes = router;
