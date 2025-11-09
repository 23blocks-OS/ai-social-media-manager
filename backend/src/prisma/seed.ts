import { PrismaClient, PlanTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create subscription plans
  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { tier: 'FREE' },
    update: {},
    create: {
      name: 'Free',
      tier: 'FREE',
      price: 0,
      interval: 'month',
      maxSocialAccounts: 1,
      maxPostsPerMonth: 10,
      maxBrandProfiles: 1,
      maxTeamMembers: 1,
      advancedAI: false,
      analytics: false,
      autoReplies: false,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      description: 'Perfect for getting started with social media management',
      features: {
        included: [
          '1 social media account',
          '10 posts per month',
          'Basic AI content generation',
          '1 brand profile',
          'Post scheduling',
        ],
      },
    },
  });

  const proPlan = await prisma.subscriptionPlan.upsert({
    where: { tier: 'PRO' },
    update: {},
    create: {
      name: 'Pro',
      tier: 'PRO',
      price: 2900, // $29.00
      interval: 'month',
      maxSocialAccounts: 5,
      maxPostsPerMonth: 999999, // Unlimited
      maxBrandProfiles: 3,
      maxTeamMembers: 1,
      advancedAI: true,
      analytics: true,
      autoReplies: true,
      customBranding: false,
      apiAccess: false,
      prioritySupport: false,
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID || undefined,
      description: 'For professionals managing multiple accounts',
      features: {
        included: [
          '5 social media accounts',
          'Unlimited posts',
          'Advanced AI features',
          '3 brand profiles',
          'Advanced analytics',
          'Auto-replies',
          'Priority scheduling',
          'Content calendar',
        ],
      },
    },
  });

  const businessPlan = await prisma.subscriptionPlan.upsert({
    where: { tier: 'BUSINESS' },
    update: {},
    create: {
      name: 'Business',
      tier: 'BUSINESS',
      price: 9900, // $99.00
      interval: 'month',
      maxSocialAccounts: 999999, // Unlimited
      maxPostsPerMonth: 999999, // Unlimited
      maxBrandProfiles: 999999, // Unlimited
      maxTeamMembers: 10,
      advancedAI: true,
      analytics: true,
      autoReplies: true,
      customBranding: true,
      apiAccess: true,
      prioritySupport: true,
      stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || undefined,
      description: 'For teams and agencies managing multiple brands',
      features: {
        included: [
          'Unlimited social media accounts',
          'Unlimited posts',
          'Advanced AI features',
          'Unlimited brand profiles',
          'Advanced analytics & reporting',
          'Auto-replies',
          'Custom branding',
          'API access',
          'Team collaboration (up to 10 members)',
          'Priority support',
          'White-label options',
          'Dedicated account manager',
        ],
      },
    },
  });

  console.log('✅ Created subscription plans:', {
    free: freePlan.id,
    pro: proPlan.id,
    business: businessPlan.id,
  });

  // Create a test admin user (optional)
  const bcrypt = require('bcryptjs');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      subscriptionStatus: 'ACTIVE',
      onboardingCompleted: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  console.log('🌱 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
