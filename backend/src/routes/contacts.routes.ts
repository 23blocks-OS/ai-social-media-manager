import { Router } from 'express';
import { contactsController } from '../controllers/contacts.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Contact CRUD
router.get('/', contactsController.getContacts.bind(contactsController));
router.get('/:id', contactsController.getContact.bind(contactsController));
router.post('/', contactsController.createContact.bind(contactsController));
router.put('/:id', contactsController.updateContact.bind(contactsController));
router.delete('/:id', contactsController.deleteContact.bind(contactsController));

// Import/Export
router.post('/import/csv', contactsController.importFromCSV.bind(contactsController));
router.post('/import/social', contactsController.importFromSocialMedia.bind(contactsController));
router.get('/export/csv', contactsController.exportToCSV.bind(contactsController));

// Tags management
router.post('/:id/tags', contactsController.addTags.bind(contactsController));
router.delete('/:id/tags', contactsController.removeTags.bind(contactsController));

// Unsubscribe (public endpoint)
router.post('/unsubscribe/:token', contactsController.unsubscribe.bind(contactsController));

export default router;
