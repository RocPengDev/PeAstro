/**
 * Global site configuration and constants
 * 
 * This file contains all the global configuration values that can be imported
 * and used throughout the site. Modify these values to customize your blog.
 */

// ===== Site Metadata =====
export const SITE_TITLE = "PeAstro Blog";
export const SITE_DESCRIPTION = "基于Astro创建的博客系统，自动同步部署到Cloudflare";
export const SITE_COPYRIGHT = "PeAstro";

// ===== Site Configuration =====
export const SITE_CONFIG = {
  /**
   * Default theme for new visitors
   * @type {'light' | 'dark'}
   * @default 'dark'
   */
  DEFAULT_THEME: 'dark' as const,
  
  /**
   * Number of posts to display per page in pagination
   * @type {number}
   * @default 20
   */
  POSTS_PER_PAGE: 20,
  
  /**
   * Number of featured posts to display on homepage
   * These posts will be shown as cards with enhanced styling
   * @type {number}
   * @default 3
   */
  FEATURED_POSTS_COUNT: 3,
  
  /**
   * Maximum number of tags to display per post in lists
   * Additional tags will be hidden to maintain clean UI
   * @type {number}
   * @default 2
   */
  MAX_TAGS_DISPLAY: 2,
} as const;
