# AI Social Media Manager - Project Context for AI Agents

## 📋 Project Overview

This is a **complete, production-ready AI-powered social media management platform** that can be deployed in two ways:

1. **Self-Hosted** - Users deploy on their own infrastructure for personal/business use
2. **SaaS Platform** - Launch as a subscription-based business with Stripe billing

**Current Status**: ✅ **Feature Complete & Production Ready**

All major features are implemented:
- ✅ Full-stack TypeScript application (Next.js + Express)
- ✅ AI content generation (OpenAI GPT-4, Anthropic Claude)
- ✅ Multi-platform social media integration (Twitter, Facebook, Instagram, LinkedIn)
- ✅ Brand identity management system
- ✅ Post scheduling and calendar
- ✅ Analytics dashboard with charts
- ✅ **AI-Powered Email Campaigns** (NEW!)
  - Contact management with multiple import sources
  - Local LLM (Ollama) for cost-effective personalization
  - Social media contact import
  - CSV import/export
  - Campaign analytics and tracking
- ✅ Complete subscription/billing system with Stripe
- ✅ User authentication and authorization
- ✅ Email notification service
- ✅ Usage tracking and feature gating
- ✅ Admin dashboard for SaaS operators
- ✅ Onboarding flow with API key guides
- ✅ Infrastructure as Code (Terraform for AWS)
- ✅ CI/CD pipeline (GitHub Actions for dev/staging/prod)
- ✅ Interactive installer script
- ✅ Comprehensive documentation
- ✅ Two marketing websites (open-source & SaaS)

## 🚀 Quick Setup

### Interactive Installer (Easiest Method)

```bash
# Run the interactive installer
./install.sh

# It will:
# ✅ Check prerequisites (Node.js, PostgreSQL, etc.)
# ✅ Prompt for all configuration (DB, AI keys, Stripe, etc.)
# ✅ Create .env files
# ✅ Install dependencies
# ✅ Run database migrations
# ✅ Seed initial data
# ✅ Optionally set up GitHub secrets for CI/CD
# ✅ Create start-dev.sh script

# Then start development:
./start-dev.sh
```

### CI/CD Pipeline

The project includes complete CI/CD workflows for multiple environments:

- **Development** (`develop` branch) → Deploys to dev.yourdomain.com
- **Staging** (`staging` branch) → Deploys to staging.yourdomain.com
- **Production** (`main` branch) → Deploys to yourdomain.com

See `.claude/cicd-deployment.md` for complete CI/CD documentation.

## 🏗️ Architecture

### Tech Stack

**Backend** (Port 3001):
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis for caching
- JWT + OAuth authentication
- Stripe for payments
- Nodemailer for emails

**Frontend** (Port 3000):
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + Shadcn/ui
- React Query + Zustand
- Recharts for analytics

**Infrastructure**:
- AWS (ECS Fargate, RDS, ElastiCache, S3, CloudFront)
- Terraform for IaC
- Docker containers
- GitHub Actions CI/CD

### Directory Structure

```
ai-social-media-manager/
├── backend/                      # Node.js API server
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── posts.ts         # Post management
│   │   │   ├── socialAccounts.ts # Social platform connections
│   │   │   ├── brandProfiles.ts  # Brand identity
│   │   │   ├── subscriptions.ts  # Stripe billing
│   │   │   └── webhooks.ts      # Stripe webhooks
│   │   ├── services/            # Business logic
│   │   │   ├── ai/              # AI integration (GPT-4, Claude)
│   │   │   ├── social/          # Social media APIs
│   │   │   ├── stripe.ts        # Payment processing
│   │   │   ├── email.ts         # Email notifications
│   │   │   └── usage.ts         # Usage tracking
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── featureGate.ts   # Plan limits
│   │   │   └── validate.ts      # Input validation
│   │   └── prisma/              # Database
│   │       ├── schema.prisma    # Database schema
│   │       └── seed.ts          # Initial data
│   └── package.json
│
├── frontend/                     # Next.js application
│   ├── app/                     # App router pages
│   │   ├── dashboard/           # Main dashboard
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── compose/         # Post composer
│   │   │   ├── calendar/        # Content calendar
│   │   │   ├── analytics/       # Analytics dashboard
│   │   │   ├── brand-center/    # Brand management
│   │   │   ├── billing/         # Subscription management
│   │   │   ├── accounts/        # Social account connections
│   │   │   └── admin/           # Admin dashboard
│   │   ├── onboarding/          # New user onboarding
│   │   ├── pricing/             # Pricing page
│   │   ├── login/               # Login page
│   │   └── register/            # Registration
│   ├── components/              # React components
│   │   ├── ui/                  # UI components (Button, Card, etc.)
│   │   └── layout/              # Layout components (Sidebar, etc.)
│   └── lib/                     # Utilities
│       ├── api.ts               # API client
│       └── store.ts             # State management
│
├── infrastructure/              # Terraform IaC
│   └── terraform/               # AWS deployment
│       ├── main.tf              # Main infrastructure
│       ├── ecs.tf               # Container service
│       ├── rds.tf               # Database
│       └── s3.tf                # Storage
│
├── docs/                        # Documentation
│   ├── README.md                # Doc index
│   ├── installation.md          # Setup guide
│   ├── saas-deployment.md       # SaaS deployment
│   └── api-keys/                # API setup guides
│
├── website-opensource/          # Open source landing page
│   ├── index.html
│   └── styles.css
│
└── website-saas/                # SaaS landing page
    ├── index.html
    └── styles.css
```

