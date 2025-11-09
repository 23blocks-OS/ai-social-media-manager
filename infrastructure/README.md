# Infrastructure as Code - Terraform

This directory contains Terraform configurations for deploying the AI Social Media Manager to AWS.

## Architecture

The infrastructure includes:

- **VPC**: Custom VPC with public and private subnets across 2 availability zones
- **ECS Cluster**: Fargate cluster for running containers
- **RDS PostgreSQL**: Managed database for application data
- **ElastiCache Redis**: Managed Redis for caching and session storage
- **S3**: Object storage for media files
- **ECR**: Container registry for Docker images
- **Application Load Balancer**: Distributes traffic to ECS tasks
- **CloudWatch**: Logging and monitoring

## Prerequisites

1. AWS Account with appropriate permissions
2. Terraform 1.0+ installed
3. AWS CLI configured with credentials
4. Docker for building images

## Setup

### 1. Configure Backend (Optional but Recommended)

Create an S3 bucket for Terraform state:

```bash
aws s3 mb s3://your-terraform-state-bucket
```

Update `main.tf` backend configuration:

```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "ai-social-manager/terraform.tfstate"
  region = "us-east-1"
}
```

### 2. Create terraform.tfvars

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
aws_region    = "us-east-1"
environment   = "production"
project_name  = "ai-social-manager"

db_username   = "postgres"
db_password   = "your-secure-password-here"

# Optional: Adjust instance sizes based on your needs
db_instance_class = "db.t3.small"
redis_node_type   = "cache.t3.micro"
```

### 3. Initialize Terraform

```bash
cd infrastructure
terraform init
```

### 4. Plan Deployment

```bash
terraform plan
```

Review the plan to ensure it matches your expectations.

### 5. Apply Infrastructure

```bash
terraform apply
```

Type `yes` when prompted to confirm.

## Deployment Process

After infrastructure is created:

### 1. Build and Push Docker Images

```bash
# Get ECR login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd ../backend
docker build -t ai-social-manager/backend .
docker tag ai-social-manager/backend:latest <ecr-backend-url>:latest
docker push <ecr-backend-url>:latest

# Build and push frontend
cd ../frontend
docker build -t ai-social-manager/frontend .
docker tag ai-social-manager/frontend:latest <ecr-frontend-url>:latest
docker push <ecr-frontend-url>:latest
```

### 2. Create ECS Task Definitions

See `ecs-task-definitions/` directory for sample task definitions.

### 3. Create ECS Services

```bash
aws ecs create-service \
  --cluster ai-social-manager-cluster \
  --service-name backend \
  --task-definition backend:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

## Cost Estimation

Approximate monthly costs (us-east-1):

- **RDS PostgreSQL (db.t3.micro)**: ~$15
- **ElastiCache Redis (cache.t3.micro)**: ~$12
- **ECS Fargate (2 tasks)**: ~$30
- **Application Load Balancer**: ~$20
- **S3 Storage**: Variable (~$0.023/GB)
- **Data Transfer**: Variable

**Total**: ~$80-100/month for a small deployment

## Scaling

To scale the application:

```bash
# Update desired count in variables.tf
desired_count = 2

# Apply changes
terraform apply
```

## Monitoring

Access logs and metrics:

```bash
# View CloudWatch logs
aws logs tail /ecs/ai-social-manager --follow

# View ECS cluster
aws ecs describe-clusters --clusters ai-social-manager-cluster
```

## Backup and Recovery

- **Database**: Automated backups are configured (7-day retention)
- **S3**: Versioning is enabled on the media bucket

## Security Considerations

1. **Database credentials**: Store in AWS Secrets Manager (not implemented in this basic version)
2. **HTTPS**: Configure ACM certificate for ALB
3. **VPC**: Private subnets for database and Redis
4. **Security Groups**: Minimal required access
5. **Encryption**: RDS encryption at rest enabled

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all data. Make sure you have backups!

## Troubleshooting

### Issue: Terraform state locked

```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

### Issue: Insufficient capacity

Change availability zones or instance types in `variables.tf`.

### Issue: Database connection timeout

Check security group rules and ensure ECS tasks are in the correct subnets.

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
