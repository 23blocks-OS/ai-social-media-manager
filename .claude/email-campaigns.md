# Email Campaign System Documentation

## Overview

The AI Social Media Manager now includes a comprehensive email campaign system that allows users to send personalized email campaigns to their contacts. The system leverages AI (local LLM via Ollama or cloud APIs) to generate highly personalized emails based on contact profiles, social media activity, and previous interactions.

## Key Features

### 1. Contact Management
- **Multiple Import Sources:**
  - Manual entry
  - CSV file import/export
  - Social media connections (Twitter, LinkedIn, Instagram, Facebook)
  - API endpoints for programmatic import

- **Contact Fields:**
  - Basic info: email, name, company, job title, location, phone, website
  - Social profiles and activity data
  - Custom fields for additional data
  - Tags for segmentation
  - Subscription status and history
  - Interaction tracking

- **List Management:**
  - Static and dynamic contact lists
  - Tag-based filtering
  - Segmentation capabilities

### 2. AI-Powered Email Personalization

#### Supported AI Models:
1. **Local LLM (Ollama)** - Cost-effective, privacy-focused
   - Default: llama3
   - Supports: llama3, mistral, mixtral, neural-chat
   - Runs locally on the server

2. **OpenAI** - Cloud-based, high quality
   - Models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo

3. **Anthropic Claude** - Cloud-based, advanced reasoning
   - Models: claude-3-5-sonnet, claude-3-opus, claude-3-sonnet

#### Personalization Levels:
- **LOW**: Basic personalization (name, company)
- **MEDIUM**: Key personalization elements + relevant interests
- **HIGH**: Deep personalization with social context and interaction history

#### Personalization Context:
- Contact profile data (name, company, role, location)
- Social media activity and interests
- Previous interaction history
- Custom fields and tags
- Recent posts and engagement

### 3. Campaign Management

#### Campaign Workflow:
1. **Create Campaign**: Define goal, subject template, target audience
2. **Add Contacts**: Select contacts by tags or specific IDs
3. **Generate Emails**: AI generates personalized content for each contact
4. **Review**: Preview generated emails (optional test sends)
5. **Send**: Deploy campaign with rate limiting
6. **Track**: Monitor opens, clicks, bounces, conversions

#### Campaign Statuses:
- `DRAFT`: Initial creation
- `GENERATING`: AI is creating personalized emails
- `READY`: Emails generated, ready to send
- `SCHEDULED`: Scheduled for future send
- `SENDING`: Currently sending emails
- `COMPLETED`: All emails sent
- `PAUSED`: Temporarily paused
- `CANCELLED`: Stopped before completion

### 4. Email Analytics

#### Tracked Metrics:
- Total contacts
- Emails generated
- Emails sent
- Delivery rate
- Open rate
- Click-through rate
- Bounce rate
- Unsubscribe rate

#### Event Tracking:
- Email sent
- Email delivered
- Email opened
- Link clicked
- Bounced
- Unsubscribed
- Marked as spam

## API Endpoints

### Contacts

```
GET    /api/contacts                  # List contacts
GET    /api/contacts/:id              # Get contact details
POST   /api/contacts                  # Create contact
PUT    /api/contacts/:id              # Update contact
DELETE /api/contacts/:id              # Delete contact

POST   /api/contacts/import/csv       # Import from CSV
POST   /api/contacts/import/social    # Import from social media
GET    /api/contacts/export/csv       # Export to CSV

POST   /api/contacts/:id/tags         # Add tags
DELETE /api/contacts/:id/tags         # Remove tags

POST   /api/contacts/unsubscribe/:token  # Unsubscribe (public)
```

### Campaigns

```
GET    /api/campaigns                 # List campaigns
GET    /api/campaigns/:id             # Get campaign details
POST   /api/campaigns                 # Create campaign
PUT    /api/campaigns/:id             # Update campaign
DELETE /api/campaigns/:id             # Delete campaign

POST   /api/campaigns/:id/contacts    # Add contacts to campaign
POST   /api/campaigns/:id/generate    # Generate personalized emails
POST   /api/campaigns/:id/send        # Send campaign

GET    /api/campaigns/:id/analytics   # Get campaign analytics
```

## Database Schema

### Contacts Table
```sql
contacts
  - id, userId, email (unique per user)
  - firstName, lastName, fullName
  - company, jobTitle, location, phone, website
  - source (SOCIAL_MEDIA, CSV_IMPORT, MANUAL, API, INTEGRATION)
  - sourceId, profileData, customFields
  - isSubscribed, isVerified
  - unsubscribedAt, lastContactedAt
  - timestamps
```