## 🔑 Key Database Models

### User
- Authentication (JWT + OAuth)
- Subscription status
- Stripe customer ID
- Onboarding completion

### SubscriptionPlan
- FREE, PRO, BUSINESS tiers
- Feature limits (posts, accounts, etc.)
- Stripe price IDs

### Subscription
- User subscriptions
- Stripe subscription ID
- Status (TRIAL, ACTIVE, PAST_DUE, CANCELED)
- Current period dates

### BrandProfile
- Brand identity definition
- Voice, tone, values
- Visual identity (colors, logo)
- Content guidelines
- AI uses this to generate on-brand content

### Post
- Multi-platform posts
- Scheduled/published status
- AI generation metadata
- Analytics tracking

### UsageMetrics
- Monthly usage tracking
- Posts created/scheduled/published
- AI generations
- Social accounts used

## 🚀 Quick Start Commands

### Development Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Edit with your keys
npm run prisma:generate
npm run migrate
npm run seed
npm run dev  # Starts on port 3001

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev  # Starts on port 3000
```

### Common Tasks

```bash
# Database migration
cd backend
npm run migrate

# Reset database (WARNING: deletes all data)
npm run prisma:reset

# View database in GUI
npm run prisma:studio

# Build for production
npm run build

# Run tests
npm test
```

## 🔧 Environment Variables

### Critical Backend Variables

```env
# Database (Required)
DATABASE_URL=postgresql://user:pass@localhost:5432/db_name

