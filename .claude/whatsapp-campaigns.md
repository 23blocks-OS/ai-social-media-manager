# WhatsApp Marketing Campaigns Documentation

## Overview

The AI Social Media Manager now includes WhatsApp marketing campaigns, allowing you to send personalized WhatsApp messages at scale using approved templates. WhatsApp is one of the most effective marketing channels with read rates exceeding 98%!

## Key Features

### 1. WhatsApp Business API Integration
- **Meta Cloud API** (Recommended - Easiest setup)
- **Twilio WhatsApp API** (Alternative option)
- Template-based messaging for marketing
- Real-time delivery and read receipts
- Webhook support for status updates

### 2. Template Management
- Create custom WhatsApp templates
- Support for headers (text, images, videos, documents)
- Body text with variable placeholders
- Optional footers and action buttons
- Submit templates for WhatsApp approval
- Track template status (PENDING, APPROVED, REJECTED)

### 3. Campaign Management
- Reuse existing contact system
- Target by tags and segments
- **WhatsApp opt-in tracking** (GDPR compliant)
- Phone number validation (E.164 format)
- Rate-limited sending (up to 80 msg/sec)
- Real-time campaign statistics

### 4. Analytics & Tracking
- Messages sent, delivered, read
- Delivery rate, read rate
- Failed message tracking
- Individual message status updates via webhooks

## Setup Guide

### Option 1: Meta Cloud API (Recommended)

#### Prerequisites
1. **Facebook Business Account**
2. **Meta Developer Account**
3. **WhatsApp Business Account**

#### Step-by-Step Setup

**1. Create a Facebook App**
```
1. Go to https://developers.facebook.com/
2. Click "Create App"
3. Select "Business" type
4. Fill in app details
```

**2. Add WhatsApp Product**
```
1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set up"
3. Follow the WhatsApp Business API setup wizard
```

**3. Get Your Credentials**
```
WhatsApp Phone Number ID:
- Found in WhatsApp > API Setup > Phone Number ID

Business Account ID:
- Found in WhatsApp > API Setup > Business Account ID

Access Token:
- Generate in WhatsApp > API Setup > Temporary Access Token
- For production, create a permanent System User token
```

**4. Configure Webhooks**
```
Callback URL: https://yourdomain.com/api/whatsapp/webhook
Verify Token: (set your own secret token)

Subscribe to:
- messages (for opt-ins and replies)
- message_status (for delivery/read receipts)
```

**5. Set Environment Variables**
```bash
# Meta Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_API_VERSION=v18.0

# Webhook Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret
```

**6. Verify Your Business**
```
1. Complete business verification in Meta Business Suite
2. This is required to send messages beyond test numbers
3. Usually takes 1-3 business days
```

### Option 2: Twilio WhatsApp API

#### Prerequisites
1. **Twilio Account**
2. **WhatsApp Sender approved** (via Twilio)

#### Setup Steps

**1. Create Twilio Account**
```
1. Sign up at https://www.twilio.com/
2. Verify your email and phone number
```

**2. Enable WhatsApp**
```
1. Go to Messaging > Try it out > Send a WhatsApp message
2. Follow the WhatsApp Sender setup process
3. Get your WhatsApp-enabled Twilio number
```

