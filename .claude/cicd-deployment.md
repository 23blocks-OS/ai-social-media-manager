# CI/CD & Deployment Guide for AI Agents

## 📋 Overview

This project includes a complete CI/CD pipeline with multi-environment deployment support. The pipeline automatically builds, tests, and deploys to AWS ECS when code is pushed to specific branches.

## 🏗️ Deployment Environments

### Development
- **Branch**: `develop` or `dev`
- **URL**: https://dev.yourdomain.com
- **API**: https://api-dev.yourdomain.com
- **Purpose**: Rapid iteration and testing
- **Auto-deploy**: ✅ On every push
- **Manual approval**: ❌ No
- **Tests required**: ✅ Basic tests + lint

### Staging
- **Branch**: `staging`
- **URL**: https://staging.yourdomain.com
- **API**: https://api-staging.yourdomain.com
- **Purpose**: QA testing and validation
- **Auto-deploy**: ✅ On push to staging
- **Manual approval**: ⚠️ Optional (via GitHub environment)
- **Tests required**: ✅ Full test suite + security scan

### Production
- **Branch**: `main`
- **URL**: https://yourdomain.com
- **API**: https://api.yourdomain.com
- **Purpose**: Live user-facing environment
- **Auto-deploy**: ✅ On push to main
- **Manual approval**: ✅ Required (via GitHub environment)
- **Tests required**: ✅ Full test suite + security scan + smoke tests
- **Rollback**: ✅ Automatic on failure

## 🚀 Quick Start

### 1. Interactive Installer

The easiest way to set up the project:

```bash
# Run the interactive installer
./install.sh

# Follow the prompts to configure:
# - Database connection
# - Redis
# - AI API keys
# - Stripe (for SaaS)
# - Email service
# - AWS credentials
# - Social media APIs

# Installer will:
# ✅ Check prerequisites
# ✅ Create .env files
# ✅ Install dependencies
# ✅ Run database migrations
# ✅ Seed initial data
# ✅ Optionally set up GitHub secrets
```

### 2. Set Up GitHub Secrets

For CI/CD to work, configure GitHub secrets:

```bash
# Easy way - interactive script
./scripts/setup-github-secrets.sh

# Manual way - using GitHub CLI
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh secret set DATABASE_URL
# ... etc
```

### 3. Push to Deploy

```bash
# Deploy to development
git push origin develop

# Deploy to staging
git push origin staging

# Deploy to production
git push origin main
```

## 📁 CI/CD Files

### GitHub Actions Workflows

```
.github/workflows/
├── deploy-development.yml    # Dev environment
├── deploy-staging.yml        # Staging environment
└── deploy-production.yml     # Production environment
```

### Helper Scripts

```
scripts/
└── setup-github-secrets.sh   # Configure GitHub secrets

install.sh                     # Interactive project setup
start-dev.sh                   # Start development servers
```

## 🔄 CI/CD Pipeline Flow

### Development Pipeline

```
Push to develop/dev
    ↓
Run Tests (Basic)
    ├─ Lint backend
    ├─ Lint frontend
    ├─ Run backend tests
    └─ Build both apps
    ↓
Build Docker Images
    ├─ Build backend image
    ├─ Push to ECR (dev-backend)
    ├─ Build frontend image
    └─ Push to ECR (dev-frontend)
    ↓
Deploy to ECS
    ├─ Update task definition
    ├─ Deploy to ECS cluster
    └─ Run migrations
    ↓
✅ Deployment Complete
```

### Staging Pipeline

```
Push to staging / PR to main
    ↓
Run Full Tests
    ├─ Lint backend & frontend
    ├─ Run all tests with coverage
    └─ Build both apps
    ↓
Security Scan
    └─ Run Trivy vulnerability scanner
    ↓
Build Docker Images
    ├─ Build backend image
    ├─ Push to ECR (staging-backend:sha + staging-latest)
    ├─ Build frontend image
    └─ Push to ECR (staging-frontend:sha + staging-latest)
    ↓
Deploy to ECS
    ├─ Update task definition
    ├─ Deploy to ECS cluster
    └─ Run migrations
    ↓
Smoke Tests
    ├─ Test API health
    └─ Test frontend
    ↓
✅ Deployment Complete
```

### Production Pipeline

