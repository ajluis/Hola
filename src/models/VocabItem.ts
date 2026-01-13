import { pool } from '../config/database.js';
import type { VocabItem, Level } from '../types/index.js';

export class VocabItemModel {
  static async findById(id: string): Promise<VocabItem | null> {
    const { rows } = await pool.query<VocabItem>(
      'SELECT * FROM vocab_items WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async findByLevelAndUnit(level: Level, unit: number): Promise<VocabItem[]> {
    const { rows } = await pool.query<VocabItem>(
      `SELECT * FROM vocab_items
       WHERE level = $1 AND unit = $2
       ORDER BY sequence_order ASC`,
      [level, unit]
    );
    return rows;
  }

  static async findByCategory(category: string): Promise<VocabItem[]> {
    const { rows } = await pool.query<VocabItem>(
      `SELECT * FROM vocab_items
       WHERE category = $1
       ORDER BY level, unit, sequence_order`,
      [category]
    );
    return rows;
  }

  static async getNextInUnit(
    level: Level,
    unit: number,
    afterSequence: number
  ): Promise<VocabItem | null> {
    const { rows } = await pool.query<VocabItem>(
      `SELECT * FROM vocab_items
       WHERE level = $1 AND unit = $2 AND sequence_order > $3
       ORDER BY sequence_order ASC
       LIMIT 1`,
      [level, unit, afterSequence]
    );
    return rows[0] || null;
  }

  static async getFirstInUnit(level: Level, unit: number): Promise<VocabItem | null> {
    const { rows } = await pool.query<VocabItem>(
      `SELECT * FROM vocab_items
       WHERE level = $1 AND unit = $2
       ORDER BY sequence_order ASC
       LIMIT 1`,
      [level, unit]
    );
    return rows[0] || null;
  }

  static async countByLevelAndUnit(level: Level, unit: number): Promise<number> {
    const { rows } = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM vocab_items
       WHERE level = $1 AND unit = $2`,
      [level, unit]
    );
    return parseInt(rows[0].count, 10);
  }

  static async getRandomForReview(
    vocabIds: string[],
    limit: number = 5
  ): Promise<VocabItem[]> {
    if (vocabIds.length === 0) return [];

    const { rows } = await pool.query<VocabItem>(
      `SELECT * FROM vocab_items
       WHERE id = ANY($1)
       ORDER BY RANDOM()
       LIMIT $2`,
      [vocabIds, limit]
    );
    return rows;
  }
}
