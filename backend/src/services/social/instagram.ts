import axios from 'axios';
import { SocialMediaService, PostData, PostResult } from './base';
import logger from '../../utils/logger';

export class InstagramService implements SocialMediaService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  async publish(accessToken: string, accessSecret: string | null, data: PostData): Promise<PostResult> {
    try {
      const accountId = data.metadata?.accountId;
      if (!accountId) {
        throw new Error('Instagram Account ID is required');
      }

      if (!data.mediaUrls || data.mediaUrls.length === 0) {
        throw new Error('Instagram posts require at least one media file');
      }

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media`,
        {
          image_url: data.mediaUrls[0],
          caption: data.content,
          access_token: accessToken
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the container
      const publishResponse = await axios.post(
        `${this.baseUrl}/${accountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken
        }
      );

      return {
        success: true,
        platformPostId: publishResponse.data.id,
        url: `https://instagram.com/p/${publishResponse.data.id}`
      };
    } catch (error: any) {
      logger.error('Instagram publish error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  async delete(accessToken: string, accessSecret: string | null, postId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/${postId}`, {
        params: { access_token: accessToken }
      });
      return true;
    } catch (error) {
      logger.error('Instagram delete error:', error);
      return false;
    }
  }

  async getMetrics(accessToken: string, accessSecret: string | null, postId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${postId}`, {
        params: {
          fields: 'like_count,comments_count,insights.metric(engagement,impressions,reach)',
          access_token: accessToken
        }
      });

      return {
        likes: response.data.like_count || 0,
        comments: response.data.comments_count || 0,
        shares: 0,
        views: response.data.insights?.data?.[0]?.values?.[0]?.value || 0
      };
    } catch (error) {
      logger.error('Instagram metrics error:', error);
      return null;
    }
  }

  async reply(accessToken: string, accessSecret: string | null, postId: string, content: string): Promise<PostResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${postId}/comments`,
        {
          message: content,
          access_token: accessToken
        }
      );

      return {
        success: true,
        platformPostId: response.data.id
      };
    } catch (error: any) {
      logger.error('Instagram reply error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}
