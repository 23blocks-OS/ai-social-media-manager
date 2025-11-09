# Social Media API Setup Guides

This directory contains comprehensive guides for setting up API access to various social media platforms.

## Available Guides

1. **[Twitter/X Setup](./TWITTER.md)** - Complete guide for Twitter API v2
2. **[Facebook Setup](./FACEBOOK.md)** - Facebook Graph API setup
3. **[Instagram Setup](./INSTAGRAM.md)** - Instagram Business API setup
4. **[LinkedIn Setup](./LINKEDIN.md)** - LinkedIn API configuration

## Quick Start

Each social media platform requires:

1. **Developer Account** - Create a developer account on the platform
2. **App Creation** - Create an application to get API credentials
3. **API Keys** - Obtain API keys and secrets
4. **OAuth Setup** - Configure OAuth callback URLs
5. **Permissions** - Request and get approved for necessary permissions

## General Requirements

### All Platforms Need

- Active account on the social media platform
- Developer account registration
- App verification process
- API key management
- OAuth 2.0 configuration

### Common OAuth Callbacks

For development:
```
http://localhost:3001/api/auth/{platform}/callback
```

For production:
```
https://your-domain.com/api/auth/{platform}/callback
```

Replace `{platform}` with: `twitter`, `facebook`, `instagram`, or `linkedin`

## Environment Variables

After setting up each platform, add credentials to `.env`:

```env
# Twitter/X
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_BEARER_TOKEN=your-bearer-token
TWITTER_CLIENT_ID=your-client-id
TWITTER_CLIENT_SECRET=your-client-secret
TWITTER_CALLBACK_URL=http://localhost:3001/api/auth/twitter/callback

# Facebook
FACEBOOK_APP_ID=your-app-id
FACEBOOK_APP_SECRET=your-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3001/api/auth/facebook/callback

# Instagram
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_CALLBACK_URL=http://localhost:3001/api/auth/instagram/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:3001/api/auth/linkedin/callback
```

## Setup Order Recommendation

1. **Start with Twitter** - Easiest and fastest approval
2. **Then Facebook** - Required for Instagram
3. **Setup Instagram** - Requires Facebook Page connection
4. **Finally LinkedIn** - Takes 1-3 days for approval

## API Limits Summary

| Platform | Free Tier Posts/Month | Rate Limits | Notes |
|----------|----------------------|-------------|-------|
| Twitter | 1,500 | 50 req/15min | Elevated access: 2M/month |
| Facebook | Unlimited* | 200 req/hour | *Subject to page limits |
| Instagram | 25/day | 200 req/hour | Business account required |
| LinkedIn | 100/day (personal) | 10K req/day | 25/day for company pages |

## Common Issues

### "Callback URL Mismatch"
- Ensure exact match between app settings and .env file
- Include protocol (http:// or https://)
- No trailing slash

### "Invalid Credentials"
- Double-check API keys are correct
- Verify you're using the right authentication method
- Check if credentials have expired

### "Insufficient Permissions"
- Verify all required permissions are granted
- Check if app review is needed
- Ensure user has authorized the app

### "Rate Limit Exceeded"
- Implement exponential backoff
- Cache responses when possible
- Upgrade to higher tier if needed

## Best Practices

### Security
1. Never commit API keys to version control
2. Use environment variables for all credentials
3. Rotate keys regularly
4. Use different apps for dev and production
5. Enable IP whitelisting where available

### Development
1. Use test accounts for development
2. Implement proper error handling
3. Add retry logic for failed requests
4. Monitor API usage
5. Keep SDK/libraries updated

### Content
1. Follow each platform's content guidelines
2. Respect rate limits
3. Optimize media before uploading
4. Use appropriate hashtags
5. Engage with your audience

## Testing Your Setup

After configuring each platform:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Test OAuth flow:
   ```
   http://localhost:3001/api/auth/{platform}
   ```

3. Try posting test content through the API

4. Verify posts appear on the platform

## Getting Help

If you encounter issues:

1. Check the specific platform's documentation
2. Review error messages carefully
3. Verify API keys and permissions
4. Check rate limits and quotas
5. Review our troubleshooting sections
6. Open an issue on GitHub

## Additional Resources

### Official Documentation
- [Twitter API Docs](https://developer.twitter.com/en/docs)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Instagram API](https://developers.facebook.com/docs/instagram-api)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)

### Developer Communities
- Twitter Developer Community
- Facebook Developers Group
- Stack Overflow
- Reddit r/webdev

## Updates and Changes

Social media APIs change frequently. Check these guides regularly for updates:

- API version updates
- Permission changes
- Rate limit adjustments
- New features
- Deprecation notices

## Next Steps

1. Choose which platforms you want to integrate
2. Follow the setup guide for each platform
3. Add credentials to your `.env` file
4. Test the integration
5. Configure your posting strategy
6. Enable AI features
7. Start managing your social media!
