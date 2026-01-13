import { pool } from '../config/database.js';
import type { UserVocab, CreateUserVocabInput, VocabStatus } from '../types/index.js';

export class UserVocabModel {
  static async findByUserAndVocab(
    userId: string,
    vocabId: string
  ): Promise<UserVocab | null> {
    const { rows } = await pool.query<UserVocab>(
      'SELECT * FROM user_vocab WHERE user_id = $1 AND vocab_id = $2',
      [userId, vocabId]
    );
    return rows[0] || null;
  }

  static async create(input: CreateUserVocabInput): Promise<UserVocab> {
    const { rows } = await pool.query<UserVocab>(
      `INSERT INTO user_vocab (user_id, vocab_id, introduced_in_unit, introduced_in_lesson)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [input.user_id, input.vocab_id, input.introduced_in_unit, input.introduced_in_lesson]
    );
    return rows[0];
  }

  static async getOrCreate(input: CreateUserVocabInput): Promise<UserVocab> {
    const existing = await this.findByUserAndVocab(input.user_id, input.vocab_id);
    if (existing) return existing;
    return this.create(input);
  }

  static async getDueForReview(userId: string, limit: number = 10): Promise<UserVocab[]> {
    const { rows } = await pool.query<UserVocab>(
      `SELECT * FROM user_vocab
       WHERE user_id = $1
         AND status IN ('learning', 'reviewing')
         AND (next_review IS NULL OR next_review <= NOW())
       ORDER BY next_review ASC NULLS FIRST
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }

  static async getByStatus(userId: string, status: VocabStatus): Promise<UserVocab[]> {
    const { rows } = await pool.query<UserVocab>(
      `SELECT * FROM user_vocab WHERE user_id = $1 AND status = $2`,
      [userId, status]
    );
    return rows;
  }

  static async countByStatus(userId: string): Promise<Record<VocabStatus, number>> {
    const { rows } = await pool.query<{ status: VocabStatus; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM user_vocab
       WHERE user_id = $1
       GROUP BY status`,
      [userId]
    );

    const result: Record<VocabStatus, number> = {
      new: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
    };

    for (const row of rows) {
      result[row.status] = parseInt(row.count, 10);
    }

    return result;
  }

  static async recordReview(
    id: string,
    quality: number // 0-3: 0=fail, 1=with help, 2=hesitant, 3=correct
  ): Promise<UserVocab | null> {
    // SM-2 algorithm implementation
    const vocab = await pool.query<UserVocab>('SELECT * FROM user_vocab WHERE id = $1', [
      id,
    ]);
    if (!vocab.rows[0]) return null;

    const current = vocab.rows[0];
    let { ease_factor, interval_days, repetitions } = current;
    let status: VocabStatus = current.status;

    if (quality < 2) {
      // Failed - reset
      repetitions = 0;
      interval_days = 1;
    } else {
      // Success - extend interval
      if (repetitions === 0) {
        interval_days = 1;
      } else if (repetitions === 1) {
        interval_days = 3;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetitions += 1;
    }

    // Adjust ease factor
    ease_factor = Math.max(1.3, ease_factor + (0.1 - (3 - quality) * 0.2));

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval_days);

    // Update mastery score and status
    const totalAttempts =
      current.times_produced_correctly +
      current.times_produced_with_help +
      current.times_corrected;
    const accuracy =
      totalAttempts > 0 ? current.times_produced_correctly / (totalAttempts + 1) : 0;
    const repScore = Math.min(1, repetitions / 8);
    const mastery_score = accuracy * 0.4 + repScore * 0.3 + 0.3;

    if (mastery_score > 0.85 && repetitions >= 5) {
      status = 'mastered';
    } else if (repetitions >= 1) {
      status = 'reviewing';
    } else {
      status = 'learning';
    }

    // Update tracking fields based on quality
    const updateField =
      quality === 3
        ? 'times_produced_correctly'
        : quality >= 1
          ? 'times_produced_with_help'
          : 'times_corrected';

    const { rows } = await pool.query<UserVocab>(
      `UPDATE user_vocab SET
         ease_factor = $2,
         interval_days = $3,
         repetitions = $4,
         next_review = $5,
         times_seen = times_seen + 1,
         ${updateField} = ${updateField} + 1,
         last_seen = NOW(),
         mastery_score = $6,
         status = $7
       WHERE id = $1
       RETURNING *`,
      [id, ease_factor, interval_days, repetitions, nextReview, mastery_score, status]
    );

    return rows[0] || null;
  }

  static async getTotalLearned(userId: string): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_vocab WHERE user_id = $1`,
      [userId]
    );
    return parseInt(rows[0].count, 10);
  }

  static async getTotalMastered(userId: string): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_vocab WHERE user_id = $1 AND status = 'mastered'`,
      [userId]
    );
    return parseInt(rows[0].count, 10);
  }
}
