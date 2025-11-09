# AI Social Media Manager

A self-hosted, AI-powered social media management platform for managing multiple social media accounts with intelligent automation.

## Features

- 🤖 **AI-Powered Content Generation**: Create engaging posts using OpenAI GPT-4 or Anthropic Claude
- 📱 **Multi-Platform Support**: Manage Twitter/X, Facebook, Instagram, LinkedIn, and TikTok
- 📊 **Unified Dashboard**: View all social feeds in one place
- 🔄 **Smart Automation**: Auto-reply, schedule posts, and engage with your audience
- 📈 **Analytics & Insights**: Track performance across all platforms
- 🔐 **Self-Hosted**: Full control over your data and infrastructure
- ☁️ **AWS Deployment**: Enterprise-grade infrastructure with Terraform

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

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Social Media Setup Guides](./docs/social-media-setup/README.md)
  - [Twitter/X Setup](./docs/social-media-setup/TWITTER.md)
  - [Facebook Setup](./docs/social-media-setup/FACEBOOK.md)
  - [Instagram Setup](./docs/social-media-setup/INSTAGRAM.md)
  - [LinkedIn Setup](./docs/social-media-setup/LINKEDIN.md)
  - [TikTok Setup](./docs/social-media-setup/TIKTOK.md)
- [AI Configuration](./docs/AI_CONFIGURATION.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

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