**3. Set Environment Variables**
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886  # Your Twilio WhatsApp number
```

**4. Configure Webhooks**
```
In Twilio Console:
- Go to Messaging > Settings > WhatsApp sender
- Set Status Callback URL: https://yourdomain.com/api/whatsapp/webhook
```

## WhatsApp Message Templates

### Why Templates?

WhatsApp requires pre-approved templates for marketing messages. This ensures:
- No spam
- Professional communication
- User consent
- Compliance with WhatsApp policies

### Template Categories

1. **MARKETING** - Promotional messages, offers, announcements
2. **UTILITY** - Account updates, order status, notifications
3. **AUTHENTICATION** - OTP codes, verification messages

### Template Components

#### 1. Header (Optional)
```javascript
{
  type: "HEADER",
  format: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT",
  text: "Hello {{1}}!",  // For TEXT format
  // or
  media_url: "https://..."  // For media formats
}
```

#### 2. Body (Required)
```javascript
{
  type: "BODY",
  text: "Hi {{1}}, we have a special offer for you at {{2}}!"
}
```

#### 3. Footer (Optional)
```javascript
{
  type: "FOOTER",
  text: "Reply STOP to unsubscribe"
}
```

#### 4. Buttons (Optional)
```javascript
{
  type: "BUTTONS",
  buttons: [
    {
      type: "QUICK_REPLY",
      text: "Yes, I'm interested"
    },
    {
      type: "URL",
      text: "Visit Website",
      url: "https://yoursite.com"
    },
    {
      type: "PHONE_NUMBER",
      text: "Call Us",
      phone_number: "+1234567890"
    }
  ]
}
```

### Template Example

**Marketing Template - Product Launch**
```javascript
{
  "name": "product_launch",
  "language": "en",
  "category": "MARKETING",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "New Product Alert! 🚀"
    },
    {
      "type": "BODY",
      "text": "Hi {{1}}! We're excited to announce our latest product designed specifically for {{2}}. Get 20% off this week only!"
    },
    {
      "type": "FOOTER",
      "text": "Limited time offer"
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Shop Now",
          "url": "https://yoursite.com/products"
        }
      ]
    }
  ]
}
```

## API Endpoints

### Configuration

```bash
# Get WhatsApp configuration
GET /api/whatsapp/config

# Save WhatsApp configuration
POST /api/whatsapp/config
{
  "provider": "META_CLOUD_API" | "TWILIO",
  "phoneNumberId": "...",
  "businessAccountId": "...",
  "accessToken": "...",
  // or for Twilio
  "twilioAccountSid": "...",
  "twilioAuthToken": "...",
  "twilioPhoneNumber": "..."
}
```

### Templates

```bash
# List templates
GET /api/whatsapp/templates?status=APPROVED

# Create template
POST /api/whatsapp/templates
{
  "name": "welcome_message",
  "language": "en",
  "category": "MARKETING",
  "headerType": "TEXT",
  "headerContent": "Welcome!",
  "bodyText": "Hi {{1}}, welcome to {{2}}!",
  "footerText": "Reply STOP to opt out",
  "buttons": [
    {
      "type": "QUICK_REPLY",
      "text": "Get Started"
    }
  ]
}
```

### Campaigns

```bash
# List campaigns
GET /api/whatsapp/campaigns

# Create campaign
POST /api/whatsapp/campaigns
{
  "name": "Spring Sale Campaign",
  "description": "Promote spring sale to opted-in customers",
  "templateId": "template_id_here",
  "targetTags": ["customers", "opted-in"],
  "aiModelType": "LOCAL_LLM",
  "aiModelName": "llama3"
}

# Add contacts to campaign
POST /api/whatsapp/campaigns/:id/contacts
{
  "tags": ["customers"]
  // or
  "contactIds": ["contact1", "contact2"]
}

# Send test message
POST /api/whatsapp/campaigns/:id/send
{
  "testPhone": "+1234567890"
}

# Send campaign
POST /api/whatsapp/campaigns/:id/send

# Get analytics
GET /api/whatsapp/campaigns/:id/analytics
```

## Contact Management for WhatsApp

### WhatsApp Opt-In

**IMPORTANT**: You can only send marketing messages to contacts who have explicitly opted in to receive WhatsApp messages from you.

#### Update Contact with Opt-In

```bash
PUT /api/contacts/:id
{
  "phone": "+1234567890",
  "phoneCountryCode": "+1",
  "whatsappOptIn": true,
  "whatsappOptInDate": "2025-01-10T00:00:00Z"
}
```

#### Opt-In Methods

1. **Website Form**: Add checkbox for WhatsApp consent
2. **SMS Opt-In**: Send SMS asking to reply YES for WhatsApp
3. **WhatsApp Message**: Have users send a message to your number
4. **In-Person**: Collect consent during signup

### Phone Number Format

WhatsApp requires E.164 format:
```
+[country code][number]

