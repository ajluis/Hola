import { pool } from '../config/database.js';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ErrorMade {
  user_said: string;
  correction: string;
  concept?: string;
}

export interface ConversationSession {
  id: string;
  user_id: string;
  started_at: Date;
  ended_at: Date | null;
  session_type: 'onboarding' | 'lesson' | 'freeform' | 'scenario' | 'command';
  scenario_id: string | null;
  messages: Message[];
  vocab_introduced: string[];
  vocab_practiced: string[];
  vocab_produced_correctly: string[];
  errors_made: ErrorMade[];
  xp_earned: number;
  scenario_completed: boolean;
  completion_criteria_met: Record<string, unknown> | null;
}

export class ConversationSessionModel {
  static async create(
    userId: string,
    sessionType: ConversationSession['session_type']
  ): Promise<ConversationSession> {
    const { rows } = await pool.query<ConversationSession>(
      `INSERT INTO conversation_sessions (user_id, session_type)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, sessionType]
    );
    return rows[0];
  }

  static async findById(id: string): Promise<ConversationSession | null> {
    const { rows } = await pool.query<ConversationSession>(
      'SELECT * FROM conversation_sessions WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  }

  static async getActiveSession(userId: string): Promise<ConversationSession | null> {
    const { rows } = await pool.query<ConversationSession>(
      `SELECT * FROM conversation_sessions
       WHERE user_id = $1 AND ended_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  }

  static async addMessage(
    id: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ConversationSession | null> {
    const message: Message = {
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    const { rows } = await pool.query<ConversationSession>(
      `UPDATE conversation_sessions
       SET messages = messages || $2::jsonb
       WHERE id = $1
       RETURNING *`,
      [id, JSON.stringify([message])]
    );
    return rows[0] || null;
  }

  static async addError(id: string, error: ErrorMade): Promise<void> {
    await pool.query(
      `UPDATE conversation_sessions
       SET errors_made = errors_made || $2::jsonb
       WHERE id = $1`,
      [id, JSON.stringify([error])]
    );
  }

  static async addVocabPracticed(id: string, vocabId: string): Promise<void> {
    await pool.query(
      `UPDATE conversation_sessions
       SET vocab_practiced = array_append(vocab_practiced, $2::uuid)
       WHERE id = $1 AND NOT ($2::uuid = ANY(vocab_practiced))`,
      [id, vocabId]
    );
  }

  static async addVocabCorrect(id: string, vocabId: string): Promise<void> {
    await pool.query(
      `UPDATE conversation_sessions
       SET vocab_produced_correctly = array_append(vocab_produced_correctly, $2::uuid)
       WHERE id = $1 AND NOT ($2::uuid = ANY(vocab_produced_correctly))`,
      [id, vocabId]
    );
  }

  static async endSession(id: string, xpEarned: number = 0): Promise<ConversationSession | null> {
    const { rows } = await pool.query<ConversationSession>(
      `UPDATE conversation_sessions
       SET ended_at = NOW(), xp_earned = $2
       WHERE id = $1
       RETURNING *`,
      [id, xpEarned]
    );
    return rows[0] || null;
  }

  static async getRecentMessages(
    userId: string,
    limit: number = 10
  ): Promise<Message[]> {
    const { rows } = await pool.query<{ messages: Message[] }>(
      `SELECT messages FROM conversation_sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT 5`,
      [userId]
    );

    const allMessages = rows.flatMap((r) => r.messages);
    return allMessages.slice(-limit);
  }
}