### Email Campaigns Table
```sql
email_campaigns
  - id, userId, name, description
  - subjectTemplate, campaignGoal
  - targetTags (array)
  - aiModelType (LOCAL_LLM, OPENAI, ANTHROPIC)
  - aiModelName
  - personalizationInstructions, personalizationLevel
  - includeSocialContext, includeInteractionHistory
  - status
  - statistics (totalContacts, emailsSent, emailsOpened, etc.)
  - scheduledAt, startedAt, completedAt
  - timestamps
```

### Campaign Contacts Table
```sql
campaign_contacts
  - id, campaignId, contactId
  - personalizedSubject, personalizedContent, htmlContent
  - status (PENDING, GENERATING, GENERATED, SENT, DELIVERED, OPENED, etc.)
  - aiGenerationTimeMs, sendAttempts, errorMessage
  - sentAt, deliveredAt, openedAt, clickedAt, bouncedAt
  - timestamps
```

### Supporting Tables
- `contact_tags`: Contact tagging system
- `contact_interactions`: Interaction history
- `email_templates`: Base templates for campaigns
- `email_tracking`: Detailed event tracking
- `contact_lists`: Organized contact lists
- `contact_list_members`: List membership

## Configuration

### Environment Variables

#### SMTP Configuration (Required for sending emails)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

#### Ollama Configuration (Optional, for local LLM)
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=60000
```

#### OpenAI Configuration (Optional)
```bash
OPENAI_API_KEY=sk-...
```

#### Anthropic Configuration (Optional)
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Setting Up Ollama (Local LLM)

### Installation

1. **Install Ollama:**
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh

   # Or download from https://ollama.ai
   ```

2. **Pull recommended model:**
   ```bash
   ollama pull llama3
   ```

3. **Start Ollama service:**
   ```bash
   ollama serve
   ```

4. **Verify Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Recommended Models for Email Generation

1. **llama3** (Default) - 8GB RAM
   - Best balance of quality and speed
   - Good at following instructions
   - Excellent for personalization

2. **llama3:70b** - 40GB RAM
   - Higher quality outputs
   - Better reasoning
   - Slower generation

3. **mistral** - 4GB RAM
   - Faster than llama3
   - Good quality
   - Lower resource usage

4. **mixtral** - 26GB RAM
   - Very high quality
   - Excellent instruction following
   - Good for complex personalization

5. **neural-chat** - 4GB RAM
   - Optimized for conversational tasks
   - Fast generation
   - Good for email content

### Pulling Additional Models
```bash
ollama pull llama3:70b
ollama pull mistral
ollama pull mixtral
ollama pull neural-chat
```

## Usage Examples

### 1. Import Contacts from CSV

```bash
curl -X POST http://localhost:3001/api/contacts/import/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "csvData": "email,firstName,lastName,company,jobTitle\njohn@example.com,John,Doe,Acme Inc,CEO\njane@example.com,Jane,Smith,Tech Corp,CTO"
  }'
```

### 2. Import Contacts from Social Media

```bash
curl -X POST http://localhost:3001/api/contacts/import/social \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "socialAccountId": "account_id_here",
    "importType": "followers"
  }'
```

### 3. Create Email Campaign

```bash
curl -X POST http://localhost:3001/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Product Launch Campaign",
    "description": "Announcing our new AI features",
    "subjectTemplate": "Check out our new AI features, {{firstName}}!",
    "campaignGoal": "Inform contacts about new AI features and drive signups",
    "targetTags": ["customers", "early-adopters"],
    "aiModelType": "LOCAL_LLM",
    "aiModelName": "llama3",
    "personalizationLevel": "HIGH",
    "includeSocialContext": true,
    "includeInteractionHistory": true,
    "personalizationInstructions": "Reference their industry and how our AI features specifically benefit their use case",
    "baseTemplate": "Hi {{firstName}},\n\nI wanted to personally reach out about our new AI features..."
  }'
```

### 4. Add Contacts to Campaign

```bash
curl -X POST http://localhost:3001/api/campaigns/CAMPAIGN_ID/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["customers", "early-adopters"]
  }'
```

### 5. Generate Personalized Emails

```bash
curl -X POST http://localhost:3001/api/campaigns/CAMPAIGN_ID/generate \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Send Test Email

```bash
curl -X POST http://localhost:3001/api/campaigns/CAMPAIGN_ID/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "test@example.com"
  }'