Examples:
+1234567890 (US)
+447911123456 (UK)
+5511987654321 (Brazil)
```

## Usage Examples

### 1. Create and Submit Template

```javascript
// Create template
const template = await fetch('https://api.yoursite.com/api/whatsapp/templates', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'summer_sale_2025',
    language: 'en',
    category: 'MARKETING',
    headerType: 'TEXT',
    headerContent: 'Summer Sale! ☀️',
    bodyText: 'Hi {{1}}! Enjoy {{2}}% off everything this summer at {{3}}!',
    footerText: 'Valid until July 31st',
    buttons: [
      {
        type: 'URL',
        text: 'Shop Now',
        url: 'https://yoursite.com/summer-sale'
      }
    ]
  })
});

// Template is now submitted to WhatsApp for approval
// Check status after a few hours
```

### 2. Wait for Template Approval

```javascript
// Check template status
const templates = await fetch('https://api.yoursite.com/api/whatsapp/templates?status=APPROVED', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

// Template status can be:
// - PENDING: Under review by WhatsApp
// - APPROVED: Ready to use
// - REJECTED: Declined (check rejectionReason)
```

### 3. Create Campaign with Approved Template

```javascript
const campaign = await fetch('https://api.yoursite.com/api/whatsapp/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Summer Sale WhatsApp Blast',
    description: 'Send summer sale announcement to all opted-in customers',
    templateId: 'approved_template_id',
    targetTags: ['customers', 'whatsapp-opted-in']
  })
});
```

### 4. Add Contacts (Only Opted-In!)

```javascript
// Add contacts by tags
await fetch(`https://api.yoursite.com/api/whatsapp/campaigns/${campaignId}/contacts`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tags: ['customers']
  })
});

