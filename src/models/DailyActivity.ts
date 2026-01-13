import { pool } from '../config/database.js';

export interface DailyActivity {
  id: string;
  user_id: string;
  date: Date;
  messages_sent: number;
  messages_received: number;
  lessons_completed: number;
  vocab_introduced: string[];
  vocab_reviewed: string[];
  vocab_mastered: string[];
  errors_made: number;
  errors_corrected: number;
  xp_earned: number;
  streak_counted: boolean;
  summary_sent: boolean;
}

export class DailyActivityModel {
  static async getOrCreate(userId: string, date: Date): Promise<DailyActivity> {
    const dateStr = date.toISOString().split('T')[0];

    // Try to find existing
    const { rows: existing } = await pool.query<DailyActivity>(
      'SELECT * FROM daily_activity WHERE user_id = $1 AND date = $2',
      [userId, dateStr]
    );

    if (existing[0]) return existing[0];

    // Create new
    const { rows } = await pool.query<DailyActivity>(
      `INSERT INTO daily_activity (user_id, date)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, dateStr]
    );
    return rows[0];
  }

  static async incrementMessages(
    userId: string,
    type: 'sent' | 'received'
  ): Promise<void> {
    const activity = await this.getOrCreate(userId, new Date());
    const column = type === 'sent' ? 'messages_sent' : 'messages_received';

    await pool.query(
      `UPDATE daily_activity SET ${column} = ${column} + 1 WHERE id = $1`,
      [activity.id]
    );
  }

  static async incrementLessons(userId: string): Promise<void> {
    const activity = await this.getOrCreate(userId, new Date());
    await pool.query(
      `UPDATE daily_activity SET lessons_completed = lessons_completed + 1 WHERE id = $1`,
      [activity.id]
    );
  }

  static async addXP(userId: string, xp: number): Promise<void> {
    const activity = await this.getOrCreate(userId, new Date());
    await pool.query(
      `UPDATE daily_activity SET xp_earned = xp_earned + $2 WHERE id = $1`,
      [activity.id, xp]
    );
  }

  static async markStreakCounted(userId: string): Promise<void> {
    const activity = await this.getOrCreate(userId, new Date());
    await pool.query(
      `UPDATE daily_activity SET streak_counted = true WHERE id = $1`,
      [activity.id]
    );
  }

  static async getWeeklyStats(userId: string): Promise<DailyActivity[]> {
    const { rows } = await pool.query<DailyActivity>(
      `SELECT * FROM daily_activity
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY date DESC`,
      [userId]
    );
    return rows;
  }

  static async getActivityForDate(
    userId: string,
    date: Date
  ): Promise<DailyActivity | null> {
    const dateStr = date.toISOString().split('T')[0];
    const { rows } = await pool.query<DailyActivity>(
      'SELECT * FROM daily_activity WHERE user_id = $1 AND date = $2',
      [userId, dateStr]
    );
    return rows[0] || null;
  }

  static async hadActivityYesterday(userId: string): Promise<boolean> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const activity = await this.getActivityForDate(userId, yesterday);
    return activity !== null && activity.messages_sent > 0;
  }
}