```
Push to main / Create tag
    ↓
Validate Deployment
    └─ Check confirmations (if manual trigger)
    ↓
Run Full Tests
    ├─ Lint everything
    ├─ Run all tests with coverage
    └─ Build apps
    ↓
Security Scan
    └─ Run Trivy (fail on HIGH/CRITICAL)
    ↓
Build Docker Images
    ├─ Build with production flags
    ├─ Tag with version + latest
    ├─ Push to ECR (prod-backend)
    └─ Push to ECR (prod-frontend)
    ↓
Manual Approval
    └─ (If GitHub environment configured)
    ↓
Create Database Backup
    └─ RDS snapshot before deployment
    ↓
Deploy to ECS
    ├─ Update task definition
    ├─ Deploy to ECS cluster
    └─ Run migrations
    ↓
Smoke Tests
    ├─ Test API health (must return 200)
    ├─ Test frontend (must return 200)
    └─ Test auth endpoint (must return 401)
    ↓
Create GitHub Release
    └─ (If triggered by tag)
    ↓
✅ Deployment Complete

(If failure detected)
    ↓
Rollback to Previous Version
    └─ Revert to previous task definition
```

## 🔐 Required GitHub Secrets

### Essential (Required for all environments)

```bash
AWS_ACCESS_KEY_ID           # AWS credentials
AWS_SECRET_ACCESS_KEY       # AWS credentials
AWS_REGION                  # e.g., us-east-1
DATABASE_URL                # PostgreSQL connection string
JWT_SECRET                  # JWT signing secret
JWT_REFRESH_SECRET          # JWT refresh token secret
```

### AI Services (Required for AI features)

```bash
OPENAI_API_KEY              # OpenAI API key (sk-...)
ANTHROPIC_API_KEY           # Anthropic API key (sk-ant-...)
```

### SaaS Mode (Required for billing)

```bash
STRIPE_SECRET_KEY           # Stripe API key
STRIPE_WEBHOOK_SECRET       # Stripe webhook secret
STRIPE_PRO_PRICE_ID         # Pro plan price ID
STRIPE_BUSINESS_PRICE_ID    # Business plan price ID
```

### Email (Required for notifications)

```bash
SMTP_HOST                   # SMTP server
SMTP_PORT                   # SMTP port
SMTP_USER                   # SMTP username
SMTP_PASS                   # SMTP password
SMTP_FROM                   # From email address
```

### Optional

```bash
REDIS_HOST                  # Redis host
REDIS_PORT                  # Redis port
REDIS_PASSWORD              # Redis password
TWITTER_API_KEY             # Twitter API credentials
TWITTER_API_SECRET          # Twitter API secret
FACEBOOK_APP_ID             # Facebook app credentials
FACEBOOK_APP_SECRET         # Facebook app secret
LINKEDIN_CLIENT_ID          # LinkedIn credentials
LINKEDIN_CLIENT_SECRET      # LinkedIn credentials
ECR_REPOSITORY              # ECR repository name
FRONTEND_URL                # Frontend URL
```

## 🏗️ Infrastructure Setup

### Prerequisites

1. **AWS Account** with:
   - ECS cluster created
   - RDS PostgreSQL instance
   - ElastiCache Redis (optional)
   - ECR repositories created
   - S3 bucket for media
   - Application Load Balancer

2. **GitHub Repository** with:
   - Secrets configured
   - Environments set up (staging, production)
   - Branch protection rules (optional)

3. **Domain** with:
   - DNS configured
   - SSL certificates (ACM)

### ECR Repositories to Create

```bash
# Development
aws ecr create-repository --repository-name ai-social-manager-dev-backend
aws ecr create-repository --repository-name ai-social-manager-dev-frontend

# Staging
aws ecr create-repository --repository-name ai-social-manager-staging-backend
aws ecr create-repository --repository-name ai-social-manager-staging-frontend

# Production
aws ecr create-repository --repository-name ai-social-manager-prod-backend
aws ecr create-repository --repository-name ai-social-manager-prod-frontend
```

### ECS Task Definitions

Each environment needs a task definition with:
- Backend container
- Frontend container
- Environment variables from secrets
- Proper CPU/memory allocation
- CloudWatch logging

## 🔧 Customizing the Pipeline

### Change Deployment Branch

Edit the workflow file:

```yaml
# .github/workflows/deploy-development.yml
on:
  push:
    branches:
      - develop      # Change this
      - feature/*    # Add patterns
```

### Add Environment Variables

1. Add to GitHub Secrets
2. Reference in workflow:

```yaml
env:
  NEW_VARIABLE: ${{ secrets.NEW_VARIABLE }}
```

