import { UserModel } from '../models/index.js';
import type { User, Level } from '../types/index.js';

export const LEVEL_THRESHOLDS: Record<Level, number> = {
  A0: 0,
  A1: 500,
  A2: 2000,
  B1: 6000,
  B2: 15000,
};

const LEVELS: Level[] = ['A0', 'A1', 'A2', 'B1', 'B2'];

export const XP_REWARDS = {
  lessonComplete: 10,
  lessonCorrectFirstTry: 15,
  newVocabCorrect: 15,
  newVocabUnprompted: 25,
  scenarioComplete: 50,
  scenarioClean: 75, // <2 errors
  freeformExchange: 5,
  correctMistake: 20,
  unitComplete: 100,
  streakBonus: (days: number) => Math.min(days * 10, 70),
};

export class XPService {
  async awardXP(userId: string, amount: number, reason: string): Promise<User | null> {
    console.log(`Awarding ${amount} XP to ${userId}: ${reason}`);

    const user = await UserModel.addXP(userId, amount);
    if (!user) return null;

    // Check for level up
    const levelUp = await this.checkLevelUp(user);
    if (levelUp) {
      console.log(`User ${userId} leveled up to ${levelUp.newLevel}`);
    }

    return user;
  }

  async checkLevelUp(user: User): Promise<{ newLevel: Level; message: string } | null> {
    const currentIndex = LEVELS.indexOf(user.current_level);
    const nextLevel = LEVELS[currentIndex + 1];

    if (!nextLevel) return null;

    const threshold = LEVEL_THRESHOLDS[nextLevel];
    if (user.xp_total < threshold) return null;

    // Level up!
    await UserModel.update(user.id, {
      current_level: nextLevel,
      xp_current_level: user.xp_total - threshold,
    });

    const message = this.getLevelUpMessage(nextLevel);
    return { newLevel: nextLevel, message };
  }

  getProgressToNextLevel(user: User): { current: number; required: number; percentage: number } {
    const currentIndex = LEVELS.indexOf(user.current_level);
    const nextLevel = LEVELS[currentIndex + 1];

    if (!nextLevel) {
      return { current: user.xp_total, required: user.xp_total, percentage: 100 };
    }

    const currentThreshold = LEVEL_THRESHOLDS[user.current_level];
    const nextThreshold = LEVEL_THRESHOLDS[nextLevel];
    const required = nextThreshold - currentThreshold;
    const current = user.xp_total - currentThreshold;
    const percentage = Math.round((current / required) * 100);

    return { current, required, percentage };
  }

  private getLevelUpMessage(newLevel: Level): string {
    const messages: Record<Level, string> = {
      A0: '', // Can't level up to A0
      A1: `🎉 ¡FELICIDADES! You've reached A1 (Beginner)!

You're learning the fundamentals. New content unlocked:
• Basic present tense
• Common phrases
• Numbers and greetings

Keep going! 💪`,

      A2: `🎉 ¡FELICIDADES! You've reached A2 (Elementary)!

You now know 500+ words and can talk about the past. That's huge.

New content unlocked:
• Past tense (preterite)
• Describing experiences
• More complex scenarios

¡Sigue así! 🌟`,

      B1: `🎉 ¡FELICIDADES! You've reached B1 (Intermediate)!

You can now handle most real-world situations in Spanish!

New content unlocked:
• Subjunctive mood
• Complex sentences
• Advanced conversations

You're becoming truly conversational! 🚀`,

      B2: `🎉 ¡FELICIDADES! You've reached B2 (Upper Intermediate)!

You're approaching fluency! This is a huge achievement.

New content unlocked:
• Nuanced expressions
• Idioms and slang
• Native-level conversation

¡Eres increíble! 🏆`,
    };

    return messages[newLevel];
  }
}

export const xpService = new XPService();
