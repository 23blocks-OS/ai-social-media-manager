import { Platform } from '@prisma/client';
import { TwitterService } from './twitter';
import { FacebookService } from './facebook';
import { InstagramService } from './instagram';
import { LinkedInService } from './linkedin';
import { SocialMediaService } from './base';

export class SocialMediaManager {
  private services: Map<Platform, SocialMediaService>;

  constructor() {
    this.services = new Map();
    this.services.set(Platform.TWITTER, new TwitterService());
    this.services.set(Platform.FACEBOOK, new FacebookService());
    this.services.set(Platform.INSTAGRAM, new InstagramService());
    this.services.set(Platform.LINKEDIN, new LinkedInService());
    // TikTok service would be added here
  }

  getService(platform: Platform): SocialMediaService {
    const service = this.services.get(platform);
    if (!service) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    return service;
  }
}

export default SocialMediaManager;
