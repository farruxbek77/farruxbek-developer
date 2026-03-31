import { sql, isConnected } from '../database/db';

export class AnalyticsService {
  static async trackEvent(
    userId: number,
    eventType: string,
    metadata?: Record<string, any>
  ) {
    try {
      if (!isConnected) return; // Skip if database not connected

      await sql`
        INSERT INTO analytics_events (user_id, event_type, metadata)
        VALUES (${userId}, ${eventType}, ${JSON.stringify(metadata || {})})
      `;
    } catch (error) {
      // Silently ignore database errors
      console.debug('Analytics tracking error:', (error as any).message);
    }
  }

  static async getDailyStats() {
    try {
      if (!isConnected) {
        return { active_users: 0, total_generations: 0, successful: 0, failed: 0 };
      }

      const result = await sql`
        SELECT 
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_generations,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM generations
        WHERE created_at >= CURRENT_DATE
      `;

      return result[0] || { active_users: 0, total_generations: 0, successful: 0, failed: 0 };
    } catch (error) {
      console.debug('Daily stats error:', (error as any).message);
      return { active_users: 0, total_generations: 0, successful: 0, failed: 0 };
    }
  }

  static async getUserStats(userId: number) {
    try {
      if (!isConnected) {
        return { total_videos: 0, today_videos: 0, first_video: null, last_video: null };
      }

      const result = await sql`
        SELECT 
          COUNT(*) as total_videos,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_videos,
          MIN(created_at) as first_video,
          MAX(created_at) as last_video
        FROM generations
        WHERE user_id = ${userId} AND status = 'completed'
      `;

      return result[0] || { total_videos: 0, today_videos: 0, first_video: null, last_video: null };
    } catch (error) {
      console.debug('User stats error:', (error as any).message);
      return { total_videos: 0, today_videos: 0, first_video: null, last_video: null };
    }
  }

  static async getTopUsers(limit: number = 10) {
    try {
      if (!isConnected) return [];

      const result = await sql`
        SELECT 
          u.id,
          u.username,
          u.first_name,
          COUNT(g.id) as video_count,
          u.is_premium
        FROM users u
        LEFT JOIN generations g ON u.id = g.user_id AND g.status = 'completed'
        GROUP BY u.id, u.username, u.first_name, u.is_premium
        ORDER BY video_count DESC
        LIMIT ${limit}
      `;

      return result || [];
    } catch (error) {
      console.debug('Top users error:', (error as any).message);
      return [];
    }
  }

  static async getRevenueStats() {
    try {
      if (!isConnected) {
        return { premium_users: 0, total_users: 0, estimated_revenue: 0 };
      }

      const result = await sql`
        SELECT 
          COUNT(CASE WHEN is_premium = true THEN 1 END) as premium_users,
          COUNT(*) as total_users,
          SUM(CASE WHEN is_premium = true THEN 2.99 ELSE 0 END) as estimated_revenue
        FROM users
      `;

      return result[0] || { premium_users: 0, total_users: 0, estimated_revenue: 0 };
    } catch (error) {
      console.debug('Revenue stats error:', (error as any).message);
      return { premium_users: 0, total_users: 0, estimated_revenue: 0 };
    }
  }
}
