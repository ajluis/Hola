import { UserVocabModel } from '../models/index.js';
import { xpService } from './XPService.js';
import { streakService } from './StreakService.js';
import type { User } from '../types/index.js';

export class CommandHandler {
  async handle(user: User, command: string, args?: string): Promise<string> {
    switch (command) {
      case 'progress':
        return this.handleProgress(user);
      case 'settings':
        return this.handleSettings(user);
      case 'help':
        return this.handleHelp();
      case 'words':
        return this.handleWords(user);
      case 'level':
        return this.handleLevel(user);
      case 'pause':
        return this.handlePause(user);
      case 'resume':
        return this.handleResume(user);
      case 'practice':
        return this.handlePractice(args);
      default:
        return "I don't recognize that command. Text /help for available commands.";
    }
  }

  private async handleProgress(user: User): Promise<string> {
    const progress = xpService.getProgressToNextLevel(user);
    const vocabStats = await UserVocabModel.countByStatus(user.id);
    const totalLearned = await UserVocabModel.getTotalLearned(user.id);
    const totalMastered = await UserVocabModel.getTotalMastered(user.id);
    const streakStatus = await streakService.getStreakStatus(user);

    const nextLevel = this.getNextLevel(user.current_level);

    return `📊 Tu Progreso

📈 Level
Current: ${user.current_level} (${this.getLevelName(user.current_level)})
XP: ${progress.current} / ${progress.required} to ${nextLevel || 'max'}

🔤 Vocabulary
Learned: ${totalLearned} words
Mastered: ${totalMastered} words
Reviewing: ${vocabStats.reviewing}
Learning: ${vocabStats.learning}

🔥 Streak
Current: ${streakStatus.current} days
Longest: ${streakStatus.longest} days
${streakStatus.atRisk ? '\n⚠️ ' + streakStatus.message : ''}

Keep going! ¡Sigue así! 💪`;
  }

  private async handleSettings(user: User): Promise<string> {
    return `⚙️ Settings

1️⃣ Lessons & schedule
2️⃣ My level & progress
3️⃣ Language preferences
4️⃣ Reminders
5️⃣ View my profile

Reply with a number, or 'done' to exit.

Current settings:
• Lessons/day: ${user.daily_lesson_count}
• Lesson time: ${this.formatTime(user.lesson_time_morning)}
• Dialect: ${user.dialect_preference === 'latam' ? 'Latin American' : 'Castilian'}
• Accountability: ${user.accountability_level}`;
  }

  private handleHelp(): string {
    return `📚 Available Commands

/progress - View your stats
/settings - Adjust preferences
/words - See vocabulary breakdown
/level - Quick level check
/pause - Pause lessons
/resume - Resume lessons
/help - Show this message

You can also:
• Text in Spanish to practice
• Ask questions in English
• Just chat with me anytime!`;
  }

  private async handleWords(user: User): Promise<string> {
    const vocabStats = await UserVocabModel.countByStatus(user.id);
    const totalLearned = await UserVocabModel.getTotalLearned(user.id);

    return `📚 Your Vocabulary (${totalLearned} words)

By status:
• Mastered: ${vocabStats.mastered} ✓
• Reviewing: ${vocabStats.reviewing} 🔄
• Learning: ${vocabStats.learning} 📖
• New: ${vocabStats.new} ✨

Keep practicing! Every word you master is a step toward fluency.`;
  }

  private async handleLevel(user: User): Promise<string> {
    const progress = xpService.getProgressToNextLevel(user);
    const nextLevel = this.getNextLevel(user.current_level);

    return `📊 Level: ${user.current_level} (${this.getLevelName(user.current_level)})

XP: ${user.xp_total} total
${nextLevel ? `Progress: ${progress.current}/${progress.required} to ${nextLevel} (${progress.percentage}%)` : 'You\'ve reached the highest level!'}

🔥 Streak: ${user.streak_days} days`;
  }

  private async handlePause(_user: User): Promise<string> {
    // In production, this would set a pause flag
    return `⏸️ Lessons paused.

I won't send scheduled lessons until you text /resume.

You can still text me anytime to practice!

How long do you want to pause?
• Reply "1 week" or "2 weeks"
• Or /resume to start again`;
  }

  private async handleResume(user: User): Promise<string> {
    return `▶️ Lessons resumed!

Your next lesson will arrive at ${this.formatTime(user.lesson_time_morning)}.

Current streak: ${user.streak_days} days
Let's keep it going! 🔥`;
  }

  private handlePractice(scenario?: string): string {
    if (!scenario) {
      return `🎭 Available Practice Scenarios:

• PRACTICE restaurant - Order food at a restaurant
• PRACTICE directions - Ask for directions
• PRACTICE shopping - Buy something at a store
• PRACTICE introduction - Meet someone new

Reply with one to start!`;
    }

    // In production, this would start a scenario
    return `Starting "${scenario}" practice scenario...

(Scenarios coming soon! For now, just text me in Spanish to practice.)`;
  }

  private getLevelName(level: string): string {
    const names: Record<string, string> = {
      A0: 'Absolute Beginner',
      A1: 'Beginner',
      A2: 'Elementary',
      B1: 'Intermediate',
      B2: 'Upper Intermediate',
    };
    return names[level] || level;
  }

  private getNextLevel(current: string): string | null {
    const levels = ['A0', 'A1', 'A2', 'B1', 'B2'];
    const index = levels.indexOf(current);
    return index < levels.length - 1 ? levels[index + 1] : null;
  }

  private formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return minutes === 0
      ? `${hour12} ${period}`
      : `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}
