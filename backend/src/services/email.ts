import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  static initialize() {
    if (!process.env.SMTP_HOST) {
      logger.warn('SMTP configuration not found. Email functionality will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    logger.info('Email service initialized');
  }

  /**
   * Send an email
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email not sent - transporter not initialized');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@aisocialmanager.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to AI Social Media Manager!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome aboard! We're excited to have you join AI Social Media Manager.</p>
            <p>Your account has been created successfully. You're now ready to:</p>
            <ul>
              <li>Connect your social media accounts</li>
              <li>Create AI-powered content</li>
              <li>Schedule posts across all platforms</li>
              <li>Analyze your performance</li>
              <li>Automate your social media presence</li>
            </ul>
            <p>Your free trial includes all premium features for 14 days. No credit card required!</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy posting!</p>
            <p>The AI Social Media Manager Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AI Social Media Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to AI Social Media Manager!',
      html,
      text: `Welcome to AI Social Media Manager, ${name}! Your account has been created successfully.`,
    });
  }

  /**
   * Send subscription confirmation email
   */
  static async sendSubscriptionConfirmation(
    email: string,
    name: string,
    planName: string,
    amount: number
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .plan-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for subscribing to AI Social Media Manager!</p>
            <div class="plan-details">
              <h2>Your Subscription Details</h2>
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}/month</p>
            </div>
            <p>You now have access to all premium features. Your subscription will renew automatically each month.</p>
            <p>You can manage your subscription or update your payment method anytime from your account settings.</p>
            <p>Thank you for choosing AI Social Media Manager!</p>
            <p>The AI Social Media Manager Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AI Social Media Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Subscription Confirmed - ${planName}`,
      html,
      text: `Your subscription to ${planName} has been confirmed. Amount: $${(amount / 100).toFixed(2)}/month`,
    });
  }

  /**
   * Send payment failed email
   */
  static async sendPaymentFailedEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We were unable to process your recent payment for AI Social Media Manager.</p>
            <p>This could be due to:</p>
            <ul>
              <li>Insufficient funds</li>
              <li>Expired card</li>
              <li>Card issuer declined the transaction</li>
            </ul>
            <p>Please update your payment method to continue using all features.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/billing" class="button">Update Payment Method</a>
            <p>If you have any questions, please contact our support team.</p>
            <p>The AI Social Media Manager Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AI Social Media Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Payment Failed - Action Required',
      html,
      text: `Your recent payment failed. Please update your payment method to continue using AI Social Media Manager.`,
    });
  }

  /**
   * Send trial ending soon email
   */
  static async sendTrialEndingSoonEmail(
    email: string,
    name: string,
    daysRemaining: number
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Trial is Ending Soon</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your free trial of AI Social Media Manager will end in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}.</p>
            <p>We hope you've enjoyed using our platform to manage your social media presence!</p>
            <p>To continue accessing all premium features, choose a plan that works for you.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard/billing" class="button">Choose a Plan</a>
            <p>If you have any questions or need help choosing the right plan, we're here to help.</p>
            <p>The AI Social Media Manager Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AI Social Media Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: `Your trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`,
      html,
      text: `Your free trial ends in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}. Choose a plan to continue.`,
    });
  }

  /**
   * Send subscription canceled email
   */
  static async sendSubscriptionCanceledEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Canceled</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We're sorry to see you go! Your subscription to AI Social Media Manager has been canceled.</p>
            <p>You'll continue to have access to premium features until the end of your current billing period.</p>
            <p>We'd love to hear your feedback on how we can improve. If you have a moment, please let us know why you canceled.</p>
            <p>You can reactivate your subscription anytime from your account settings.</p>
            <p>We hope to see you again soon!</p>
            <p>The AI Social Media Manager Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AI Social Media Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Subscription Canceled',
      html,
      text: `Your subscription has been canceled. You'll have access until the end of your billing period.`,
    });
  }
}

// Initialize email service
EmailService.initialize();
