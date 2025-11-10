#!/bin/bash

# AI Social Media Manager - Interactive Installer
# This script sets up the complete development environment

set -e

echo "🚀 AI Social Media Manager - Interactive Installer"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to prompt for input with default value
prompt_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local is_secret="$4"

    if [ -n "$default" ]; then
        prompt="$prompt (default: $default)"
    fi

    if [ "$is_secret" = "true" ]; then
        read -sp "$prompt: " value
        echo ""
    else
        read -p "$prompt: " value
    fi

    if [ -z "$value" ] && [ -n "$default" ]; then
        value="$default"
    fi

    eval "$var_name='$value'"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

MISSING_DEPS=0

if ! command_exists node; then
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version is too old. Please install Node.js 18+ from https://nodejs.org/"
        MISSING_DEPS=1
    else
        print_success "Node.js $(node -v) installed"
    fi
fi

if ! command_exists npm; then
    print_error "npm not found"
    MISSING_DEPS=1
else
    print_success "npm $(npm -v) installed"
fi

if ! command_exists docker; then
    print_warning "Docker not found. Docker is optional but recommended for local development."
else
    print_success "Docker installed"
fi

if ! command_exists psql; then
    print_warning "PostgreSQL client not found. You'll need PostgreSQL for the database."
else
    print_success "PostgreSQL client installed"
fi

if ! command_exists git; then
    print_error "Git not found. Please install Git."
    MISSING_DEPS=1
else
    print_success "Git installed"
fi

echo ""

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing required dependencies. Please install them and try again."
    exit 1
fi

# Ask for deployment mode
echo "🎯 Select Deployment Mode"
echo "========================="
echo ""
echo "1) Development (Local development environment)"
echo "2) Self-Hosted (Deploy on your own infrastructure)"
echo "3) SaaS Platform (Multi-tenant with billing)"
echo ""
prompt_input "Select mode [1-3]" "1" DEPLOYMENT_MODE

echo ""
echo "📝 Environment Configuration"
echo "============================"
echo ""

# Database Configuration
print_info "Database Configuration"
prompt_input "PostgreSQL Host" "localhost" DB_HOST
prompt_input "PostgreSQL Port" "5432" DB_PORT
prompt_input "PostgreSQL Database Name" "ai_social_manager" DB_NAME
prompt_input "PostgreSQL Username" "postgres" DB_USER
prompt_input "PostgreSQL Password" "" DB_PASSWORD true

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo ""

# Redis Configuration
print_info "Redis Configuration"
prompt_input "Redis Host" "localhost" REDIS_HOST
prompt_input "Redis Port" "6379" REDIS_PORT
prompt_input "Redis Password (leave empty if none)" "" REDIS_PASSWORD

echo ""

# JWT Configuration
print_info "JWT Configuration"
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-$(date +%s)")
JWT_REFRESH_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-refresh-secret-$(date +%s)")
print_success "Generated secure JWT secrets"

echo ""

# AI Services
print_info "AI Services Configuration"
echo "You can use cloud AI services (OpenAI/Anthropic) OR local LLM (Ollama)"
echo ""

# Check if Ollama is installed
OLLAMA_INSTALLED=0
if command_exists ollama; then
    print_success "Ollama is installed"
    OLLAMA_INSTALLED=1

    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_success "Ollama is running"

        # Check for available models
        OLLAMA_MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "")
        if [ -n "$OLLAMA_MODELS" ]; then
            print_success "Available Ollama models: $(echo $OLLAMA_MODELS | tr '\n' ', ' | sed 's/,$//')"
        else
            print_warning "No Ollama models found. You may want to pull a model: ollama pull llama3"
        fi
    else
        print_warning "Ollama is installed but not running. Start it with: ollama serve"
    fi
else
    print_info "Ollama not found. For cost-effective email campaigns, consider installing Ollama."
    echo "  Installation: curl -fsSL https://ollama.ai/install.sh | sh"
    echo "  Then pull a model: ollama pull llama3"
fi

