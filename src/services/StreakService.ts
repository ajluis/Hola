import { UserModel } from '../models/index.js';
import { DailyActivityModel } from '../models/DailyActivity.js';
import { xpService, XP_REWARDS } from './XPService.js';
import type { User } from '../types/index.js';

const STREAK_MILESTONES = [7, 14, 21, 30, 50, 100, 365];

const MILESTONE_MESSAGES: Record<number, string> = {
  7: "🔥 ONE WEEK STREAK! You're building a real habit. ¡Sigue así!",
  14: "Two weeks of Spanish every day! You've learned more than most people who 'want to learn a language.' Keep going!",
  30: "🏆 30 DAYS! Un mes completo. You're in the top 5% of language learners. This is becoming part of who you are.",
  50: "50 days. FIFTY. You're not just learning Spanish anymore — you're becoming someone who speaks Spanish.",
  100: "💯 ONE HUNDRED DAYS! ¡Increíble! This level of dedication is rare. You should be incredibly proud.",
  365: "🎉 ONE YEAR OF DAILY SPANISH! Un año entero. You've achieved what most people only dream about. ¡Eres increíble!",
};

export class StreakService {
  async updateStreak(user: User): Promise<{ updated: boolean; milestone?: string }> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if already counted today
    if (user.streak_last_active) {
      const lastActiveStr = new Date(user.streak_last_active).toISOString().split('T')[0];
      if (lastActiveStr === todayStr) {
        return { updated: false };
      }
    }

    // Check if streak continues or breaks
    const hadActivityYesterday = await DailyActivityModel.hadActivityYesterday(user.id);

    let newStreak: number;
    if (user.streak_last_active === null) {
      // First activity ever
      newStreak = 1;
    } else {
      const lastActive = new Date(user.streak_last_active);
      const daysSinceActive = this.daysBetween(lastActive, today);

      if (daysSinceActive === 1 || hadActivityYesterday) {
        // Consecutive day
        newStreak = user.streak_days + 1;
      } else if (daysSinceActive > 1) {
        // Streak broken
        if (user.streak_days >= 7) {
          console.log(`User ${user.id} broke a ${user.streak_days} day streak`);
        }
        newStreak = 1;
      } else {
        newStreak = user.streak_days;
      }
    }

    // Update streak
    await UserModel.updateStreak(user.id, newStreak);

    // Award streak XP
    const streakXP = XP_REWARDS.streakBonus(newStreak);
    await xpService.awardXP(user.id, streakXP, `Streak day ${newStreak}`);

    // Mark streak counted in daily activity
    await DailyActivityModel.markStreakCounted(user.id);

    // Check for milestone
    const milestone = this.checkMilestone(newStreak);

    return { updated: true, milestone };
  }

  async getStreakStatus(user: User): Promise<{
    current: number;
    longest: number;
    atRisk: boolean;
    message?: string;
  }> {
    const today = new Date();
    let atRisk = false;

    if (user.streak_last_active) {
      const lastActive = new Date(user.streak_last_active);
      const todayStr = today.toISOString().split('T')[0];
      const lastActiveStr = lastActive.toISOString().split('T')[0];

      // If they haven't practiced today and it's getting late
      if (lastActiveStr !== todayStr) {
        const hours = today.getHours();
        if (hours >= 20) {
          // After 8 PM
          atRisk = true;
        }
      }
    }

    return {
      current: user.streak_days,
      longest: user.longest_streak,
      atRisk,
      message: atRisk
        ? `Your ${user.streak_days} day streak is at risk! Practice now to keep it going.`
        : undefined,
    };
  }

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.round(Math.abs((d2.getTime() - d1.getTime()) / oneDay));
  }

  private checkMilestone(streak: number): string | undefined {
    if (STREAK_MILESTONES.includes(streak)) {
      return MILESTONE_MESSAGES[streak] || `🔥 ${streak} day streak!`;
    }
    return undefined;
  }
}

export const streakService = new StreakService();
