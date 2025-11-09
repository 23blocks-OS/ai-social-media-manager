import express from 'express';
import Stripe from 'stripe';
import { StripeService, stripe } from '../services/stripe';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * Stripe webhook endpoint
 * NOTE: This route must use raw body, not JSON parsed body
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'No signature provided' });
    }

    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.warn('STRIPE_WEBHOOK_SECRET not set, skipping signature verification');
        event = JSON.parse(req.body.toString());
      } else {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      }

      logger.info(`Received Stripe webhook: ${event.type}`);

      // Handle the event
      await StripeService.handleWebhook(event);

      res.json({ received: true });
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
  }
);

export default router;
