import type { Level } from './user.types.js';

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'phrase'
  | 'conjunction'
  | 'preposition';

export type VocabStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface Conjugations {
  present?: Record<string, string>;
  preterite?: Record<string, string>;
  imperfect?: Record<string, string>;
  future?: Record<string, string>;
  subjunctive?: Record<string, string>;
}

export interface VocabItem {
  id: string;
  spanish: string;
  english: string;
  phonetic: string | null;
  part_of_speech: PartOfSpeech | null;

  level: Level;
  unit: number;
  frequency_rank: number | null;

  category: string | null;
  gender: 'masculine' | 'feminine' | null;

  example_sentence_es: string | null;
  example_sentence_en: string | null;

  is_irregular: boolean;
  conjugations: Conjugations | null;

  related_vocab_ids: string[];
  common_collocations: string[];

  sequence_order: number;
  created_at: Date;
}

export interface UserVocab {
  id: string;
  user_id: string;
  vocab_id: string;

  introduced_at: Date;
  introduced_in_unit: number | null;
  introduced_in_lesson: number | null;

  // Spaced Repetition State (SM-2)
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: Date | null;

  // Mastery Tracking
  times_seen: number;
  times_produced_correctly: number;
  times_produced_with_help: number;
  times_corrected: number;
  last_seen: Date | null;

  // Mastery Score
  mastery_score: number;
  status: VocabStatus;
}

export interface CreateUserVocabInput {
  user_id: string;
  vocab_id: string;
  introduced_in_unit?: number;
  introduced_in_lesson?: number;
}
