#!/bin/bash

# Setup GitHub Secrets for CI/CD
# This script helps you configure all necessary GitHub secrets for the CI/CD pipeline

set -e

echo "🔐 GitHub Secrets Setup"
echo "======================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed."
    echo ""
    echo "Install it from: https://cli.github.com/"
    echo ""
    echo "macOS:   brew install gh"
    echo "Ubuntu:  sudo apt install gh"
    echo "Windows: winget install GitHub.cli"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub CLI."
    echo ""
    echo "Run: gh auth login"
    exit 1
fi

print_success "GitHub CLI authenticated"
echo ""

# Get repository info
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
print_info "Repository: $REPO"
echo ""

# Function to set secret
set_secret() {
    local name="$1"
    local value="$2"
    local description="$3"

    if [ -z "$value" ]; then
        print_warning "Skipping $name (empty value)"
        return
    fi

    echo "$value" | gh secret set "$name"
    print_success "Set $name"
}

# Function to prompt for secret
prompt_secret() {
    local name="$1"
    local description="$2"
    local is_secret="${3:-true}"

    echo ""
    print_info "$description"

    if [ "$is_secret" = "true" ]; then
        read -sp "Enter $name: " value
        echo ""
    else
        read -p "Enter $name: " value
    fi

    if [ -n "$value" ]; then
        set_secret "$name" "$value" "$description"
    fi
}

echo "Let's configure your GitHub secrets for CI/CD"
echo ""
echo "You can skip any secret by pressing Enter (leave empty)"
echo ""

# AWS Configuration
echo "═══════════════════════════════════"
echo "AWS Configuration"
echo "═══════════════════════════════════"

prompt_secret "AWS_ACCESS_KEY_ID" "AWS Access Key ID for deployment"
prompt_secret "AWS_SECRET_ACCESS_KEY" "AWS Secret Access Key"
prompt_secret "AWS_REGION" "AWS Region (e.g., us-east-1)" false

# Database
echo ""
echo "═══════════════════════════════════"
echo "Database Configuration"
echo "═══════════════════════════════════"

prompt_secret "DATABASE_URL" "PostgreSQL connection string"

# Redis
echo ""
echo "═══════════════════════════════════"
echo "Redis Configuration"
echo "═══════════════════════════════════"

prompt_secret "REDIS_HOST" "Redis host" false
prompt_secret "REDIS_PORT" "Redis port (default: 6379)" false
prompt_secret "REDIS_PASSWORD" "Redis password (if required)"

# JWT
echo ""
echo "═══════════════════════════════════"
echo "JWT Configuration"
echo "═══════════════════════════════════"

# Generate JWT secrets if not provided
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "")
JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "")

if [ -n "$JWT_SECRET" ]; then
    set_secret "JWT_SECRET" "$JWT_SECRET" "JWT Secret"
    print_info "Generated secure JWT_SECRET"
else
    prompt_secret "JWT_SECRET" "JWT secret key"
fi

if [ -n "$JWT_REFRESH_SECRET" ]; then
    set_secret "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET" "JWT Refresh Secret"
    print_info "Generated secure JWT_REFRESH_SECRET"
else
    prompt_secret "JWT_REFRESH_SECRET" "JWT refresh secret key"
fi

# AI Services
echo ""
echo "═══════════════════════════════════"
echo "AI Services"
echo "═══════════════════════════════════"

prompt_secret "OPENAI_API_KEY" "OpenAI API Key (sk-...)"
prompt_secret "ANTHROPIC_API_KEY" "Anthropic API Key (sk-ant-...)"

# Stripe
echo ""
echo "═══════════════════════════════════"
echo "Stripe (for SaaS mode)"
echo "═══════════════════════════════════"

prompt_secret "STRIPE_SECRET_KEY" "Stripe Secret Key (sk_test_... or sk_live_...)"
prompt_secret "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret (whsec_...)"
prompt_secret "STRIPE_PRO_PRICE_ID" "Stripe Pro Plan Price ID (price_...)" false
prompt_secret "STRIPE_BUSINESS_PRICE_ID" "Stripe Business Plan Price ID (price_...)" false

# Email
echo ""
echo "═══════════════════════════════════"
echo "Email Configuration"
echo "═══════════════════════════════════"

prompt_secret "SMTP_HOST" "SMTP Host (e.g., smtp.gmail.com)" false
prompt_secret "SMTP_PORT" "SMTP Port (e.g., 587)" false
prompt_secret "SMTP_USER" "SMTP Username"
prompt_secret "SMTP_PASS" "SMTP Password"
prompt_secret "SMTP_FROM" "From Email Address" false

# Social Media (Optional)
echo ""
echo "═══════════════════════════════════"
echo "Social Media APIs (Optional)"
echo "═══════════════════════════════════"
print_info "These are optional - users can add their own keys through the UI"
echo ""

prompt_secret "TWITTER_API_KEY" "Twitter API Key (optional)"
prompt_secret "TWITTER_API_SECRET" "Twitter API Secret (optional)"
prompt_secret "FACEBOOK_APP_ID" "Facebook App ID (optional)" false
prompt_secret "FACEBOOK_APP_SECRET" "Facebook App Secret (optional)"
prompt_secret "LINKEDIN_CLIENT_ID" "LinkedIn Client ID (optional)" false
prompt_secret "LINKEDIN_CLIENT_SECRET" "LinkedIn Client Secret (optional)"

# Frontend URL
echo ""
echo "═══════════════════════════════════"
echo "Frontend Configuration"
echo "═══════════════════════════════════"

prompt_secret "FRONTEND_URL" "Frontend URL (e.g., https://yourdomain.com)" false

# ECR Repositories
echo ""
echo "═══════════════════════════════════"
echo "ECR Configuration"
echo "═══════════════════════════════════"

prompt_secret "ECR_REPOSITORY" "ECR Repository Name (e.g., ai-social-manager)" false

echo ""
echo "✅ GitHub Secrets Configuration Complete!"
echo ""
echo "Next steps:"
echo "1. Push to develop/staging/main branch to trigger deployment"
echo "2. Monitor the Actions tab in GitHub"
echo "3. Check the deployment logs for any issues"
echo ""
echo "Branches and their deployment targets:"
echo "  develop/dev → Development environment"
echo "  staging     → Staging environment"
echo "  main        → Production environment"
echo ""
echo "To view secrets: gh secret list"
echo "To update a secret: gh secret set SECRET_NAME"
echo ""
print_success "Setup complete! 🎉"
