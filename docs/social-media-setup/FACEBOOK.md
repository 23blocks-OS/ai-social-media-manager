# Facebook API Setup Guide

This guide will help you set up Facebook API access for the AI Social Media Manager to post on Facebook Pages.

## Prerequisites

- A Facebook account
- A Facebook Page (you must be the admin)

## Step-by-Step Setup

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Choose app type: **"Business"** or **"Consumer"**
5. Fill in the details:
   - **App Name**: Your app name (e.g., "My Social Media Manager")
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one (optional)

6. Click **"Create App"**

### 2. Add Facebook Login Product

1. In your app dashboard, find **"Add Product"** section
2. Click **"Set Up"** on **Facebook Login**
3. Choose **"Web"** as platform
4. Enter your Site URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

### 3. Configure Facebook Login Settings

1. Go to **Facebook Login** → **Settings** in the left sidebar
2. Add OAuth Redirect URIs:
   ```
   http://localhost:3001/api/auth/facebook/callback
   https://your-domain.com/api/auth/facebook/callback
   ```
3. Enable **"Client OAuth Login"**
4. Enable **"Web OAuth Login"**
5. Save changes

### 4. Get App Credentials

1. Go to **Settings** → **Basic** in the left sidebar
2. You'll find:
   - **App ID**: This is your `FACEBOOK_APP_ID`
   - **App Secret**: Click "Show" to reveal your `FACEBOOK_APP_SECRET`

3. **Important**: Save these credentials securely!

### 5. Add Required Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request the following permissions:
   - `pages_show_list` - To get list of pages
   - `pages_read_engagement` - To read page content
   - `pages_manage_posts` - To create posts
   - `pages_manage_engagement` - To manage comments and reactions
   - `pages_read_user_content` - To read user-generated content

3. Each permission requires review and approval from Facebook

### 6. For Development and Testing

During development, you can use **Development Mode**:

1. Your app starts in Development Mode
2. Add test users or developers in **Roles** → **Roles**
3. Only these users can authorize the app

### 7. Get a Page Access Token

You'll need to get a long-lived page access token:

#### Method 1: Using Graph API Explorer

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Click **"Generate Access Token"**
4. Grant all requested permissions
5. Copy the User Access Token

To convert to a long-lived token:

```bash
curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

Then get the Page Access Token:

```bash
curl -X GET "https://graph.facebook.com/v19.0/me/accounts?access_token=YOUR_LONG_LIVED_USER_TOKEN"
```

#### Method 2: Through OAuth Flow (Recommended)

Implement OAuth in your app - the backend already handles this.

### 8. Add Credentials to Your Application

Add these to your `.env` file:

```env
FACEBOOK_APP_ID=your-app-id-here
FACEBOOK_APP_SECRET=your-app-secret-here
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback
```

### 9. Submit Your App for Review

For production use:

1. Complete the **App Review** process
2. Go to **App Review** → **Permissions and Features**
3. Submit each required permission for review
4. Provide:
   - Screencast showing the feature
   - Detailed use case
   - Privacy policy URL
   - Terms of service URL

5. Wait for approval (can take 3-7 days)

## API Limits

### Free Tier
- 200 API calls per hour per user
- Standard rate limits apply

### Page Posting Limits
- Varies by page size and engagement
- Typically 50-100 posts per day

## Posting Requirements

1. **Page Admin**: You must be an admin of the page
2. **Page Access Token**: Required for posting
3. **Content Guidelines**: Follow Facebook Community Standards
4. **Image Requirements**:
   - Minimum: 200 x 200 pixels
   - Recommended: 1200 x 630 pixels
   - Max file size: 8 MB

## Testing Your Integration

1. Start your backend server
2. Connect your Facebook Page through OAuth
3. Try posting a test post
4. Verify it appears on your page

## Troubleshooting

### Error: "Invalid OAuth access token"
- Token may have expired (get a new long-lived token)
- Ensure you're using the Page Access Token, not User Access Token

### Error: "Insufficient permissions"
- Check that you've granted all required permissions
- Ensure permissions are approved in App Review

### Error: "Cannot post to this page"
- Verify you're an admin of the page
- Check page settings allow API posting

### Error: "Rate limit exceeded"
- Wait before making more requests
- Implement exponential backoff

## Graph API Versions

- Current version: v19.0
- Update your API calls to use the latest version
- Old versions are deprecated after 2 years

## Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Pages API](https://developers.facebook.com/docs/pages-api)
- [Publishing Posts](https://developers.facebook.com/docs/pages/publishing)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review)

## Security Best Practices

1. Never expose App Secret in client-side code
2. Use HTTPS for all OAuth callbacks
3. Store tokens securely (encrypted in database)
4. Rotate tokens regularly
5. Monitor API usage in App Dashboard
6. Use separate apps for development and production

## Next Steps

1. Connect your Facebook Page
2. Test posting functionality
3. Set up scheduled posting
4. Enable AI-powered content generation
5. Monitor engagement analytics
