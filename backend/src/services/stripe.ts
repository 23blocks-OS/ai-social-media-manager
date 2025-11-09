import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY not set. Stripe functionality will be disabled.');
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null;

export class StripeService {
  /**
   * Create a Stripe customer for a user
   */
  static async createCustomer(userId: string, email: string, name?: string): Promise<string> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      logger.info(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer.id;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a user
   */
  static async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId?: string,
    trialDays?: number
  ): Promise<any> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan || !plan.stripePriceId) {
        throw new Error('Plan not found or Stripe price not configured');
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        customerId = await this.createCustomer(userId, user.email, user.name || undefined);
      }

      // Attach payment method if provided
      if (paymentMethodId) {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        metadata: {
          userId,
          planId,
        },
      };

      if (trialDays && trialDays > 0) {
        subscriptionParams.trial_period_days = trialDays;
      }

      const stripeSubscription = await stripe.subscriptions.create(subscriptionParams);

      // Create subscription record in database
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          planId,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: plan.stripePriceId,
          stripeProductId: plan.stripeProductId || undefined,
          status: this.mapStripeStatus(stripeSubscription.status),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          trialStart: stripeSubscription.trial_start
            ? new Date(stripeSubscription.trial_start * 1000)
            : undefined,
          trialEnd: stripeSubscription.trial_end
            ? new Date(stripeSubscription.trial_end * 1000)
            : undefined,
        },
        include: {
          plan: true,
        },
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: subscription.status,
        },
      });

      logger.info(`Created subscription ${subscription.id} for user ${userId}`);
      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<any> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('Subscription not found');
      }

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        const stripeSubscription = await stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            cancel_at_period_end: true,
          }
        );

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            cancelAtPeriodEnd: true,
          },
        });

        logger.info(`Subscription ${subscriptionId} will cancel at period end`);
        return stripeSubscription;
      } else {
        // Cancel immediately
        const stripeSubscription = await stripe.subscriptions.cancel(
          subscription.stripeSubscriptionId
        );

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            subscriptionStatus: 'CANCELED',
          },
        });

        logger.info(`Subscription ${subscriptionId} canceled immediately`);
        return stripeSubscription;
      }
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Update subscription to a different plan
   */
  static async updateSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string
  ): Promise<any> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true },
      });

      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('Subscription not found');
      }

      const newPlan = await prisma.subscriptionPlan.findUnique({
        where: { id: newPlanId },
      });

      if (!newPlan || !newPlan.stripePriceId) {
        throw new Error('New plan not found or Stripe price not configured');
      }

      // Get the subscription from Stripe
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      // Update the subscription
      const updatedStripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newPlan.stripePriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        }
      );

      // Update database
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlanId,
          stripePriceId: newPlan.stripePriceId,
          stripeProductId: newPlan.stripeProductId || undefined,
        },
      });

      logger.info(`Updated subscription ${subscriptionId} to plan ${newPlanId}`);
      return updatedStripeSubscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session for subscription
   */
  static async createCheckoutSession(
    userId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
    trialDays?: number
  ): Promise<Stripe.Checkout.Session> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
      });

      if (!plan || !plan.stripePriceId) {
        throw new Error('Plan not found or Stripe price not configured');
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        customerId = await this.createCustomer(userId, user.email, user.name || undefined);
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId,
        },
      };

      if (trialDays && trialDays > 0) {
        sessionParams.subscription_data = {
          trial_period_days: trialDays,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      logger.info(`Created checkout session ${session.id} for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  static async createBillingPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    if (!stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.stripeCustomerId) {
        throw new Error('User or Stripe customer not found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      logger.info(`Created billing portal session for user ${userId}`);
      return session;
    } catch (error) {
      logger.error('Error creating billing portal session:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Handling Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error(`Error handling webhook ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle subscription update webhook
   */
  private static async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      logger.warn(`Subscription not found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    const status = this.mapStripeStatus(stripeSubscription.status);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { subscriptionStatus: status },
    });

    logger.info(`Updated subscription ${subscription.id} to status ${status}`);
  }

  /**
   * Handle subscription deleted webhook
   */
  private static async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription
  ): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) {
      logger.warn(`Subscription not found for Stripe ID: ${stripeSubscription.id}`);
      return;
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { subscriptionStatus: 'CANCELED' },
    });

    logger.info(`Canceled subscription ${subscription.id}`);
  }

  /**
   * Handle invoice paid webhook
   */
  private static async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      logger.warn(`Subscription not found for invoice: ${invoice.id}`);
      return;
    }

    // Record payment
    await prisma.paymentHistory.create({
      data: {
        subscriptionId: subscription.id,
        stripePaymentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        paymentMethod: invoice.charge ? 'card' : undefined,
        receiptUrl: invoice.hosted_invoice_url || undefined,
        invoiceUrl: invoice.invoice_pdf || undefined,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      },
    });

    logger.info(`Recorded payment for subscription ${subscription.id}`);
  }

  /**
   * Handle invoice payment failed webhook
   */
  private static async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) {
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });

    if (!subscription) {
      logger.warn(`Subscription not found for invoice: ${invoice.id}`);
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { subscriptionStatus: 'PAST_DUE' },
    });

    // Record failed payment
    await prisma.paymentHistory.create({
      data: {
        subscriptionId: subscription.id,
        stripePaymentId: invoice.payment_intent as string,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        failedAt: new Date(),
      },
    });

    logger.info(`Subscription ${subscription.id} marked as PAST_DUE`);
  }

  /**
   * Map Stripe subscription status to our enum
   */
  private static mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status
  ): 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' {
    switch (stripeStatus) {
      case 'trialing':
        return 'TRIAL';
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      case 'incomplete':
      case 'incomplete_expired':
      case 'paused':
        return 'EXPIRED';
      default:
        return 'EXPIRED';
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(userId: string): Promise<any> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['TRIAL', 'ACTIVE', 'PAST_DUE'],
        },
      },
      include: {
        plan: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscription;
  }
}
