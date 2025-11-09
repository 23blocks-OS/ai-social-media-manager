# Twitter (X) API Setup Guide

This guide will walk you through setting up Twitter API access for the AI Social Media Manager platform.

## Prerequisites

- A Twitter/X account
- Access to the Twitter Developer Portal

## Step 1: Create a Developer Account

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Sign up" or "Apply" if you don't have a developer account
3. Complete the application form:
   - Select your use case (e.g., "Making a bot")
   - Provide a description of how you'll use the API
   - Agree to the terms

4. Wait for approval (usually instant for basic access)

## Step 2: Create a New Project and App

1. Once approved, click "Create Project"
2. Name your project (e.g., "AI Social Media Manager")
3. Select your use case
4. Provide a project description
5. Create an App within the project
6. Name your app (e.g., "AI Social Manager Bot")

## Step 3: Configure Authentication Settings

1. Navigate to your app's settings
2. Click on "User authentication settings"
3. Click "Set up"
4. Configure OAuth 2.0:
   - **App permissions**: Read and write
   - **Type of App**: Web App
   - **Callback URL**: `http://localhost:3001/api/auth/twitter/callback` (for development)
   - **Website URL**: `http://localhost:3000` (for development)

5. Save your changes

## Step 4: Get Your API Keys

1. Go to the "Keys and tokens" tab
2. You'll find:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)
   - **Bearer Token**

3. Click "Generate" under "Access Token and Secret" to get:
   - **Access Token**
   - **Access Token Secret**

4. **IMPORTANT**: Save these keys securely. You won't be able to see them again!

## Step 5: Add Keys to Your Application

### For Backend Configuration

Add to `backend/.env`:

```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

### For User Authentication (OAuth)

When users connect their Twitter accounts in the app:
1. They'll be redirected to Twitter to authorize
2. The app will receive OAuth tokens
3. These tokens are stored encrypted in the database

## Step 6: Request Elevated Access (Optional)

For production use, you may need Elevated access:

1. Go to the Developer Portal
2. Click "Products" → "Twitter API v2"
3. Apply for Elevated access
4. Provide detailed use case information
5. Wait for approval (usually 1-2 days)

### Elevated Access Benefits:
- Higher rate limits
- Access to more endpoints
- Better for production use

## API Rate Limits

### Essential Access (Free):
- **Tweet creation**: 1,500 posts per month per user
- **Read requests**: 10,000 per month

### Elevated Access (Free):
- **Tweet creation**: 3,000 posts per month per user
- **Read requests**: 2 million per month

### Premium Plans:
- Much higher limits
- More features
- Costs money

## Testing Your Setup

### Using the Platform

1. Log in to your AI Social Media Manager account
2. Go to "Accounts" → "Connect Account"
3. Select Twitter
4. You'll be redirected to Twitter to authorize
5. Once authorized, you can start posting!

### Manual Testing

```bash
# Test authentication
curl -X POST https://api.twitter.com/2/tweets \
  -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from AI Social Media Manager!"}'
```

## Common Issues & Solutions

### Issue: "Could not authenticate you"
**Solution**: Check that your API keys are correct and haven't expired

### Issue: "Forbidden"
**Solution**: Ensure your app has "Read and Write" permissions

### Issue: "Rate limit exceeded"
**Solution**:
- Wait for the rate limit to reset (15 minutes)
- Consider upgrading to Elevated access
- Implement proper rate limiting in your code

### Issue: "Callback URL mismatch"
**Solution**: Ensure the callback URL in Twitter Developer Portal matches your configuration

## Production Deployment

For production, update your OAuth settings:

1. **Callback URL**: `https://yourdomain.com/api/auth/twitter/callback`
2. **Website URL**: `https://yourdomain.com`
3. Use environment variables for keys:
   ```env
   TWITTER_API_KEY=your_production_api_key
   TWITTER_API_SECRET=your_production_api_secret
   TWITTER_BEARER_TOKEN=your_production_bearer_token
   ```

## Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** for security
4. **Monitor your usage** to avoid hitting rate limits
5. **Handle errors gracefully** with proper retry logic
6. **Respect Twitter's policies** and terms of service

## Additional Resources

- [Twitter API Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Twitter API v2 Guide](https://developer.twitter.com/en/docs/twitter-api/getting-started/about-twitter-api)
- [OAuth 2.0 Guide](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)

## Support

If you need help:
- [Twitter Developer Forums](https://twittercommunity.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/twitter-api)
- Our [Discord Community](#)
