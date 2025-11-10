import { Router } from 'express';
import { whatsappController } from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Webhook endpoint (public, no auth)
router.post('/webhook', whatsappController.handleWebhook.bind(whatsappController));
router.get('/webhook', whatsappController.handleWebhook.bind(whatsappController));

// All other routes require authentication
router.use(authenticate);

// Configuration
router.get('/config', whatsappController.getConfig.bind(whatsappController));
router.post('/config', whatsappController.saveConfig.bind(whatsappController));

// Templates
router.get('/templates', whatsappController.getTemplates.bind(whatsappController));
router.post('/templates', whatsappController.createTemplate.bind(whatsappController));

// Campaigns
router.get('/campaigns', whatsappController.getCampaigns.bind(whatsappController));
router.post('/campaigns', whatsappController.createCampaign.bind(whatsappController));
router.post('/campaigns/:id/contacts', whatsappController.addContacts.bind(whatsappController));
router.post('/campaigns/:id/send', whatsappController.sendCampaign.bind(whatsappController));
router.get(
  '/campaigns/:id/analytics',
  whatsappController.getCampaignAnalytics.bind(whatsappController)
);

export default router;
