import { sql, isConnected } from '../database/db';

interface QueueItem {
  id: number;
  userId: number;
  priority: number;
  createdAt: Date;
}

export class QueueService {
  private static processing = new Set<number>();
  private static maxConcurrent = 3; // Bir vaqtda 3 ta video

  static async addToQueue(userId: number, generationId: number, isPremium: boolean): Promise<number> {
    try {
      if (!isConnected) return 0;

      const priority = isPremium ? 1 : 0; // Premium yuqori prioritet

      await sql`
        UPDATE generations
        SET queue_position = (
          SELECT COALESCE(MAX(queue_position), 0) + 1
          FROM generations
          WHERE status = 'pending'
        )
        WHERE id = ${generationId}
      `;

      const result = await sql`
        SELECT queue_position FROM generations WHERE id = ${generationId}
      `;

      return result[0]?.queue_position || 0;
    } catch (error) {
      console.debug('Queue add error:', (error as any).message);
      return 0;
    }
  }

  static async getQueuePosition(generationId: number): Promise<number> {
    try {
      if (!isConnected) return 0;

      const result = await sql`
        SELECT 
          COUNT(*) as position
        FROM generations
        WHERE status = 'pending' 
          AND queue_position < (
            SELECT queue_position FROM generations WHERE id = ${generationId}
          )
      `;

      return parseInt(result[0]?.position || '0');
    } catch (error) {
      console.debug('Queue position error:', (error as any).message);
      return 0;
    }
  }

  static async getNextInQueue(): Promise<number | null> {
    try {
      if (!isConnected) return null;
      if (this.processing.size >= this.maxConcurrent) {
        return null;
      }

      const result = await sql`
        SELECT id FROM generations
        WHERE status = 'pending'
        ORDER BY queue_position ASC
        LIMIT 1
      `;

      if (result.length === 0) return null;

      const generationId = result[0].id;
      this.processing.add(generationId);

      await sql`
        UPDATE generations
        SET status = 'processing'
        WHERE id = ${generationId}
      `;

      return generationId;
    } catch (error) {
      console.debug('Get next queue error:', (error as any).message);
      return null;
    }
  }

  static async completeProcessing(generationId: number) {
    this.processing.delete(generationId);
  }

  static getQueueStats() {
    return {
      processing: this.processing.size,
      maxConcurrent: this.maxConcurrent,
      available: this.maxConcurrent - this.processing.size,
    };
  }
}
