# LinkedIn API Setup Guide

This guide will help you set up LinkedIn API access for the AI Social Media Manager.

## Prerequisites

- A LinkedIn account
- A LinkedIn Company Page (for posting to pages)

## Step-by-Step Setup

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **"Create app"** in the top right
3. Fill in the required information:
   - **App name**: Your application name
   - **LinkedIn Page**: Select your company page (or create one)
   - **Privacy policy URL**: Your privacy policy
   - **App logo**: Upload a logo (minimum 100x100px)
   - **Legal agreement**: Check the box

4. Click **"Create app"**

### 2. Get API Credentials

After creating your app:

1. Go to the **"Auth"** tab
2. You'll find:
   - **Client ID**: Your `LINKEDIN_CLIENT_ID`
   - **Client Secret**: Click "Show" to reveal, this is your `LINKEDIN_CLIENT_SECRET`

3. **Important**: Save these credentials securely!

### 3. Configure OAuth 2.0 Settings

1. Still in the **"Auth"** tab, scroll to **"OAuth 2.0 settings"**
2. Add Redirect URLs:
   ```
   http://localhost:3001/api/auth/linkedin/callback
   https://your-domain.com/api/auth/linkedin/callback
   ```
3. Click **"Update"**

### 4. Request API Access

LinkedIn requires verification for API access:

1. Go to the **"Products"** tab
2. Request access to:
   - **Share on LinkedIn** - For posting content
   - **Sign In with LinkedIn** - For authentication

3. For each product:
   - Click **"Request access"** or **"Select"**
   - Fill out the required information
   - Explain your use case
   - Submit for review

4. Wait for approval (usually 1-3 business days)

### 5. Verify Your App (Required)

LinkedIn requires app verification:

1. Go to the **"Settings"** tab
2. Complete the verification process:
   - Verify your email
   - Verify your LinkedIn Page
   - Add company information

### 6. Understanding LinkedIn Permissions

After approval, you'll have access to:

#### Share on LinkedIn
- **r_liteprofile** - Read basic profile info
- **r_emailaddress** - Read email address
- **w_member_social** - Post on behalf of user
- **r_organization_social** - Read organization posts
- **w_organization_social** - Post on behalf of organization

### 7. Getting the Organization ID

To post to a company page, you need the Organization ID:

```bash
# Get organizations you can manage
curl -X GET 'https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'

# Response includes organization URN
# Example: urn:li:organization:123456
```

### 8. Add Credentials to Your Application

Add these to your `.env` file:

```env
LINKEDIN_CLIENT_ID=your-client-id-here
LINKEDIN_CLIENT_SECRET=your-client-secret-here
LINKEDIN_CALLBACK_URL=http://localhost:3001/api/auth/linkedin/callback
```

## API Usage

### Posting Text Content

```javascript
POST https://api.linkedin.com/v2/ugcPosts

Headers:
Authorization: Bearer {access_token}
Content-Type: application/json
X-Restli-Protocol-Version: 2.0.0

Body:
{
  "author": "urn:li:person:YOUR_PERSON_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Your post content here"
      },
      "shareMediaCategory": "NONE"
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

### Posting with Images

```javascript
{
  "author": "urn:li:person:YOUR_PERSON_ID",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "Check out this image!"
      },
      "shareMediaCategory": "IMAGE",
      "media": [
        {
          "status": "READY",
          "description": {
            "text": "Image description"
          },
          "media": "urn:li:digitalmediaAsset:MEDIA_ASSET_ID",
          "title": {
            "text": "Image title"
          }
        }
      ]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

## Content Requirements

### Text Posts
- **Max Length**: 3,000 characters (recommended: 150-300 for best engagement)
- **URLs**: Automatically parsed and previewed
- **Hashtags**: Supported with # symbol
- **Mentions**: Supported with @ symbol

### Image Posts
- **Format**: PNG, JPG, GIF
- **Size**: Max 10 MB
- **Dimensions**: Minimum 552 x 368 pixels
- **Recommended**: 1200 x 627 pixels
- **Max Images**: Up to 9 per post

