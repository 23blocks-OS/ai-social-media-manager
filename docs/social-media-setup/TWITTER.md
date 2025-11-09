# Twitter/X API Setup Guide

This guide will help you set up Twitter API access for the AI Social Media Manager.

## Prerequisites

- A Twitter/X account
- Access to Twitter Developer Portal

## Step-by-Step Setup

### 1. Create a Twitter Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account
3. Apply for a developer account
4. Fill out the application form:
   - **What is your intended use?** Select "Making a bot" or "Building tools for Twitter users"
   - Describe your use case (social media management tool)
   - Agree to the terms and submit

5. Wait for approval (usually instant for basic access)

### 2. Create a New App

1. Once approved, go to the Developer Portal
2. Click **"Create App"** or **"+ Create Project"**
3. Fill in the app details:
   - **App Name**: Choose a unique name (e.g., "My Social Media Manager")
   - **Description**: Describe your app
   - **Website**: Your website URL (can use http://localhost:3000 for development)

### 3. Configure App Settings

1. Navigate to your app's settings
2. Click on **"Keys and tokens"** tab
3. Generate the following credentials:

#### API Keys
- **API Key** (Consumer Key)
- **API Secret** (Consumer Secret)

Click **"Generate"** to create these keys. **Save them immediately** as you won't be able to see them again.

#### Access Tokens
- Click **"Generate"** under "Access Token and Secret"
- **Access Token**
- **Access Token Secret**

Save these as well.

#### Bearer Token
- You'll also see a **Bearer Token** - save this too

### 4. Set Up OAuth 2.0 (for user authentication)

1. In your app settings, go to **"User authentication settings"**
2. Click **"Set up"**
3. Configure OAuth 2.0:
   - **App permissions**: Read and write (and Direct Messages if needed)
   - **Type of App**: Web App
   - **Callback URLs**:
     - Development: `http://localhost:3001/api/auth/twitter/callback`
     - Production: `https://your-domain.com/api/auth/twitter/callback`
   - **Website URL**: Your application URL

4. Click **"Save"**
5. You'll receive:
   - **Client ID**
   - **Client Secret**

### 5. Enable Twitter API v2

1. Make sure your app has access to Twitter API v2 (Free tier includes):
   - 1,500 Tweets/month (App)
   - Read and write access
   - Tweet posting
   - Media upload

### 6. Add Credentials to Your Application

Add these to your `.env` file:

```env
# Twitter API v1.1
TWITTER_API_KEY=your-api-key-here
TWITTER_API_SECRET=your-api-secret-here
TWITTER_BEARER_TOKEN=your-bearer-token-here

# Twitter OAuth 2.0 (for user authentication)
TWITTER_CLIENT_ID=your-client-id-here
TWITTER_CLIENT_SECRET=your-client-secret-here
TWITTER_CALLBACK_URL=http://localhost:3001/api/auth/twitter/callback
```

## API Limits (Free Tier)

- **Posts**: 1,500 Tweets/month
- **Rate Limits**:
  - 50 requests per 15 minutes (user context)
  - 300 requests per 15 minutes (app context)
- **Tweet Length**: 280 characters
- **Media**: Up to 4 images or 1 video per tweet

## Elevated Access (Optional)

For higher limits:

1. Apply for **Elevated Access** in the Developer Portal
2. Provide more detailed use case information
3. Wait for approval (usually 1-3 days)

Elevated access provides:
- 2,000,000 Tweets/month
- Higher rate limits
- Access to more endpoints

## Testing Your Integration

1. Start your backend server
2. Use the Twitter integration in your app
3. Connect a Twitter account through OAuth
4. Try posting a test tweet

## Troubleshooting

### Error: "Could not authenticate you"
- Check that your API keys are correct
- Ensure you're using the right authentication method (OAuth 1.0a vs OAuth 2.0)

### Error: "Rate limit exceeded"
- You've hit the free tier limits
- Wait 15 minutes or apply for elevated access

### Error: "Callback URL mismatch"
- Ensure the callback URL in your app settings matches your `.env` file
- Include http:// or https:// protocol

### Error: "You currently have Essential access"
- Some endpoints require Elevated or Academic access
- Apply for elevated access if needed

## Additional Resources

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Twitter API v2 Overview](https://developer.twitter.com/en/docs/twitter-api/getting-started/about-twitter-api)
- [Authentication Guide](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

## Security Best Practices

1. **Never commit** API keys to version control
2. Use **environment variables** for all credentials
3. Rotate keys regularly
4. Use different apps for development and production
5. Enable **IP whitelisting** if available
6. Monitor your app's usage in the Developer Portal

## Next Steps

After setup:
1. Test posting a tweet through the API
2. Set up webhooks for real-time updates (optional)
3. Configure auto-reply and AI features in the app
