# Quick Reference for AI Agents

## 🚀 Instant Commands

### Start Development
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Database GUI (optional)
cd backend && npm run prisma:studio
```

### Database Operations
```bash
cd backend

# Generate Prisma client (after schema changes)
npm run prisma:generate

# Create migration
npx prisma migrate dev --name descriptive_name

# Apply migrations (production)
npm run migrate:prod

# Seed database with initial data
npm run seed

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View data in browser
npm run prisma:studio
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Lint check
npm run lint

# Lint fix
npm run lint:fix
```

### Build & Deploy
```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Start production
npm start

# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## 📁 Key Files to Know

### Backend
- `backend/src/routes/index.ts` - All API routes registered here
- `backend/src/middleware/auth.ts` - JWT authentication
- `backend/src/middleware/featureGate.ts` - Subscription limits
- `backend/src/services/stripe.ts` - Payment processing
- `backend/src/services/ai/index.ts` - AI content generation
- `backend/prisma/schema.prisma` - Database schema
- `backend/prisma/seed.ts` - Initial data

### Frontend
- `frontend/app/dashboard/page.tsx` - Main dashboard
- `frontend/lib/api.ts` - API client (ADD NEW ENDPOINTS HERE)
- `frontend/lib/store.ts` - State management
- `frontend/components/layout/sidebar.tsx` - Navigation menu

## 🔧 Common File Modifications

### Add New API Endpoint

**1. Backend Route** (`backend/src/routes/[feature].ts`):
```typescript
import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  // Implementation
});

export default router;
```

**2. Register Route** (`backend/src/routes/index.ts`):
```typescript
import featureRoutes from './feature';
router.use('/feature', featureRoutes);
```

**3. Frontend API Client** (`frontend/lib/api.ts`):
```typescript
export const featureApi = {
  getAll: () => api.get('/feature'),
  getById: (id: string) => api.get(`/feature/${id}`),
  create: (data: any) => api.post('/feature', data),
  update: (id: string, data: any) => api.patch(`/feature/${id}`, data),
  delete: (id: string) => api.delete(`/feature/${id}`),
}
```

### Add New Page

**1. Create Page** (`frontend/app/[path]/page.tsx`):
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { featureApi } from '@/lib/api'

export default function FeaturePage() {
  const { data } = useQuery({
    queryKey: ['feature'],
    queryFn: async () => {
      const response = await featureApi.getAll()
      return response.data
    },
  })

  return <div>{/* Your UI */}</div>
}
```

**2. Add to Sidebar** (`frontend/components/layout/sidebar.tsx`):
```typescript
import { Icon } from 'lucide-react'

const navigation = [
  // ... existing
  { name: 'Feature', href: '/dashboard/feature', icon: Icon },
]
```

### Add Database Model

**1. Update Schema** (`backend/prisma/schema.prisma`):
```prisma
model Feature {
  id        String   @id @default(cuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("features")
}
```

**2. Update User Model**:
```prisma
model User {
  // ... existing fields
  features Feature[]
}
```

**3. Generate & Migrate**:
```bash
npm run prisma:generate
npx prisma migrate dev --name add_feature
```

## 🎯 Feature Development Checklist

- [ ] Update database schema (if needed)
- [ ] Run migration
- [ ] Create backend route
- [ ] Add middleware (auth, validation)
- [ ] Create frontend API client function
- [ ] Build UI component/page
- [ ] Add to navigation (if new page)
- [ ] Test all flows
- [ ] Update documentation
- [ ] Commit with clear message

## 🔒 Security Checklist

- [ ] Authenticate all protected routes
- [ ] Validate all inputs (express-validator)
- [ ] Check authorization (user owns resource)
- [ ] Sanitize user input
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Don't expose secrets in frontend
- [ ] Use HTTPS in production
- [ ] Rate limit sensitive endpoints
- [ ] Log security events

## 🐛 Debugging Quick Reference

### Backend Issues
```bash
# View logs
npm run dev  # Shows real-time logs

# Test endpoint
curl -X GET http://localhost:3001/api/endpoint \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check database
npm run prisma:studio
```

### Frontend Issues
```bash
# Check browser console (F12)
# Check Network tab for API calls
# Check React DevTools

# Clear cache and rebuild
rm -rf .next
npm run build
npm run dev
```

### Database Issues
```bash
# Check connection
psql $DATABASE_URL

# View schema
npm run prisma:studio

# Check migrations
npx prisma migrate status

# Fix migrations
npx prisma migrate resolve --applied "migration_name"
```

## 📊 Subscription Plan Limits

```typescript
// Check limits in middleware
const limits = {
  FREE: {
    maxSocialAccounts: 1,
    maxPostsPerMonth: 10,
    maxBrandProfiles: 1,
    features: ['basic_ai']
  },
  PRO: {
    maxSocialAccounts: 5,
    maxPostsPerMonth: 999999,
    maxBrandProfiles: 3,
    features: ['advanced_ai', 'analytics', 'auto_replies']
  },
  BUSINESS: {
    maxSocialAccounts: 999999,
    maxPostsPerMonth: 999999,
    maxBrandProfiles: 999999,
    features: ['all']
  }
}
```

## 🎨 UI Component Examples

### Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default">Click Me</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Form Input
```tsx
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>
```

## 🔄 Git Workflow

```bash
# Check status
git status

# Stage files
git add .

# Commit
git commit -m "feat: add new feature"

# Push to branch
git push -u origin claude/ai-social-media-manager-SESSIONID

# Check branch
git branch
```

## 💳 Stripe Testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### Test Webhook Locally
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# In another terminal
stripe trigger customer.subscription.created
```

## 📧 Email Testing

### Development
Set up SMTP in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Test Email
```typescript
import { EmailService } from '../services/email';

await EmailService.sendWelcomeEmail(
  'test@example.com',
  'Test User'
);
```

## 🚨 Emergency Commands

### Reset Everything
```bash
# Stop all processes
# Ctrl+C in all terminals

# Reset database
cd backend
npm run prisma:reset

# Clear node_modules
rm -rf node_modules
npm install

# Clear Next.js cache
cd ../frontend
rm -rf .next
npm install

# Restart
cd ../backend && npm run dev
cd ../frontend && npm run dev
```

### Fix Prisma Issues
```bash
# Regenerate client
npm run prisma:generate

# Reset migrations (DANGER)
npx prisma migrate reset

# Format schema
npx prisma format
```

---

**Remember**: When in doubt, check the main project-context.md file!