### Video Posts
- **Format**: MP4
- **Size**: Max 200 MB (5 GB for company pages)
- **Duration**: 3 seconds to 10 minutes
- **Recommended**: 30-90 seconds

### Document Posts
- **Format**: PDF, DOC, DOCX, PPT, PPTX
- **Size**: Max 100 MB
- **Pages**: Max 300 pages

## API Limits

### Rate Limits
- **Throttle Limits**: Vary by endpoint and app
- **Daily Limits**:
  - Community Management API: 10,000 requests/day
  - Share API: 100 shares per person per day
  - Company Share: 25 shares per company per day

### Best Practices
- Implement exponential backoff
- Cache responses when possible
- Monitor rate limit headers

## Testing Your Integration

1. Start your backend server
2. Authenticate with LinkedIn OAuth
3. Get your person URN or organization URN
4. Create a test post
5. Verify it appears on your LinkedIn profile/page

## Troubleshooting

### Error: "Unauthorized - invalid credentials"
- Verify Client ID and Secret are correct
- Check that access token is valid
- Ensure token hasn't expired

### Error: "Insufficient permissions"
- Verify you've been granted "Share on LinkedIn" product
- Check OAuth scopes include `w_member_social`
- For company posts, need `w_organization_social`

### Error: "Invalid author URN"
- Use correct format: `urn:li:person:ID` or `urn:li:organization:ID`
- Verify you have permission to post as that entity

### Error: "Asset not found"
- For image/video posts, ensure media is uploaded first
- Use the correct media asset URN
- Wait for media processing to complete

### Error: "Rate limit exceeded"
- Implement request throttling
- Wait before retrying
- Check rate limit headers in response

## Media Upload Process

### 1. Register Upload

```javascript
POST https://api.linkedin.com/v2/assets?action=registerUpload

{
  "registerUploadRequest": {
    "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
    "owner": "urn:li:person:YOUR_PERSON_ID",
    "serviceRelationships": [
      {
        "relationshipType": "OWNER",
        "identifier": "urn:li:userGeneratedContent"
      }
    ]
  }
}
```

### 2. Upload Media

```javascript
PUT {uploadUrl from previous response}
Headers:
  Content-Type: application/octet-stream

Body: Binary image data
```

### 3. Use Asset URN in Post

Use the asset URN from step 1 in your post.

## LinkedIn Best Practices

### Posting
1. **Optimal Times**: Tuesday-Thursday, 8-10 AM and 5-6 PM
2. **Frequency**: 1-2 times per day maximum
3. **Content**: Professional, value-driven content
4. **Engagement**: Respond to comments promptly

### Content Strategy
- Share industry insights and thought leadership
- Use relevant hashtags (3-5 per post)
- Include visuals when possible
- Ask questions to drive engagement
- Tag relevant people and companies

### Analytics
- Track post impressions and engagement
- Monitor follower demographics
- Analyze click-through rates
- Test different content types

## Advanced Features

### Hashtag Suggestions
```javascript
GET https://api.linkedin.com/v2/hashtagSuggestions?q=textToHash&text=YOUR_TEXT
```

### Get Post Analytics
```javascript
GET https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:YOUR_ORG_ID
```

### Company Page Posts
- Require `w_organization_social` permission
- Use organization URN as author
- Can schedule posts
- Access to detailed analytics

## Additional Resources

- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [Share API](https://docs.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api)
- [OAuth 2.0](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Marketing Developer Platform](https://docs.microsoft.com/en-us/linkedin/marketing/)

## Security Best Practices

1. Never expose Client Secret in client-side code
2. Use HTTPS for all API calls
3. Store access tokens securely (encrypted)
4. Implement token refresh logic
5. Monitor API usage
6. Use separate apps for dev and production

## Migration from v1 to v2

If migrating from LinkedIn API v1:

1. Update all endpoints to v2
2. Use UGC Posts API instead of legacy Share API
3. Update authentication flow
4. Test thoroughly before production

## Next Steps

1. Create and verify your LinkedIn app
2. Request and get approved for API access
3. Implement OAuth authentication
4. Test posting functionality
5. Set up content scheduling
6. Enable AI content generation
7. Monitor analytics and engagement
