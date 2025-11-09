# Installation Guide

This guide will walk you through installing and setting up the AI Social Media Manager platform.

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **Redis**: v6 or higher
- **npm or yarn**: Latest version
- **Git**: Latest version

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ai-social-media-manager.git
cd ai-social-media-manager
```

## Step 2: Backend Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ai_social_manager"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe (for SaaS)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@aisocialmanager.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Admin User (for seed)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# Social Media OAuth Credentials
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=

LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
```

### Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run migrate

# Seed database with initial data (subscription plans, admin user)
npm run seed
```

### Start Backend Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The backend will be available at `http://localhost:3001`

## Step 3: Frontend Setup

### Install Dependencies

```bash
cd ../frontend
npm install
```

### Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Start Frontend Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The frontend will be available at `http://localhost:3000`

## Step 4: Verify Installation

1. Open your browser to `http://localhost:3000`
2. You should see the landing page
3. Register a new account or login with admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`

## Step 5: Configure Social Media APIs

Follow our detailed guides to set up API keys for each platform:

- [Twitter/X Setup Guide](./api-keys/twitter.md)
- [Facebook Setup Guide](./api-keys/facebook.md)
- [Instagram Setup Guide](./api-keys/instagram.md)
- [LinkedIn Setup Guide](./api-keys/linkedin.md)

## Development Commands

### Backend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint

# Database commands
npm run migrate        # Run migrations
npm run migrate:prod   # Run migrations in production
npm run seed          # Seed database
npm run prisma:studio # Open Prisma Studio
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Ensure PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check your `DATABASE_URL` in `.env`

3. Create the database if it doesn't exist:
   ```bash
   createdb ai_social_manager
   ```

### Redis Connection Issues

1. Ensure Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Check Redis configuration in `.env`

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill

# Or change the port in package.json
```

### Migration Errors

If migrations fail:

```bash
# Reset database (WARNING: This will delete all data)
npm run prisma:reset

# Or manually fix migrations
npx prisma migrate resolve
```

## Next Steps

- [Configure API Keys](./api-keys/README.md)
- [Deploy to Production](./saas-deployment.md)
- [Read the Architecture Guide](./architecture.md)
- [Explore the API Documentation](./api/README.md)

## Getting Help

If you encounter issues:

1. Check the [FAQ](./faq.md)
2. Search [GitHub Issues](https://github.com/yourusername/ai-social-media-manager/issues)
3. Join our [Discord Community](#)
4. Email support at [support@aisocialmanager.com](mailto:support@aisocialmanager.com)
