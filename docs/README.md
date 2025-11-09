# AI Social Media Manager - Documentation

Welcome to the AI Social Media Manager documentation! This platform is a complete, AI-powered social media management tool that can be self-hosted or deployed as a SaaS platform.

## 📚 Table of Contents

- [Getting Started](./getting-started.md)
- [Installation & Setup](./installation.md)
- [API Key Setup Guides](./api-keys/README.md)
  - [Twitter/X Setup](./api-keys/twitter.md)
  - [Facebook Setup](./api-keys/facebook.md)
  - [Instagram Setup](./api-keys/instagram.md)
  - [LinkedIn Setup](./api-keys/linkedin.md)
- [SaaS Deployment](./saas-deployment.md)
- [Self-Hosted Deployment](./self-hosted-deployment.md)
- [Environment Variables](./environment-variables.md)
- [Architecture Overview](./architecture.md)
- [API Documentation](./api/README.md)
- [Contributing](./contributing.md)
- [FAQ](./faq.md)

## 🚀 Quick Start

### For SaaS Deployment

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ai-social-media-manager.git
cd ai-social-media-manager

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Set up database
cd ../backend
npm run prisma:generate
npm run migrate
npm run seed

# 5. Start development servers
npm run dev
```

### For Self-Hosted

Follow the [Self-Hosted Deployment Guide](./self-hosted-deployment.md) for detailed instructions.

## 🌟 Features

- **AI-Powered Content Creation**: Generate engaging posts using OpenAI GPT-4 and Anthropic Claude
- **Multi-Platform Support**: Twitter, Facebook, Instagram, LinkedIn
- **Brand Identity Management**: Define your brand voice and let AI follow your guidelines
- **Post Scheduling**: Schedule posts across all platforms
- **Analytics Dashboard**: Track performance metrics
- **Auto-Replies**: AI-powered automatic responses
- **Subscription Management**: Built-in billing with Stripe
- **Team Collaboration**: Support for multiple team members
- **Usage Tracking**: Monitor and enforce plan limits

## 💡 Use Cases

### As SaaS Platform
- Deploy and offer social media management as a service
- Charge monthly subscriptions
- Manage multiple customers
- Track revenue and analytics

### As Self-Hosted Tool
- Manage your own social media accounts
- Full control over your data
- No monthly fees
- Customize to your needs

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis for caching
- Stripe for payments
- OpenAI & Anthropic for AI

**Frontend:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- React Query
- Zustand

**Infrastructure:**
- AWS (ECS, RDS, S3, CloudFront)
- Terraform for IaC
- Docker containers
- GitHub Actions CI/CD

## 📖 Documentation Sections

### For Users
- [Getting Started Guide](./getting-started.md)
- [How to Get API Keys](./api-keys/README.md)
- [Using the Platform](./user-guide.md)

### For Developers
- [Architecture Overview](./architecture.md)
- [API Documentation](./api/README.md)
- [Contributing Guide](./contributing.md)
- [Development Setup](./development.md)

### For DevOps
- [SaaS Deployment](./saas-deployment.md)
- [Self-Hosted Deployment](./self-hosted-deployment.md)
- [Infrastructure Setup](./infrastructure.md)
- [Monitoring & Logging](./monitoring.md)

## 🤝 Support

- [GitHub Issues](https://github.com/yourusername/ai-social-media-manager/issues)
- [Discord Community](#)
- [Email Support](mailto:support@aisocialmanager.com)

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details
