# SaaS Deployment Guide

This guide will help you deploy the AI Social Media Manager as a production SaaS platform with Stripe billing, user management, and multi-tenant architecture.

## Overview

The platform includes everything you need to run a SaaS business:
- ✅ Multi-tenant architecture
- ✅ Stripe subscription billing
- ✅ Usage tracking and limits
- ✅ Email notifications
- ✅ Admin dashboard
- ✅ User onboarding flow

## Prerequisites

- AWS Account
- Domain name
- Stripe Account
- SendGrid/AWS SES for emails
- PostgreSQL database (RDS)
- Redis instance (ElastiCache)

## Architecture

```
┌─────────────────┐
│   CloudFront    │  ← CDN for frontend
└────────┬────────┘
         │
┌────────┴────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───┴──┐  ┌──┴───┐
│ ECS  │  │ ECS  │  ← Backend containers
└───┬──┘  └──┬───┘
    │        │
┌───┴────────┴───┐
│   RDS (PostgreSQL)  │
└──────────────────┘
         │
┌────────┴────────┐
│ ElastiCache (Redis) │
└─────────────────┘
```

## Step 1: Stripe Setup

### 1.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete account verification
3. Get your API keys from Dashboard → Developers → API Keys

### 1.2 Create Products and Prices

```bash
# Use Stripe CLI or Dashboard

# Pro Plan
stripe products create \
  --name="Pro Plan" \
  --description="For professionals managing multiple accounts"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=2900 \
  --currency=usd \
  --recurring[interval]=month

# Business Plan
stripe products create \
  --name="Business Plan" \
  --description="For teams and agencies"

stripe prices create \
  --product=prod_yyy \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=month
```

### 1.3 Configure Webhooks

1. Go to Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

4. Copy the webhook signing secret

### 1.4 Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...
```

## Step 2: Email Setup

### Option 1: SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com
```

### Option 2: AWS SES

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASS=your_ses_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

### Email Templates

The platform includes pre-built templates for:
- Welcome emails
- Subscription confirmations
- Payment failures
- Trial ending reminders
- Subscription cancellations

## Step 3: Database Setup

### 3.1 Create RDS Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier ai-social-manager-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username admin \
  --master-user-password your_secure_password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name your-subnet-group
```

### 3.2 Run Migrations

```bash
cd backend

# Set production DATABASE_URL
export DATABASE_URL="postgresql://admin:password@your-rds-endpoint:5432/ai_social_manager"

# Run migrations
npm run migrate:prod

# Seed subscription plans
npm run seed
```

## Step 4: Infrastructure Deployment (Terraform)

### 4.1 Configure Terraform Variables

Edit `infrastructure/terraform/terraform.tfvars`:

```hcl
aws_region = "us-east-1"
environment = "production"
app_name = "ai-social-manager"

# Database
db_instance_class = "db.t3.medium"
db_allocated_storage = 20

# ECS
ecs_task_cpu = "512"
ecs_task_memory = "1024"
ecs_desired_count = 2

# Domain
domain_name = "yourdomain.com"
```

### 4.2 Deploy Infrastructure

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

## Step 5: Application Deployment

### 5.1 Build Docker Images

```bash
# Backend
cd backend
docker build -t your-registry/ai-social-backend:latest .
docker push your-registry/ai-social-backend:latest

# Frontend
cd ../frontend
docker build -t your-registry/ai-social-frontend:latest .
docker push your-registry/ai-social-frontend:latest
```

### 5.2 Update ECS Services

```bash
# Update backend service
aws ecs update-service \
  --cluster ai-social-manager-cluster \
  --service backend-service \
  --force-new-deployment

# Update frontend service
aws ecs update-service \
  --cluster ai-social-manager-cluster \
  --service frontend-service \
  --force-new-deployment
