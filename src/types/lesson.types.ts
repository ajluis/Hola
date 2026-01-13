import type { VocabItem } from './vocab.types.js';

export type LessonType = 'vocabulary' | 'grammar' | 'culture' | 'review' | 'mixed';

export interface Lesson {
  id: string;
  unit: number;
  lesson_number: number;
  level: string;
  lesson_type: LessonType;
  title: string;
  vocab_ids: string[];
  grammar_ids: string[];
  introduction: LessonIntroduction;
  guided_practice: GuidedPractice;
}

export interface LessonIntroduction {
  message: string;
  vocab_introduced: string[];
}

export interface GuidedPractice {
  prompt: string;
  expected_vocab: string[];
  accept_english: boolean;
  success_response: string;
  help_response: string;
}

export interface LessonContent {
  type: 'new_vocab' | 'review' | 'grammar';
  vocabItem?: VocabItem;
  reviewItems?: VocabItem[];
  grammarConcept?: GrammarConcept;
}

export interface GrammarConcept {
  id: string;
  name: string;
  level: string;
  unit: number;
  explanation_en: string;
  explanation_short: string;
  examples: GrammarExample[];
  common_errors: CommonError[];
}

export interface GrammarExample {
  spanish: string;
  english: string;
  highlight?: string;
}

export interface CommonError {
  wrong: string;
  right: string;
  explanation: string;
}

export interface LessonResult {
  correct: boolean;
  xp_earned: number;
  feedback: string;
  corrections?: ErrorCorrection[];
}

export interface ErrorCorrection {
  original: string;
  corrected: string;
  explanation: string;
}
