# Instagram API Setup Guide

This guide will help you set up Instagram Graph API access for the AI Social Media Manager.

## Prerequisites

- An Instagram Business or Creator account
- A Facebook Page connected to your Instagram account
- A Facebook App (same as Facebook setup)

## Important Notes

1. Instagram API requires a **Facebook Page** connected to your **Instagram Business Account**
2. Personal Instagram accounts cannot use the API
3. You must convert to a Business or Creator account first

## Step-by-Step Setup

### 1. Convert to Instagram Business Account

1. Open Instagram mobile app
2. Go to **Settings** → **Account**
3. Tap **Switch to Professional Account**
4. Choose **Business** or **Creator**
5. Follow the setup steps

### 2. Connect Instagram to Facebook Page

1. In Instagram, go to **Settings** → **Account**
2. Tap **Linked Accounts** → **Facebook**
3. Log in to Facebook
4. Select the Facebook Page to link
5. Confirm the connection

Alternatively, from Facebook:
1. Go to your Facebook Page
2. Click **Settings** → **Instagram**
3. Click **Connect Account**
4. Log in to Instagram
5. Authorize the connection

### 3. Create/Use Facebook App

Follow the [Facebook API Setup Guide](./FACEBOOK.md) to create a Facebook App if you haven't already.

### 4. Add Instagram Graph API Product

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Click **"Add Product"**
4. Find **"Instagram Graph API"**
5. Click **"Set Up"**

### 5. Request Required Permissions

Go to **App Review** and request these permissions:

#### Essential Permissions
- `instagram_basic` - Read profile info
- `instagram_content_publish` - Publish posts
- `pages_show_list` - Get connected pages
- `pages_read_engagement` - Read page content

#### Optional Permissions
- `instagram_manage_comments` - Manage comments
- `instagram_manage_insights` - Get analytics

### 6. Get Instagram Business Account ID

You need to get your Instagram Business Account ID:

#### Using Graph API Explorer

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Generate an access token with required permissions
4. Make this request:
   ```
   GET /me/accounts
   ```
5. Find your Facebook Page ID from the response

6. Then get the Instagram Account ID:
   ```
   GET /{page-id}?fields=instagram_business_account
   ```

7. Save the `instagram_business_account` ID

### 7. Publishing Content via API

Instagram has specific requirements for publishing:

#### Image Posts

```javascript
// Step 1: Create Media Container
POST /{instagram-account-id}/media
{
  "image_url": "https://your-image-url.com/image.jpg",
  "caption": "Your caption here #hashtag"
}

// Response: { "id": "container-id" }

// Step 2: Publish Container
POST /{instagram-account-id}/media_publish
{
  "creation_id": "container-id"
}
```

#### Video Posts

```javascript
// Step 1: Create Video Container
POST /{instagram-account-id}/media
{
  "media_type": "VIDEO",
  "video_url": "https://your-video-url.com/video.mp4",
  "caption": "Your caption"
}

// Step 2: Wait for video processing (poll container status)
GET /{container-id}?fields=status_code

// Step 3: Publish when status_code is "FINISHED"
POST /{instagram-account-id}/media_publish
{
  "creation_id": "container-id"
}
```

### 8. Add Credentials to Your Application

Add these to your `.env` file:

```env
INSTAGRAM_APP_ID=your-facebook-app-id
INSTAGRAM_APP_SECRET=your-facebook-app-secret
INSTAGRAM_CALLBACK_URL=http://localhost:3001/api/auth/instagram/callback
```

## Content Requirements

### Images
- **Format**: JPG, PNG
- **Aspect Ratio**:
  - Square: 1:1 (1080 x 1080)
  - Landscape: 1.91:1 (1080 x 566)
  - Portrait: 4:5 (1080 x 1350)
- **File Size**: Max 8 MB
- **Minimum**: 320 pixels

### Videos
- **Format**: MP4, MOV
- **Duration**: 3-60 seconds (feed), up to 15 minutes (IGTV)
- **Aspect Ratio**: Same as images
- **File Size**: Max 100 MB
- **Frame Rate**: 30 FPS

### Captions
- **Max Length**: 2,200 characters
- **Hashtags**: Up to 30 per post
- **Mentions**: Supported with @username

### Carousel Posts
- 2-10 images/videos
- All items must have same aspect ratio

## API Limits

### Rate Limits
- 200 API calls per hour per user
- 25 posts per 24 hours per account

### Content Publishing
- Cannot publish Stories via API (yet)
- Cannot publish Reels via API (limited access)
- Can only publish to feed

## Testing Your Integration

1. Ensure Instagram Business Account is connected to Facebook Page
2. Get Instagram Account ID
3. Upload a test image to your server
4. Create media container
5. Publish the container
6. Check your Instagram profile

## Troubleshooting

### Error: "Instagram account is not linked"
- Go to Facebook Page settings
- Verify Instagram account is connected
- Reconnect if necessary

### Error: "Invalid Instagram ID"
- Double-check the Instagram Business Account ID
- Use Graph API Explorer to verify

### Error: "Image URL is not accessible"
- Image must be publicly accessible via HTTPS
- Cannot use localhost URLs
- Ensure image meets size/format requirements

### Error: "Media container creation failed"
- Check image/video format and size
- Verify URL is accessible
- Try with a different image

### Error: "Publishing failed - container not ready"
- For videos, wait for processing to complete
- Poll status_code until it's "FINISHED"
- Then publish

### Error: "Rate limit exceeded"
- Wait before making more requests
- Monitor your API usage
- Implement request throttling

## Limitations

### What You CAN Do
✅ Publish feed posts (images, videos, carousels)
✅ Get account insights and metrics
✅ Manage comments
✅ Get media information
✅ Get user information

### What You CANNOT Do
❌ Publish Stories (not available)
❌ Publish Reels (limited availability)
❌ Direct Messages via API
❌ Like posts
❌ Follow/unfollow users
❌ Access personal accounts

## Advanced Features

### Product Tagging
- Available for shopping accounts
- Requires Commerce Manager setup
- Can tag products in posts

### Hashtag Search
- Search for hashtags
- Get recent media for hashtags
- Analyze hashtag performance

### Insights
- Get post insights (reach, impressions, engagement)
- Account insights (follower demographics)
- Requires `instagram_manage_insights` permission

## Additional Resources

- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing)
- [Instagram Insights](https://developers.facebook.com/docs/instagram-api/guides/insights)
- [API Reference](https://developers.facebook.com/docs/instagram-api/reference)

## Best Practices

1. **Content Quality**: High-quality images perform better
2. **Posting Schedule**: Consistent posting times
3. **Engagement**: Respond to comments quickly
4. **Hashtags**: Use relevant, specific hashtags
5. **Captions**: Write engaging, conversational captions
6. **Stories**: Post manually (API doesn't support Stories)

## Next Steps

1. Convert to Instagram Business Account
2. Connect to Facebook Page
3. Get Instagram Account ID
4. Test publishing a photo
5. Set up scheduled posting
6. Enable AI content generation
7. Monitor insights and analytics