echo ""
prompt_input "OpenAI API Key (sk-...) [optional if using Ollama]" "" OPENAI_API_KEY
prompt_input "Anthropic API Key (sk-ant-...) [optional if using Ollama]" "" ANTHROPIC_API_KEY

# Set Ollama configuration
if [ $OLLAMA_INSTALLED -eq 1 ]; then
    prompt_input "Ollama Base URL" "http://localhost:11434" OLLAMA_BASE_URL
    OLLAMA_TIMEOUT="60000"
else
    OLLAMA_BASE_URL="http://localhost:11434"
    OLLAMA_TIMEOUT="60000"
fi

if [ -z "$OPENAI_API_KEY" ] && [ -z "$ANTHROPIC_API_KEY" ] && [ $OLLAMA_INSTALLED -eq 0 ]; then
    print_warning "No AI services configured. Install Ollama or provide API keys for AI features."
    echo "For email campaigns with local LLM:"
    echo "  1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh"
    echo "  2. Start Ollama: ollama serve"
    echo "  3. Pull a model: ollama pull llama3"
fi

echo ""

# Stripe Configuration (for SaaS mode)
if [ "$DEPLOYMENT_MODE" = "3" ]; then
    print_info "Stripe Configuration (Required for SaaS)"
    prompt_input "Stripe Secret Key (sk_test_... or sk_live_...)" "" STRIPE_SECRET_KEY true
    prompt_input "Stripe Webhook Secret (whsec_...)" "" STRIPE_WEBHOOK_SECRET true
    prompt_input "Stripe Pro Plan Price ID (price_...)" "" STRIPE_PRO_PRICE_ID
    prompt_input "Stripe Business Plan Price ID (price_...)" "" STRIPE_BUSINESS_PRICE_ID
    echo ""
fi

# Email Configuration
print_info "Email Configuration (for notifications)"
prompt_input "SMTP Host (e.g., smtp.gmail.com)" "smtp.gmail.com" SMTP_HOST
prompt_input "SMTP Port" "587" SMTP_PORT
prompt_input "SMTP User" "" SMTP_USER
prompt_input "SMTP Password" "" SMTP_PASS true
prompt_input "From Email Address" "noreply@yourdomain.com" SMTP_FROM

echo ""

# Frontend URL
print_info "Frontend Configuration"
prompt_input "Frontend URL" "http://localhost:3000" FRONTEND_URL

echo ""

# Social Media APIs (Optional)
print_info "Social Media API Configuration (Optional - users can add their own)"
echo "Leave empty to skip. Users will provide their own API keys through the UI."
prompt_input "Twitter API Key" "" TWITTER_API_KEY
prompt_input "Twitter API Secret" "" TWITTER_API_SECRET true
prompt_input "Facebook App ID" "" FACEBOOK_APP_ID
prompt_input "Facebook App Secret" "" FACEBOOK_APP_SECRET true
prompt_input "LinkedIn Client ID" "" LINKEDIN_CLIENT_ID
prompt_input "LinkedIn Client Secret" "" LINKEDIN_CLIENT_SECRET true

echo ""

# AWS Configuration (for production deployments)
if [ "$DEPLOYMENT_MODE" != "1" ]; then
    print_info "AWS Configuration"
    prompt_input "AWS Region" "us-east-1" AWS_REGION
    prompt_input "AWS Profile Name (for CLI)" "default" AWS_PROFILE
    prompt_input "S3 Bucket Name (for media storage)" "" S3_BUCKET_NAME
    echo ""
fi

# Create .env files
echo "📄 Creating environment files..."
echo ""

# Backend .env
cat > backend/.env << EOF
# Database
DATABASE_URL=${DATABASE_URL}

# Redis
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

# AI Services
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# Ollama (Local LLM for email campaigns)
OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
OLLAMA_TIMEOUT=${OLLAMA_TIMEOUT}

# Stripe (for SaaS)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
STRIPE_PRO_PRICE_ID=${STRIPE_PRO_PRICE_ID}
STRIPE_BUSINESS_PRICE_ID=${STRIPE_BUSINESS_PRICE_ID}

# Email
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SECURE=false
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}

