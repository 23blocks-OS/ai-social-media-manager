# Deployment Guide

Complete guide to deploying the AI Social Media Manager to AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally
- Terraform installed (1.0+)
- Node.js 20+ installed
- Git

## Deployment Options

1. **AWS ECS (Recommended)** - Fully managed container orchestration
2. **Docker Compose** - Simple local/VPS deployment
3. **Kubernetes** - For advanced use cases

This guide focuses on AWS ECS deployment.

## Step-by-Step Deployment

### 1. Prepare Your Environment

#### Clone the Repository

```bash
git clone https://github.com/your-username/ai-social-media-manager.git
cd ai-social-media-manager
```

#### Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

#### Create Production Environment File

```bash
cp .env.example .env.production
```

#### Edit `.env.production` with Your Values

```env
# Database
DATABASE_URL=postgresql://postgres:SECURE_PASSWORD@your-rds-endpoint:5432/ai_social_manager

# Redis
REDIS_URL=redis://your-elasticache-endpoint:6379

# JWT
JWT_SECRET=generate-a-secure-random-string-here
REFRESH_TOKEN_SECRET=generate-another-secure-random-string

# Social Media APIs (see setup guides)
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
# ... (add all social media credentials)

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# AWS
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name

# Encryption
ENCRYPTION_KEY=generate-a-32-character-random-string
```

**Important**: Never commit `.env.production` to version control!

### 3. Deploy Infrastructure with Terraform

#### Navigate to Infrastructure Directory

```bash
cd infrastructure
```

#### Create `terraform.tfvars`

```bash
cp terraform.tfvars.example terraform.tfvars
```

#### Edit `terraform.tfvars`

```hcl
aws_region    = "us-east-1"
environment   = "production"
project_name  = "ai-social-manager"

db_username   = "postgres"
db_password   = "SECURE_PASSWORD_HERE"  # Use a strong password!

# Adjust based on expected load
db_instance_class = "db.t3.small"
redis_node_type   = "cache.t3.micro"
desired_count     = 2  # Number of tasks
```

#### Initialize Terraform

```bash
terraform init
```

#### Plan Infrastructure

```bash
terraform plan
```

Review the plan carefully.

#### Apply Infrastructure

```bash
terraform apply
```

Type `yes` to confirm. This will create:
- VPC and networking
- RDS PostgreSQL database
- ElastiCache Redis
- S3 bucket for media
- ECR repositories
- ECS cluster
- Application Load Balancer
- Security groups
- CloudWatch log groups

**Time**: ~10-15 minutes

#### Save Outputs

```bash
terraform output > ../terraform-outputs.txt
```

### 4. Build and Push Docker Images

#### Login to ECR

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com
```

Get your account ID:
```bash
aws sts get-caller-identity --query Account --output text
```

#### Build and Push Backend

```bash
cd ../backend

# Build
docker build -t ai-social-manager/backend .

# Tag
docker tag ai-social-manager/backend:latest <ecr-backend-url>:latest

# Push
docker push <ecr-backend-url>:latest
```

Replace `<ecr-backend-url>` with the output from `terraform output ecr_backend_repository_url`

#### Build and Push Frontend

```bash
cd ../frontend

# Build
docker build -t ai-social-manager/frontend .

# Tag
docker tag ai-social-manager/frontend:latest <ecr-frontend-url>:latest

# Push
docker push <ecr-frontend-url>:latest
```

### 5. Run Database Migrations

#### Connect to Database

From your local machine with database connection:

```bash
cd ../backend

# Set DATABASE_URL to production database
export DATABASE_URL="postgresql://postgres:PASSWORD@your-rds-endpoint:5432/ai_social_manager"

# Run migrations
npx prisma migrate deploy
```

Alternatively, create a bastion host or use AWS Systems Manager Session Manager.

### 6. Create ECS Task Definitions

#### Backend Task Definition

Create `backend-task-def.json`:

```json
{
  "family": "ai-social-manager-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ecr-backend-url>:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-social-manager",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    }
  ]
}
```

#### Register Task Definition

```bash
aws ecs register-task-definition --cli-input-json file://backend-task-def.json
```

#### Frontend Task Definition

Similar process for frontend (port 3000).

### 7. Create ECS Services

#### Create ALB Target Groups

```bash
# Backend target group
aws elbv2 create-target-group \
  --name ai-social-manager-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id <vpc-id> \
  --target-type ip \
  --health-check-path /health

