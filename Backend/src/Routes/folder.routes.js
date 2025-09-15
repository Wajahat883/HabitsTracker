import { Router } from 'express';
import authMiddleware from '../Middleware/authMiddleware.js';
import { createFolder, listFolders, updateFolder, archiveFolder, restoreFolder, deleteFolder } from '../Controllers/folder.controller.js';

const router = Router();
router.use(authMiddleware);

router.post('/', createFolder);
router.get('/', listFolders);
router.patch('/:id', updateFolder);
router.patch('/:id/archive', archiveFolder);
router.patch('/:id/restore', restoreFolder);
router.delete('/:id', deleteFolder);

export default router;