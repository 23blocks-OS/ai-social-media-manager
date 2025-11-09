# AI Social Media Manager

> Complete, production-ready AI-powered social media management platform. Self-host or deploy as a SaaS business.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

## ✨ Features

- 🤖 **AI-Powered Content** - Generate engaging posts with GPT-4 and Claude
- 📱 **Multi-Platform** - Twitter, Facebook, Instagram, LinkedIn support
- 📅 **Smart Scheduling** - Schedule posts across all platforms
- 📊 **Analytics Dashboard** - Track performance with beautiful charts
- ✨ **Brand Center** - Define brand voice and let AI follow it
- 💳 **Stripe Billing** - Complete subscription system included (SaaS mode)
- 👥 **Team Collaboration** - Multi-user support
- 🔒 **Secure** - OAuth integration, encrypted storage
- 📧 **Email Notifications** - Automated emails for all events
- 🚀 **Production Ready** - Complete CI/CD, Terraform, Docker

## 🎯 Two Ways to Use

### 1. Self-Hosted
Deploy on your own infrastructure for complete control:
- Own your data
- No monthly fees
- Customize everything
- Perfect for personal or business use

[📖 Self-Hosted Deployment Guide](docs/self-hosted-deployment.md)

### 2. SaaS Platform
Launch your own social media management business:
- Stripe billing built-in
- Multi-tenant architecture
- Usage tracking & limits
- Admin dashboard
- Generate revenue in days

[🚀 SaaS Deployment Guide](docs/saas-deployment.md)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │Dashboard │ │Composer  │ │Analytics │ │Settings  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend API (Express + TypeScript)         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Auth       │ │ Social     │ │ AI         │              │
│  │ Service    │ │ Integrator │ │ Service    │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │  Redis Cache │    │  S3 Storage  │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        └─────────────────────┐
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  Twitter │ Facebook │ Instagram │ LinkedIn │ TikTok         │
│  OpenAI  │ Anthropic                                        │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- AWS Account (for deployment)
- API Keys for social media platforms
- OpenAI or Anthropic API key

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-social-media-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the development environment
docker-compose up -d

# Run database migrations
npm run migrate

# Start the backend
cd backend
npm run dev

# Start the frontend (in a new terminal)
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed AWS deployment instructions.

```bash
# Deploy to AWS using Terraform
cd infrastructure
terraform init
terraform plan
terraform apply
```

## 📚 Documentation

- [Installation Guide](docs/installation.md) - Complete setup instructions
- [API Keys Setup](docs/api-keys/README.md) - How to get API keys for each platform
  - [Twitter Setup](docs/api-keys/twitter.md)
  - [Facebook Setup](docs/api-keys/facebook.md)
  - [Instagram Setup](docs/api-keys/instagram.md)
  - [LinkedIn Setup](docs/api-keys/linkedin.md)
- [SaaS Deployment](docs/saas-deployment.md) - Deploy as a SaaS business
- [Self-Hosted Deployment](docs/self-hosted-deployment.md) - Self-host guide
- [Architecture Overview](docs/architecture.md) - System design
- [API Documentation](docs/api/README.md) - Complete API reference
- [Contributing Guide](docs/contributing.md) - How to contribute

## 🌐 Marketing Websites

Two ready-to-use marketing websites are included:

### Open Source Website
Targets developers who want to self-host or build their own SaaS:
- [website-opensource/index.html](website-opensource/index.html)
- Features, tech stack, documentation links
- GitHub integration, community focus

### SaaS Website
Targets end-users who want to use the platform as a service:
- [website-saas/index.html](website-saas/index.html)
- Pricing, testimonials, features
- Signup and trial focus

## 💰 Pricing (SaaS Model)

The platform includes three subscription tiers:

| Feature | Free | Pro ($29/mo) | Business ($99/mo) |
|---------|------|--------------|-------------------|
| Social Accounts | 1 | 5 | Unlimited |
| Posts/Month | 10 | Unlimited | Unlimited |
| Brand Profiles | 1 | 3 | Unlimited |
| AI Features | Basic | Advanced | Advanced |
| Analytics | ❌ | ✅ | ✅ |
| Auto-Replies | ❌ | ✅ | ✅ |
| Team Members | 1 | 1 | 10 |
| API Access | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui Components

### Backend
- Node.js 20
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis

### Infrastructure
- AWS (ECS, RDS, S3, CloudFront)
- Terraform
- Docker

### Integrations
- **Social Media APIs**: Twitter API v2, Facebook Graph API, Instagram Graph API, LinkedIn API, TikTok API
- **AI Services**: OpenAI GPT-4, Anthropic Claude
- **Authentication**: JWT + OAuth 2.0

## Features in Detail

### Content Management
- Create and schedule posts across multiple platforms
- AI-assisted content generation with customizable tone and style
- Media library with S3 storage
- Bulk scheduling and CSV import

### Automation
- Auto-reply to comments and messages with AI
- Sentiment analysis of interactions
- Smart hashtag suggestions
- Best time to post recommendations

### Analytics
- Engagement metrics (likes, comments, shares)
- Follower growth tracking
- Content performance analysis
- Competitor monitoring

### Account Management
- Connect unlimited social media accounts
- OAuth-based secure authentication
- API key management
- Rate limit monitoring

## Environment Variables

See `.env.example` for all required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_social_manager

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=your-secret-key

# Social Media APIs
TWITTER_API_KEY=
TWITTER_API_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# AI Services
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# AWS (for production)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Support

For issues and questions:
- GitHub Issues: [Create an issue](../../issues)
- Documentation: [Read the docs](./docs/)

## Roadmap

- [x] Core architecture and setup
- [ ] Twitter/X integration
- [ ] Facebook integration
- [ ] Instagram integration
- [ ] LinkedIn integration
- [ ] TikTok integration
- [ ] AI content generation
- [ ] Auto-reply functionality
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Browser extension
