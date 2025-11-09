export interface SocialMediaService {
  publish(accessToken: string, accessSecret: string | null, data: PostData): Promise<PostResult>;
  delete(accessToken: string, accessSecret: string | null, postId: string): Promise<boolean>;
  getMetrics(accessToken: string, accessSecret: string | null, postId: string): Promise<any>;
  reply(accessToken: string, accessSecret: string | null, postId: string, content: string): Promise<PostResult>;
}

export interface PostData {
  content: string;
  mediaUrls?: string[];
  metadata?: any;
}

export interface PostResult {
  success: boolean;
  platformPostId?: string;
  url?: string;
  error?: string;
}
