import { Router } from 'express';
import { campaignsController } from '../controllers/campaigns.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Campaign CRUD
router.get('/', campaignsController.getCampaigns.bind(campaignsController));
router.get('/:id', campaignsController.getCampaign.bind(campaignsController));
router.post('/', campaignsController.createCampaign.bind(campaignsController));
router.put('/:id', campaignsController.updateCampaign.bind(campaignsController));
router.delete('/:id', campaignsController.deleteCampaign.bind(campaignsController));

// Campaign operations
router.post('/:id/contacts', campaignsController.addContacts.bind(campaignsController));
router.post('/:id/generate', campaignsController.generateEmails.bind(campaignsController));
router.post('/:id/send', campaignsController.sendCampaign.bind(campaignsController));

// Analytics
router.get('/:id/analytics', campaignsController.getCampaignAnalytics.bind(campaignsController));

export default router;
