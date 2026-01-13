import { UserModel, VocabItemModel, UserVocabModel } from '../models/index.js';
import { DailyActivityModel } from '../models/DailyActivity.js';
import { ConversationEngine } from './claude/ConversationEngine.js';
import type { User, VocabItem } from '../types/index.js';

export interface LessonContent {
  type: 'new_vocab' | 'review';
  vocabItem: VocabItem;
  isReview: boolean;
}

export class LearningEngine {
  private conversationEngine: ConversationEngine;

  constructor() {
    this.conversationEngine = new ConversationEngine();
  }

  async getNextLesson(user: User): Promise<LessonContent | null> {
    // 1. Check for items due for spaced repetition review
    const dueReviews = await UserVocabModel.getDueForReview(user.id, 3);

    if (dueReviews.length >= 3) {
      // Get the vocab item for review
      const vocabItem = await VocabItemModel.findById(dueReviews[0].vocab_id);
      if (vocabItem) {
        return {
          type: 'review',
          vocabItem,
          isReview: true,
        };
      }
    }

    // 2. Get next new vocabulary item from current unit
    const nextVocab = await VocabItemModel.getFirstInUnit(
      user.current_level,
      user.current_unit
    );

    if (nextVocab) {
      // Check if user has already seen this
      const userVocab = await UserVocabModel.findByUserAndVocab(user.id, nextVocab.id);
      if (!userVocab) {
        return {
          type: 'new_vocab',
          vocabItem: nextVocab,
          isReview: false,
        };
      }

      // Get next unseen vocab in unit
      const unseenVocab = await this.getNextUnseenVocab(user);
      if (unseenVocab) {
        return {
          type: 'new_vocab',
          vocabItem: unseenVocab,
          isReview: false,
        };
      }
    }

    // 3. Unit complete - try to advance
    await this.checkAndAdvanceUnit(user);

    return null;
  }

  async handleLessonResponse(user: User, message: string): Promise<string> {
    // Get current lesson context (in production, this would come from session state)
    const dueReviews = await UserVocabModel.getDueForReview(user.id, 1);

    if (dueReviews.length > 0) {
      const vocabItem = await VocabItemModel.findById(dueReviews[0].vocab_id);
      if (vocabItem) {
        return this.evaluateResponse(user, message, vocabItem, dueReviews[0].id);
      }
    }

    // Fallback to freeform conversation
    return this.conversationEngine.handleFreeform(user, message, 'freeform_spanish');
  }

  async deliverLesson(user: User, lesson: LessonContent): Promise<string> {
    const { vocabItem, isReview } = lesson;

    if (isReview) {
      return this.formatReviewLesson(vocabItem);
    }

    // Create user vocab record
    await UserVocabModel.getOrCreate({
      user_id: user.id,
      vocab_id: vocabItem.id,
      introduced_in_unit: user.current_unit,
      introduced_in_lesson: user.current_lesson,
    });

    return this.formatNewVocabLesson(vocabItem);
  }

  private async evaluateResponse(
    user: User,
    response: string,
    vocabItem: VocabItem,
    userVocabId: string
  ): Promise<string> {
    const lower = response.toLowerCase();
    const vocabLower = vocabItem.spanish.toLowerCase();

    // Simple check: did they use the target word?
    const usedWord = lower.includes(vocabLower);

    // Record the review
    const quality = usedWord ? 3 : 1; // 3 = correct, 1 = with help
    await UserVocabModel.recordReview(userVocabId, quality);

    // Award XP
    const xp = usedWord ? 15 : 5;
    await UserModel.addXP(user.id, xp);
    await DailyActivityModel.addXP(user.id, xp);

    // Generate feedback
    const feedback = await this.conversationEngine.generateLessonResponse(
      user,
      response,
      vocabItem.spanish,
      usedWord
    );

    const xpNote = usedWord
      ? `\n\n+${xp} XP`
      : `\n\nKeep practicing! +${xp} XP`;

    return feedback + xpNote;
  }

  private formatNewVocabLesson(vocab: VocabItem): string {
    const parts = [
      `Today's word: ${vocab.spanish.toUpperCase()}${vocab.phonetic ? ` (${vocab.phonetic})` : ''}`,
      `It means: ${vocab.english}`,
    ];

    if (vocab.example_sentence_es && vocab.example_sentence_en) {
      parts.push('');
      parts.push(`Example: ${vocab.example_sentence_es}`);
      parts.push(`(${vocab.example_sentence_en})`);
    }

    parts.push('');
    parts.push(`Try using "${vocab.spanish}" in a sentence!`);

    return parts.join('\n');
  }

  private formatReviewLesson(vocab: VocabItem): string {
    return `Quick review! 🔄

Do you remember what "${vocab.spanish}" means?

Try using it in a sentence!`;
  }

  private async getNextUnseenVocab(user: User): Promise<VocabItem | null> {
    const allVocab = await VocabItemModel.findByLevelAndUnit(
      user.current_level,
      user.current_unit
    );

    for (const vocab of allVocab) {
      const userVocab = await UserVocabModel.findByUserAndVocab(user.id, vocab.id);
      if (!userVocab) {
        return vocab;
      }
    }

    return null;
  }

  private async checkAndAdvanceUnit(user: User): Promise<void> {
    const vocabCount = await VocabItemModel.countByLevelAndUnit(
      user.current_level,
      user.current_unit
    );
    const learnedCount = await this.getLearnedInUnit(user);

    if (learnedCount >= vocabCount) {
      // Advance to next unit
      await UserModel.update(user.id, {
        current_unit: user.current_unit + 1,
        current_lesson: 1,
      });

      // Award unit completion XP
      await UserModel.addXP(user.id, 100);
    }
  }

  private async getLearnedInUnit(user: User): Promise<number> {
    const allVocab = await VocabItemModel.findByLevelAndUnit(
      user.current_level,
      user.current_unit
    );

    let count = 0;
    for (const vocab of allVocab) {
      const userVocab = await UserVocabModel.findByUserAndVocab(user.id, vocab.id);
      if (userVocab) {
        count++;
      }
    }

    return count;
  }
}