# Frontend URL
FRONTEND_URL=${FRONTEND_URL}

# Social Media (Optional)
TWITTER_API_KEY=${TWITTER_API_KEY}
TWITTER_API_SECRET=${TWITTER_API_SECRET}
FACEBOOK_APP_ID=${FACEBOOK_APP_ID}
FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}
LINKEDIN_CLIENT_ID=${LINKEDIN_CLIENT_ID}
LINKEDIN_CLIENT_SECRET=${LINKEDIN_CLIENT_SECRET}

# AWS (for production)
AWS_REGION=${AWS_REGION}
S3_BUCKET_NAME=${S3_BUCKET_NAME}

# Admin User (for seed)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
EOF

print_success "Created backend/.env"

# Frontend .env.local
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

print_success "Created frontend/.env.local"

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

print_info "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

print_info "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -eq 0 ]; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi
cd ..

echo ""

# Database setup
echo "🗄️  Setting up database..."
echo ""

cd backend

print_info "Generating Prisma client..."
npm run prisma:generate

print_info "Running database migrations..."
npm run migrate

print_info "Seeding database with initial data..."
npm run seed

cd ..

print_success "Database setup complete"

echo ""

# GitHub Secrets setup (optional)
if [ "$DEPLOYMENT_MODE" != "1" ]; then
    echo "🔐 GitHub Secrets Setup"
    echo "======================="
    echo ""
    print_info "For CI/CD, you'll need to set up GitHub secrets."
    echo ""
    prompt_input "Do you want to set up GitHub secrets now? (y/n)" "n" SETUP_GITHUB_SECRETS

    if [ "$SETUP_GITHUB_SECRETS" = "y" ] || [ "$SETUP_GITHUB_SECRETS" = "Y" ]; then
        if command_exists gh; then
            print_info "Setting GitHub secrets using GitHub CLI..."

            gh secret set DATABASE_URL --body "$DATABASE_URL"
            gh secret set JWT_SECRET --body "$JWT_SECRET"
            gh secret set JWT_REFRESH_SECRET --body "$JWT_REFRESH_SECRET"
            gh secret set OPENAI_API_KEY --body "$OPENAI_API_KEY"
            gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_API_KEY"

            if [ -n "$STRIPE_SECRET_KEY" ]; then
                gh secret set STRIPE_SECRET_KEY --body "$STRIPE_SECRET_KEY"
                gh secret set STRIPE_WEBHOOK_SECRET --body "$STRIPE_WEBHOOK_SECRET"
            fi

            if [ -n "$AWS_REGION" ]; then
                gh secret set AWS_REGION --body "$AWS_REGION"
                prompt_input "AWS Access Key ID" "" AWS_ACCESS_KEY_ID
                prompt_input "AWS Secret Access Key" "" AWS_SECRET_ACCESS_KEY true
                gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
                gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
            fi

            print_success "GitHub secrets configured"
        else
            print_warning "GitHub CLI (gh) not found. Please install it or set secrets manually."
            echo "Visit: https://github.com/cli/cli#installation"
        fi
    fi
    echo ""
fi

# Create startup script
cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting AI Social Media Manager..."
echo ""

# Start backend
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Servers started!"
echo ""
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

chmod +x start-dev.sh
print_success "Created start-dev.sh script"

echo ""
echo "✅ Installation Complete!"
echo "======================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the development servers:"
echo "   ./start-dev.sh"
echo ""
echo "   Or manually:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""
echo "2. Open your browser to:"
echo "   ${FRONTEND_URL}"
echo ""
echo "3. Login with default admin credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "4. Set up your social media API keys in the dashboard"
echo ""
echo "📚 Documentation:"
echo "   - Installation: docs/installation.md"
echo "   - API Keys: docs/api-keys/twitter.md"
echo "   - SaaS Deployment: docs/saas-deployment.md"
echo ""
echo "🐛 Troubleshooting:"
echo "   If you encounter issues, check:"
echo "   - PostgreSQL is running"
echo "   - Redis is running (if configured)"
echo "   - All environment variables are set correctly"
echo ""
echo "Happy coding! 🎉"