```

## Step 6: Domain & SSL Setup

### 6.1 Configure DNS

Point your domain to CloudFront distribution:

```
yourdomain.com    CNAME  d123xxx.cloudfront.net
```

### 6.2 SSL Certificate

```bash
# Request certificate via ACM
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --subject-alternative-names "*.yourdomain.com"
```

## Step 7: Environment Variables for Production

### Backend (.env)

```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://admin:password@your-rds.us-east-1.rds.amazonaws.com:5432/ai_social_manager

# Redis
REDIS_HOST=your-elasticache.cache.amazonaws.com
REDIS_PORT=6379

# JWT
JWT_SECRET=your-production-secret-change-this
JWT_REFRESH_SECRET=your-production-refresh-secret-change-this

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-password-change-this
```

### Frontend (.env.production)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Step 8: Monitoring & Logging

### 8.1 CloudWatch Setup

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/ai-social-backend
aws logs create-log-group --log-group-name /ecs/ai-social-frontend
```

### 8.2 Set Up Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu-usage \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

## Step 9: Backup Strategy

### Database Backups

```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier ai-social-manager-prod \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

### Application Backups

- Code: GitHub repository
- User data: RDS automated backups
- Media files: S3 versioning enabled

## Step 10: Security Checklist

- [ ] Enable HTTPS only
- [ ] Set up WAF rules
- [ ] Enable VPC security groups
- [ ] Rotate API keys regularly
- [ ] Enable MFA for AWS account
- [ ] Set up rate limiting
- [ ] Enable database encryption
- [ ] Regular security audits
- [ ] GDPR compliance (if applicable)
- [ ] Terms of Service & Privacy Policy

## Step 11: Testing Production

### Test User Flow

1. Visit your domain
2. Sign up for an account (starts 14-day trial)
3. Complete onboarding
4. Connect a social account
5. Create and publish a test post
6. Subscribe to a paid plan
7. Test billing portal
8. Test subscription cancellation

### Test Webhooks

```bash
# Use Stripe CLI to test webhooks
stripe listen --forward-to https://yourdomain.com/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

## Step 12: Launch Checklist

- [ ] Domain configured and SSL active
- [ ] Database migrated and seeded
- [ ] All environment variables set
- [ ] Stripe products and prices created
- [ ] Webhooks configured and tested
- [ ] Email service configured
- [ ] Social media OAuth apps created
- [ ] Monitoring and logging active
- [ ] Backups configured
- [ ] Security measures in place
- [ ] Terms & Privacy pages published
- [ ] Support email configured
- [ ] Marketing website live
- [ ] Documentation published

## Scaling Considerations

### Auto-Scaling

```hcl
# ECS Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/cluster/service"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "scale_up" {
  name               = "scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 75.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
```

### Database Scaling

- Start with `db.t3.medium`
- Scale to `db.m5.large` at 1000+ users
- Consider read replicas for analytics
- Enable Performance Insights

### Caching Strategy

- Use Redis for session data
- Cache API responses
- Implement CDN caching for frontend
- Cache social media API responses

## Cost Estimation

### AWS Costs (Monthly)

- ECS (2 tasks): ~$50
- RDS (t3.medium): ~$35
- ElastiCache (t3.micro): ~$15
- Load Balancer: ~$20
- CloudFront: ~$10
- S3: ~$5
- **Total AWS**: ~$135/month

### Additional Costs

- Domain: ~$12/year
- Email (SendGrid): $15-50/month
- Stripe fees: 2.9% + 30¢ per transaction
- OpenAI API: ~$50-200/month
- Total estimated: ~$200-400/month

## Support & Maintenance

### Regular Tasks

- Monitor error logs daily
- Check payment failures weekly
- Review user feedback monthly
- Update dependencies monthly
- Security patches as needed
- Database optimization quarterly

### Getting Help

- [GitHub Discussions](https://github.com/yourusername/ai-social-media-manager/discussions)
- [Discord Community](#)
- Email: [devops@aisocialmanager.com](mailto:devops@aisocialmanager.com)

## Next Steps

- Set up [monitoring and alerting](./monitoring.md)
- Configure [CI/CD pipeline](./cicd.md)
- Review [security best practices](./security.md)
- Plan [growth and scaling strategy](./scaling.md)
