import axios from 'axios';
import { SocialMediaService, PostData, PostResult } from './base';
import logger from '../../utils/logger';

export class FacebookService implements SocialMediaService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  async publish(accessToken: string, accessSecret: string | null, data: PostData): Promise<PostResult> {
    try {
      const pageId = data.metadata?.pageId;
      if (!pageId) {
        throw new Error('Facebook Page ID is required');
      }

      const params: any = {
        message: data.content,
        access_token: accessToken
      };

      // Handle media
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        if (data.mediaUrls.length === 1) {
          // Single photo
          params.url = data.mediaUrls[0];
          const response = await axios.post(
            `${this.baseUrl}/${pageId}/photos`,
            params
          );
          return {
            success: true,
            platformPostId: response.data.id,
            url: `https://facebook.com/${response.data.id}`
          };
        } else {
          // Multiple photos - need to create album first
          logger.warn('Multiple photo upload not fully implemented');
        }
      }

      // Text-only post
      const response = await axios.post(
        `${this.baseUrl}/${pageId}/feed`,
        params
      );

      return {
        success: true,
        platformPostId: response.data.id,
        url: `https://facebook.com/${response.data.id}`
      };
    } catch (error: any) {
      logger.error('Facebook publish error:', error);
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
      logger.error('Facebook delete error:', error);
      return false;
    }
  }

  async getMetrics(accessToken: string, accessSecret: string | null, postId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${postId}`, {
        params: {
          fields: 'likes.summary(true),comments.summary(true),shares',
          access_token: accessToken
        }
      });

      return {
        likes: response.data.likes?.summary?.total_count || 0,
        comments: response.data.comments?.summary?.total_count || 0,
        shares: response.data.shares?.count || 0,
        views: 0 // Not available in basic API
      };
    } catch (error) {
      logger.error('Facebook metrics error:', error);
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
      logger.error('Facebook reply error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}
