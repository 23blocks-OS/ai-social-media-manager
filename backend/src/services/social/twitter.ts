import { TwitterApi } from 'twitter-api-v2';
import { SocialMediaService, PostData, PostResult } from './base';
import logger from '../../utils/logger';

export class TwitterService implements SocialMediaService {
  async publish(accessToken: string, accessSecret: string, data: PostData): Promise<PostResult> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      let mediaIds: string[] = [];

      // Upload media if present
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        for (const mediaUrl of data.mediaUrls) {
          // Download and upload media
          const mediaId = await this.uploadMedia(client, mediaUrl);
          mediaIds.push(mediaId);
        }
      }

      // Create tweet
      const tweet = await client.v2.tweet({
        text: data.content,
        ...(mediaIds.length > 0 && { media: { media_ids: mediaIds } })
      });

      return {
        success: true,
        platformPostId: tweet.data.id,
        url: `https://twitter.com/i/web/status/${tweet.data.id}`
      };
    } catch (error: any) {
      logger.error('Twitter publish error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(accessToken: string, accessSecret: string, postId: string): Promise<boolean> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      await client.v2.deleteTweet(postId);
      return true;
    } catch (error) {
      logger.error('Twitter delete error:', error);
      return false;
    }
  }

  async getMetrics(accessToken: string, accessSecret: string, postId: string): Promise<any> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      const tweet = await client.v2.singleTweet(postId, {
        'tweet.fields': ['public_metrics']
      });

      const metrics = tweet.data.public_metrics;

      return {
        likes: metrics?.like_count || 0,
        comments: metrics?.reply_count || 0,
        shares: metrics?.retweet_count || 0,
        views: metrics?.impression_count || 0,
      };
    } catch (error) {
      logger.error('Twitter metrics error:', error);
      return null;
    }
  }

  async reply(accessToken: string, accessSecret: string, postId: string, content: string): Promise<PostResult> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: accessToken,
        accessSecret: accessSecret,
      });

      const tweet = await client.v2.reply(content, postId);

      return {
        success: true,
        platformPostId: tweet.data.id,
        url: `https://twitter.com/i/web/status/${tweet.data.id}`
      };
    } catch (error: any) {
      logger.error('Twitter reply error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async uploadMedia(client: TwitterApi, mediaUrl: string): Promise<string> {
    // This is a simplified version. In production, you'd download the media first
    // and then upload it to Twitter
    // For now, we'll just return a placeholder
    logger.warn('Media upload not fully implemented');
    return '';
  }
}
