export type Level = 'A0' | 'A1' | 'A2' | 'B1' | 'B2';
export type DialectPreference = 'latam' | 'castilian';
export type AccountabilityLevel = 'light' | 'medium' | 'high';
export type SpanishImmersionLevel = 'low' | 'medium' | 'high';
export type LearningGoal = 'travel' | 'work' | 'family' | 'personal';

export interface User {
  id: string;
  phone_number: string;

  // Onboarding state
  onboarding_step: number;
  onboarding_completed: boolean;

  // Profile
  name: string | null;
  timezone: string;

  // Learning state
  current_level: Level;
  current_unit: number;
  current_lesson: number;

  // Learning preferences
  dialect_preference: DialectPreference;
  goals: LearningGoal[];
  daily_lesson_count: number;
  lesson_time_morning: string;
  lesson_time_evening: string | null;
  accountability_level: AccountabilityLevel;
  spanish_immersion_level: SpanishImmersionLevel;

  // XP & Progression
  xp_total: number;
  xp_current_level: number;

  // Streak
  streak_days: number;
  streak_last_active: Date | null;
  longest_streak: number;

  // Engagement
  total_messages_sent: number;
  total_messages_received: number;
  conversations_completed: number;
  scenarios_completed: number;

  // Metadata
  created_at: Date;
  updated_at: Date;
  last_message_at: Date | null;
}

export interface CreateUserInput {
  phone_number: string;
}

export interface UpdateUserInput {
  name?: string;
  timezone?: string;
  onboarding_step?: number;
  onboarding_completed?: boolean;
  current_level?: Level;
  current_unit?: number;
  current_lesson?: number;
  dialect_preference?: DialectPreference;
  goals?: LearningGoal[];
  daily_lesson_count?: number;
  lesson_time_morning?: string;
  lesson_time_evening?: string | null;
  accountability_level?: AccountabilityLevel;
  spanish_immersion_level?: SpanishImmersionLevel;
  xp_total?: number;
  xp_current_level?: number;
  streak_days?: number;
  streak_last_active?: Date | null;
  longest_streak?: number;
}