// System automatically filters for:
// - whatsappOptIn: true
// - Valid phone number
// - Not null phone
```

### 5. Send Test Message

```javascript
await fetch(`https://api.yoursite.com/api/whatsapp/campaigns/${campaignId}/send`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    testPhone: '+1234567890'
  })
});
```

### 6. Send Campaign

```javascript
await fetch(`https://api.yoursite.com/api/whatsapp/campaigns/${campaignId}/send`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Campaign will send to all valid contacts
// Rate limited to 80 messages/second (Meta Cloud API)
```

## WhatsApp Policies & Best Practices

### ✅ DO's

1. **Always Get Consent**
   - Explicit opt-in required
   - Clear explanation of what they're signing up for
   - Easy opt-out mechanism

2. **Use Approved Templates**
   - Submit templates for review
   - Wait for approval before using
   - Keep templates professional

3. **Respect 24-Hour Window**
   - Free-form messages only within 24 hours of user message
   - Use templates for proactive outreach

4. **Monitor Quality**
   - Keep block rate < 2%
   - Maintain high engagement
   - Remove non-responsive contacts

5. **Provide Value**
   - Send relevant, timely messages
   - Don't spam
   - Quality over quantity

### ❌ DON'Ts

1. **Don't Buy Phone Lists**
   - Only message people who opted in
   - Never scrape or buy contact lists

2. **Don't Send Without Consent**
   - Marketing without opt-in violates WhatsApp policy
   - Can result in account ban

3. **Don't Overload**
   - Max 1-2 marketing messages per week
   - More frequent = higher block rate

4. **Don't Use Aggressive Language**
   - No misleading claims
   - No urgent/scarcity tactics
   - No shouty caps lock

5. **Don't Ignore Responses**
   - Respond to questions
   - Honor opt-out requests immediately
   - Monitor conversations

## Rate Limits

### Meta Cloud API
- **Tier 1** (New): 1,000 conversations/24 hours
- **Tier 2**: 10,000 conversations/24 hours
- **Tier 3**: 100,000 conversations/24 hours
- **Throughput**: ~80 messages/second

### Twilio
- Varies by account type
- Usually 1 message/second for trial
- Higher for paid accounts

## Troubleshooting

### Template Rejected

**Common reasons:**
- Misleading content
- Broken variables (use {{1}}, {{2}}, etc.)
- Policy violations
- Too many variables (max 1 in header, unlimited in body)

**Solution:**
- Review WhatsApp's template guidelines
- Simplify the message
- Remove aggressive language
- Resubmit after modifications

### Messages Not Delivering

**Check:**
1. Template is APPROVED
2. Contact has whatsappOptIn = true
3. Phone number is valid E.164 format
4. Contact hasn't blocked your number
5. WhatsApp Business Account is verified

### Webhook Not Working

**Verify:**
1. Webhook URL is publicly accessible (HTTPS)
2. Verify token matches configuration
3. Subscribed to correct events (messages, message_status)
4. Webhook endpoint returns 200 OK

### High Block Rate

**Causes:**
- Too many messages
- Irrelevant content
- No value provided
- Misleading templates

**Solutions:**
- Reduce frequency
- Segment better
- Improve content quality
- Honor opt-outs immediately

## Analytics & Metrics

### Campaign Metrics
```javascript
{
  "stats": {
    "totalContacts": 1000,
    "messagesSent": 950,
    "messagesDelivered": 940,
    "messagesRead": 920,
    "messagesFailed": 10
  },
  "rates": {
    "deliveryRate": 98.9,  // Excellent!
    "readRate": 97.9,      // Outstanding!
    "failureRate": 1.1     // Very good
  }
}
```

### Good Benchmarks
- **Delivery Rate**: > 95%
- **Read Rate**: > 90% (WhatsApp avg is 98%!)
- **Response Rate**: 10-40%
- **Block Rate**: < 2%

## Cost Comparison

### Meta Cloud API
- **Free Tier**: 1,000 conversations/month
- **After Free Tier**: $0.005-$0.09 per conversation (varies by country)
- **Marketing Conversations**: Higher rate

### Twilio
- **Pay-as-you-go**: $0.005 per message segment
- **No monthly fee**
- **Volume discounts available**

### ROI

WhatsApp typically achieves:
- **10-25% click-through rate** (vs 2-3% for email)
- **70-80% open rate within 1 hour**
- **98% total read rate**
- **Much higher engagement than email**

## Migration from Email

Already have email campaigns? Easy to add WhatsApp:

```javascript
// 1. Update contacts with phone numbers and opt-in
const contacts = await getEmailContacts();
for (const contact of contacts) {
  if (contact.hasWhatsAppConsent) {
    await updateContact(contact.id, {
      phone: contact.phone,
      whatsappOptIn: true
    });
  }
}

// 2. Create WhatsApp version of email template
// 3. Run both channels in parallel
// 4. Compare performance

// WhatsApp typically outperforms email by 3-10x!
```

## Security & Compliance

### Data Protection
- Phone numbers encrypted at rest
- Opt-in status tracked
- Audit trail for all messages
- GDPR compliant

### User Rights
- Right to opt-out (honored immediately)
- Right to data export
- Right to data deletion
- Transparent data usage

## Next Steps

1. **Choose Provider**: Meta Cloud API (easier) or Twilio
2. **Get Credentials**: Follow setup guide above
3. **Create Templates**: Submit 2-3 templates for approval
4. **Collect Opt-Ins**: Update contacts with phone numbers
5. **Test Campaign**: Send to small group first
6. **Scale Up**: Gradually increase volume
7. **Monitor Quality**: Keep block rate low
8. **Optimize**: Test different templates and timing

## Support Resources

- **Meta Cloud API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Twilio WhatsApp Docs**: https://www.twilio.com/docs/whatsapp
- **WhatsApp Business Policy**: https://www.whatsapp.com/legal/business-policy
- **Template Guidelines**: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines

## Conclusion

WhatsApp marketing is incredibly powerful when done right:
- ✅ 98% read rate (vs 20% for email)
- ✅ High engagement and response rates
- ✅ Cost-effective at scale
- ✅ Trusted by users

Start small, follow best practices, and watch your engagement soar! 🚀