# Frontend target group
aws elbv2 create-target-group \
  --name ai-social-manager-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id <vpc-id> \
  --target-type ip
```

#### Create ALB Listeners

```bash
# HTTP listener (redirect to HTTPS in production)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<frontend-tg-arn>
```

#### Create Backend Service

```bash
aws ecs create-service \
  --cluster ai-social-manager-cluster \
  --service-name backend \
  --task-definition ai-social-manager-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-1,subnet-2],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=<backend-tg-arn>,containerName=backend,containerPort=3001
```

#### Create Frontend Service

Similar to backend, using frontend task definition and target group.

### 8. Configure Domain and HTTPS (Optional but Recommended)

#### Request SSL Certificate

```bash
aws acm request-certificate \
  --domain-name your-domain.com \
  --validation-method DNS
```

#### Validate Certificate

Add DNS records as shown in ACM console.

#### Update ALB Listener

```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<frontend-tg-arn>
```

### 9. Set Up CI/CD (GitHub Actions)

#### Add GitHub Secrets

Go to your repository settings → Secrets and variables → Actions:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DB_PASSWORD`

#### Push to Main Branch

The CI/CD pipeline will automatically:
1. Run tests
2. Build Docker images
3. Push to ECR
4. Deploy to ECS

### 10. Verify Deployment

#### Check ECS Services

```bash
aws ecs describe-services \
  --cluster ai-social-manager-cluster \
  --services backend frontend
```

#### Check Application Logs

```bash
aws logs tail /ecs/ai-social-manager --follow
```

#### Access Application

Get ALB DNS name:
```bash
terraform output alb_dns_name
```

Visit `http://<alb-dns-name>` in your browser.

## Post-Deployment

### 1. Set Up CloudWatch Alarms

Monitor:
- CPU utilization
- Memory utilization
- Request count
- Error rates
- Database connections

### 2. Configure Auto-Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ai-social-manager-cluster/backend \
  --min-capacity 1 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/ai-social-manager-cluster/backend \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### 3. Set Up Backups

- RDS automated backups (already configured)
- S3 versioning (already enabled)
- Database snapshots schedule

### 4. Security Hardening

- Enable WAF on ALB
- Set up CloudTrail logging
- Enable GuardDuty
- Configure VPC Flow Logs
- Rotate credentials regularly

## Alternative Deployment: Docker Compose

For simpler deployments on a single VPS:

```bash
# On your server
git clone <repo>
cd ai-social-media-manager

# Configure environment
cp .env.example .env
nano .env  # Edit with your values

# Start services
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

Visit `http://your-server-ip:3000`

## Troubleshooting

### Services Not Starting

```bash
# Check service events
aws ecs describe-services --cluster ai-social-manager-cluster --services backend

# Check task logs
aws logs tail /ecs/ai-social-manager --follow
```

### Database Connection Issues

- Check security groups
- Verify DATABASE_URL is correct
- Test connection from ECS task

### High Costs

- Scale down task count
- Use smaller instance types (t3.micro)
- Enable S3 lifecycle policies
- Review CloudWatch Logs retention

### SSL Certificate Issues

- Verify DNS records for ACM validation
- Check certificate status in ACM console
- Ensure ALB listener uses correct certificate

## Maintenance

### Updating the Application

```bash
# Update code
git pull

# Build and push new images
# ... (same as step 4)

# ECS will automatically deploy with rolling updates
```

### Database Backups

```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier ai-social-manager-postgres \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

### Monitoring Costs

```bash
# Get month-to-date costs
aws ce get-cost-and-usage \
  --time-period Start=2024-03-01,End=2024-03-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster ai-social-manager-cluster \
  --service backend \
  --task-definition ai-social-manager-backend:<previous-revision>
```

## Support

For issues:
- Check logs in CloudWatch
- Review AWS ECS documentation
- Open an issue on GitHub
- Review infrastructure in Terraform state

## Next Steps

1. Configure all social media API keys
2. Set up monitoring dashboards
3. Configure email notifications
4. Enable AI features
5. Customize branding
6. Invite team members