```

### 7. Send Campaign

```bash
curl -X POST http://localhost:3001/api/campaigns/CAMPAIGN_ID/send \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 8. Get Campaign Analytics

```bash
curl http://localhost:3001/api/campaigns/CAMPAIGN_ID/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Services Architecture

### Email Composer Service
**File:** `backend/src/services/email-composer.service.ts`

Responsible for generating personalized emails using AI:
- Builds personalization context from contact data
- Supports multiple AI providers (Ollama, OpenAI, Anthropic)
- Implements different personalization levels
- Converts plain text to HTML
- Batch generation with progress tracking

### Ollama Service
**File:** `backend/src/services/ollama.service.ts`

Handles communication with local Ollama instance:
- Model availability checking
- Text generation with chat API
- Email-specific generation method
- Model pulling and management
- Connection testing

### Email Sending Service
**File:** `backend/src/services/email-sending.service.ts`

Manages email delivery and tracking:
- SMTP integration with nodemailer
- Rate limiting to avoid spam flags
- Event tracking (sent, delivered, opened, clicked, bounced)
- Campaign statistics updates
- Webhook handling for delivery services

### Social Import Service
**File:** `backend/src/services/social-import.service.ts`

Imports contacts from social media platforms:
- Twitter followers/following
- LinkedIn connections
- Instagram followers/following
- Facebook friends
- Profile data extraction
- Automatic contact creation/update

## Best Practices

### 1. Email Deliverability
- Use verified SMTP credentials
- Implement proper SPF, DKIM, DMARC records
- Start with smaller batches to warm up
- Maintain good sender reputation
- Include unsubscribe links
- Honor unsubscribe requests immediately

### 2. Personalization
- Start with MEDIUM personalization level
- Use HIGH for VIP contacts or important campaigns
- Include relevant social context when available
- Reference previous interactions when appropriate
- Keep tone consistent with your brand

### 3. Contact Management
- Regularly clean contact lists
- Remove unsubscribed contacts from future campaigns
- Segment contacts with tags
- Keep profile data up to date
- Track interaction history

### 4. Cost Optimization
- Use local LLM (Ollama) for bulk campaigns
- Reserve OpenAI/Claude for high-value contacts
- Implement caching for similar personalization
- Batch process when possible

### 5. Testing
- Always send test emails before full campaign
- Test different personalization levels
- Verify deliverability with test accounts
- Check spam scores
- Test unsubscribe flow

### 6. Monitoring
- Track all key metrics
- Set up alerts for high bounce rates
- Monitor spam complaints
- Review campaign performance
- A/B test subject lines and content

## Troubleshooting

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama service
pkill ollama && ollama serve

# Check available models
ollama list
```

### Email Sending Issues
- Verify SMTP credentials
- Check SMTP port and security settings
- Test with a simple email client first
- Review error logs in backend
- Check for rate limiting

### Import Issues
- Verify social account tokens are valid
- Check API rate limits for social platforms
- Ensure CSV format matches expected schema
- Review error messages for specific contacts

## Future Enhancements

Potential improvements for the email campaign system:

1. **Advanced Scheduling**
   - Time zone optimization
   - Send time personalization
   - Drip campaigns

2. **A/B Testing**
   - Subject line testing
   - Content variations
   - AI model comparison

3. **Advanced Analytics**
   - Heatmaps for email content
   - Revenue attribution
   - Conversion tracking

4. **Template Library**
   - Pre-built campaign templates
   - Industry-specific templates
   - Seasonal templates

5. **Automation**
   - Triggered campaigns
   - Behavior-based sequences
   - Re-engagement campaigns

6. **Integration**
   - CRM integration
   - E-commerce platforms
   - Zapier/Make connectors

## Security Considerations

1. **Email Addresses**
   - Never share or sell contact lists
   - Encrypt sensitive data
   - Implement proper access controls

2. **Unsubscribe**
   - Honor all unsubscribe requests
   - Include unsubscribe link in every email
   - Track unsubscribe history

3. **GDPR Compliance**
   - Obtain explicit consent
   - Allow data export
   - Implement data deletion

4. **API Security**
   - All endpoints require authentication
   - Rate limiting on sensitive operations
   - Input validation

## Support

For issues or questions:
1. Check logs: `backend/logs/`
2. Review error messages
3. Test individual components
4. Check environment configuration
5. Verify database migrations ran successfully