# JWT (Required)
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AI Services (Required for AI features)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (Required for SaaS)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Email (Required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# Social Media (Optional - users provide their own)
TWITTER_API_KEY=...
FACEBOOK_APP_ID=...
# etc.
```

### Frontend Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📊 SaaS Subscription Model

### Plans

| Tier | Price | Accounts | Posts | Features |
|------|-------|----------|-------|----------|
| FREE | $0 | 1 | 10/month | Basic AI |
| PRO | $29/month | 5 | Unlimited | Advanced AI, Analytics, Auto-replies |
| BUSINESS | $99/month | Unlimited | Unlimited | All + Team, API, Priority support |

### Revenue Model
- 14-day free trial for paid plans
- Monthly recurring subscriptions
- Stripe handles billing
- Automatic renewals
- Usage tracking enforces limits

## 🎯 Key Features Explained

### 1. AI Content Generation
- Users describe what they want
- AI generates post content using GPT-4 or Claude
- Follows brand voice from BrandProfile
- Suggests hashtags, improvements
- Auto-generates replies

### 2. Brand Center
- Users define brand identity once
- AI learns voice, tone, values, guidelines
- All generated content matches brand
- Multiple brand profiles supported
- Active profile used for AI generation

### 3. Multi-Platform Publishing
- Connect via OAuth (Twitter, Facebook, LinkedIn)
- Schedule posts across all platforms
- Single interface for all accounts
- Platform-specific optimizations

### 4. Subscription System
- Stripe integration for payments
- Usage tracking per plan tier
- Feature gating middleware
- Admin dashboard for monitoring
- Automated email notifications

### 5. Onboarding Flow
- Step-by-step setup wizard
- Brand profile creation
- API key guides for each platform
- Account connection wizard
- Test post creation

## 🔒 Security Features

- JWT with refresh tokens
- OAuth 2.0 for social platforms
- Encrypted token storage
- Rate limiting on all endpoints
- CORS protection
- Helmet.js security headers
- Input validation with express-validator
- SQL injection protection (Prisma ORM)
- XSS prevention

## 📈 Scaling Considerations

### Current Setup (Good for 0-1000 users)
- ECS with 2 tasks
- db.t3.medium RDS
- ElastiCache for sessions

### Scale to 10K users
- Auto-scaling ECS (2-10 tasks)
- db.m5.large RDS
- Read replicas for analytics
- CDN caching (CloudFront)

### Scale to 100K+ users
- Multi-AZ deployment
- Database sharding
- Separate analytics database
- Message queue (SQS) for async tasks
- Redis cluster

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to database"
**Solution**:
1. Check DATABASE_URL in .env
2. Ensure PostgreSQL is running
3. Run migrations: `npm run migrate`

### Issue: "Stripe webhook fails"
**Solution**:
1. Verify STRIPE_WEBHOOK_SECRET
2. Check webhook endpoint is publicly accessible
3. Review Stripe dashboard for error details

### Issue: "AI generation not working"
**Solution**:
1. Verify OPENAI_API_KEY or ANTHROPIC_API_KEY
2. Check API quota/billing
3. Review logs for rate limit errors

### Issue: "Social media posts fail"
**Solution**:
1. Check OAuth tokens haven't expired
2. Verify platform API credentials
3. Review rate limits on platform

## 🚧 Known Limitations

1. **Social Platforms**: Currently supports Twitter, Facebook, Instagram, LinkedIn (TikTok not implemented)
2. **Media Upload**: Basic implementation, no video processing
3. **Team Collaboration**: Framework exists but needs expansion
4. **Analytics**: Real-time sync not implemented (batch updates)
5. **Mobile App**: Web-only, no native apps

## 🎯 Common Development Tasks

### Add New API Endpoint

1. Create route in `backend/src/routes/`
2. Add to `backend/src/routes/index.ts`
3. Create service in `backend/src/services/` if needed
4. Add API client function in `frontend/lib/api.ts`
5. Create React Query hook in component
6. Add route protection if needed

### Add New Page

1. Create page in `frontend/app/[path]/page.tsx`
2. Add to sidebar navigation if needed
3. Implement with React Query for data fetching
4. Use existing UI components from `components/ui/`

### Add New Database Model

1. Update `backend/prisma/schema.prisma`
2. Run `npm run prisma:generate`
3. Create migration: `npx prisma migrate dev --name add_model_name`
4. Update seed file if needed
5. Create corresponding API routes

### Add Feature Gate

1. Add feature flag to SubscriptionPlan model
2. Update seed.ts with new feature
3. Add middleware check in `featureGate.ts`
4. Apply middleware to route
5. Update frontend to show upgrade prompt

## 📝 Best Practices When Working on This Project

1. **Always read files before editing** - Understand context first
2. **Use TypeScript strictly** - No `any` types without reason
3. **Follow existing patterns** - Maintain consistency
4. **Test subscription limits** - Ensure feature gates work
5. **Update documentation** - Keep docs in sync with code
6. **Check mobile responsiveness** - Test on different screen sizes
7. **Handle errors gracefully** - Always show user-friendly messages
8. **Log important events** - Use Winston logger in backend
9. **Validate all inputs** - Use express-validator
10. **Keep API responses consistent** - Follow existing format

## 🔄 Workflow for New Features

1. **Plan**: Understand requirements, check existing patterns
2. **Database**: Update schema if needed
3. **Backend**: Create routes and services
4. **Frontend**: Build UI and connect to API
5. **Test**: Manually test all flows
6. **Document**: Update relevant docs
7. **Commit**: Clear, descriptive commit message

## 🎨 Design System

### Colors
- Primary: Purple (#8B5CF6)
- Secondary: Pink (#EC4899)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)

### Components
All in `frontend/components/ui/`:
- Button, Card, Input, Textarea
- Badge, Label, Select, Tabs
- Dialog, Progress
- Follow Shadcn/ui patterns

## 🆘 When You Need Help

1. **Documentation**: Check `docs/` folder
2. **Code Examples**: Look at existing similar features
3. **Error Logs**: Check console and server logs
4. **Database**: Use Prisma Studio to inspect data
5. **API Testing**: Use Postman or curl
6. **Stripe**: Check Stripe dashboard for webhook logs

## 🎯 Next Steps / Future Enhancements

### High Priority
- [ ] Add more social platforms (TikTok, Pinterest)
- [ ] Implement video upload and processing
- [ ] Add team collaboration features
- [ ] Build mobile apps (React Native)
- [ ] Implement real-time analytics sync
- [ ] Add A/B testing for posts

### Medium Priority
- [ ] Browser extension for quick posting
- [ ] WordPress plugin
- [ ] RSS feed integration
- [ ] Content calendar improvements
- [ ] Advanced analytics with ML insights
- [ ] Competitor analysis tools

### Low Priority
- [ ] White-label options for agencies
- [ ] API access for integrations
- [ ] Zapier integration
- [ ] Slack/Discord notifications
- [ ] Custom reporting dashboards

## 🔗 Important Links

- [Installation Guide](docs/installation.md)
- [SaaS Deployment](docs/saas-deployment.md)
- [Twitter API Setup](docs/api-keys/twitter.md)
- [Open Source Website](website-opensource/index.html)
- [SaaS Website](website-saas/index.html)

## 💡 Pro Tips for AI Agents

1. **Context is Key**: Always read related files before making changes
2. **Consistency Matters**: Follow existing code patterns exactly
3. **Test Thoroughly**: Check both frontend and backend after changes
4. **Documentation First**: If unclear, check docs before asking
5. **Incremental Changes**: Make small, testable changes
6. **Error Handling**: Always add proper error handling
7. **User Experience**: Think about how users will interact
8. **Performance**: Consider impact on database and API calls
9. **Security**: Never expose secrets, validate all inputs
10. **Git Hygiene**: Clear commits, one feature per commit

---

**Last Updated**: 2025-11-09
**Project Status**: Production Ready ✅
**Maintained By**: AI Agents & Open Source Community
