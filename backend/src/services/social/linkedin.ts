import axios from 'axios';
import { SocialMediaService, PostData, PostResult } from './base';
import logger from '../../utils/logger';

export class LinkedInService implements SocialMediaService {
  private baseUrl = 'https://api.linkedin.com/v2';

  async publish(accessToken: string, accessSecret: string | null, data: PostData): Promise<PostResult> {
    try {
      const personUrn = data.metadata?.personUrn;
      if (!personUrn) {
        throw new Error('LinkedIn Person URN is required');
      }

      const postData: any = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: data.content
            },
            shareMediaCategory: data.mediaUrls && data.mediaUrls.length > 0
              ? 'IMAGE'
              : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // Add media if present
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        postData.specificContent['com.linkedin.ugc.ShareContent'].media =
          data.mediaUrls.map((url: string) => ({
            status: 'READY',
            media: url
          }));
      }

      const response = await axios.post(
        `${this.baseUrl}/ugcPosts`,
        postData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        platformPostId: response.data.id,
        url: `https://linkedin.com/feed/update/${response.data.id}`
      };
    } catch (error: any) {
      logger.error('LinkedIn publish error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async delete(accessToken: string, accessSecret: string | null, postId: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/ugcPosts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      return true;
    } catch (error) {
      logger.error('LinkedIn delete error:', error);
      return false;
    }
  }

  async getMetrics(accessToken: string, accessSecret: string | null, postId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/socialActions/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        likes: response.data.likesSummary?.totalLikes || 0,
        comments: response.data.commentsSummary?.totalComments || 0,
        shares: response.data.sharesSummary?.totalShares || 0,
        views: 0
      };
    } catch (error) {
      logger.error('LinkedIn metrics error:', error);
      return null;
    }
  }

  async reply(accessToken: string, accessSecret: string | null, postId: string, content: string): Promise<PostResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/socialActions/${postId}/comments`,
        {
          message: { text: content }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      return {
        success: true,
        platformPostId: response.data.id
      };
    } catch (error: any) {
      logger.error('LinkedIn reply error:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}