3. Pass to Docker build:

```yaml
docker build --build-arg NEW_VARIABLE=$NEW_VARIABLE .
```

### Modify Deployment Strategy

Edit the ECS service update:

```yaml
- name: Deploy to Amazon ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: ${{ steps.task-def.outputs.task-definition }}
    service: ${{ env.ECS_SERVICE }}
    cluster: ${{ env.ECS_CLUSTER }}
    wait-for-service-stability: true
    # Add deployment configuration:
    # desired-count: 2
    # minimum-healthy-percent: 50
    # maximum-percent: 200
```

## 🚨 Troubleshooting

### Pipeline Fails at Tests

```bash
# Run tests locally
cd backend && npm test
cd ../frontend && npm test

# Check linting
npm run lint

# Fix automatically
npm run lint:fix
```

### Docker Build Fails

```bash
# Test build locally
docker build -t test-backend backend/
docker build -t test-frontend frontend/

# Check Dockerfile syntax
docker buildx build --check backend/
```

### Deployment Fails

```bash
# Check ECS service logs
aws logs tail /ecs/ai-social-manager-backend --follow

# Check task status
aws ecs describe-services \
  --cluster ai-social-manager-cluster \
  --services ai-social-manager-service

# Check task definition
aws ecs describe-task-definition \
  --task-definition ai-social-manager-prod
```

### Migrations Fail

```bash
# Run migrations manually
aws ecs execute-command \
  --cluster ai-social-manager-cluster \
  --task TASK_ARN \
  --container backend \
  --interactive \
  --command "/bin/bash"

# Then inside container:
npm run migrate:prod
```

### Rollback Needed

```bash
# Automatic rollback happens on failure
# Manual rollback:
aws ecs update-service \
  --cluster ai-social-manager-cluster \
  --service ai-social-manager-service \
  --task-definition ai-social-manager-prod:PREVIOUS_REVISION \
  --force-new-deployment
```

## 📊 Monitoring Deployments

### GitHub Actions

- View workflow runs: Repository → Actions tab
- Check logs for each step
- See deployment history

### AWS Console

- ECS Services: Check task health
- CloudWatch: View logs and metrics
- RDS: Check database health
- Load Balancer: Check target health

### Commands

```bash
# View GitHub Actions status
gh run list

# Watch specific run
gh run watch

# View ECS service
aws ecs describe-services \
  --cluster CLUSTER_NAME \
  --services SERVICE_NAME

# View logs
aws logs tail /ecs/ai-social-manager-backend --follow
```

## 🎯 Best Practices

1. **Never push directly to main**
   - Use feature branches
   - Create PRs to staging first
   - Test in staging before production

2. **Tag production releases**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

3. **Monitor deployments**
   - Watch GitHub Actions
   - Check CloudWatch logs
   - Run smoke tests

4. **Keep secrets secure**
   - Never commit secrets
   - Rotate secrets regularly
   - Use GitHub environments for protection

5. **Test locally first**
   ```bash
   # Before pushing
   npm run lint
   npm test
   npm run build
   ```

6. **Database migrations**
   - Always test migrations in staging
   - Create backups before production
   - Have rollback plan ready

## 🔄 Deployment Workflow Examples

### Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... code ...

# Test locally
npm test
npm run lint

# Commit and push
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Create PR to develop
gh pr create --base develop
```

### Staging Release

```bash
# Merge approved PRs to staging
git checkout staging
git merge develop
git push origin staging

# Pipeline automatically:
# 1. Runs tests
# 2. Security scan
# 3. Builds images
# 4. Deploys to staging
# 5. Runs smoke tests

# Test in staging environment
curl https://staging.yourdomain.com
```

### Production Release

```bash
# Create release PR
gh pr create --base main --title "Release v1.0.0"

# After approval, merge to main
git checkout main
git merge staging
git tag v1.0.0
git push origin main --tags

# Pipeline automatically:
# 1. Runs full test suite
# 2. Security scan (strict)
# 3. Builds production images
# 4. Creates database backup
# 5. Deploys to production
# 6. Runs smoke tests
# 7. Creates GitHub release

# Monitor deployment
gh run watch

# If issues detected:
# - Pipeline auto-rolls back
# - Check logs in GitHub Actions
# - Check CloudWatch logs
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Terraform for Infrastructure](../infrastructure/terraform/README.md)

---

**Remember**: The CI/CD pipeline is your safety net. Trust it, monitor it, and keep it updated!
