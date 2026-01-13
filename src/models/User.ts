import { pool } from '../config/database.js';
import type { User, CreateUserInput, UpdateUserInput } from '../types/user.types.js';

export class UserModel {
  static async findByPhone(phoneNumber: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      'SELECT * FROM users WHERE phone_number = $1',
      [phoneNumber]
    );
    return rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  static async create(input: CreateUserInput): Promise<User> {
    const { rows } = await pool.query<User>(
      `INSERT INTO users (phone_number)
       VALUES ($1)
       RETURNING *`,
      [input.phone_number]
    );
    return rows[0];
  }

  static async update(id: string, input: UpdateUserInput): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  static async updateByPhone(
    phoneNumber: string,
    input: UpdateUserInput
  ): Promise<User | null> {
    const user = await this.findByPhone(phoneNumber);
    if (!user) return null;
    return this.update(user.id, input);
  }

  static async incrementOnboardingStep(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET onboarding_step = onboarding_step + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }

  static async completeOnboarding(id: string): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET onboarding_completed = true, onboarding_step = 8, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }

  static async addXP(id: string, xp: number): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET xp_total = xp_total + $2,
           xp_current_level = xp_current_level + $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, xp]
    );
    return rows[0] || null;
  }

  static async updateStreak(id: string, streakDays: number): Promise<User | null> {
    const { rows } = await pool.query<User>(
      `UPDATE users
       SET streak_days = $2,
           streak_last_active = CURRENT_DATE,
           longest_streak = GREATEST(longest_streak, $2),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, streakDays]
    );
    return rows[0] || null;
  }

  static async incrementMessageCount(
    id: string,
    type: 'sent' | 'received'
  ): Promise<void> {
    const column = type === 'sent' ? 'total_messages_sent' : 'total_messages_received';
    await pool.query(
      `UPDATE users SET ${column} = ${column} + 1, last_message_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  static async getUsersDueForLesson(time: string): Promise<User[]> {
    const { rows } = await pool.query<User>(
      `SELECT * FROM users
       WHERE onboarding_completed = true
         AND lesson_time_morning = $1
         AND (streak_last_active IS NULL OR streak_last_active < CURRENT_DATE)`,
      [time]
    );
    return rows;
  }
}
