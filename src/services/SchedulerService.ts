import { CronJob } from 'cron';
import { UserModel } from '../models/index.js';
import { LearningEngine } from './LearningEngine.js';
import { streakService } from './StreakService.js';
import { sendblueClient } from './sendblue/SendblueClient.js';

export class SchedulerService {
  private lessonJob: CronJob | null = null;
  private streakReminderJob: CronJob | null = null;
  private learningEngine: LearningEngine;

  constructor() {
    this.learningEngine = new LearningEngine();
  }

  start(): void {
    console.log('Starting scheduler service...');

    // Check for due lessons every minute
    this.lessonJob = new CronJob('* * * * *', async () => {
      await this.deliverDueLessons();
    });

    // Check for streak at-risk users at 8 PM
    this.streakReminderJob = new CronJob('0 20 * * *', async () => {
      await this.sendStreakReminders();
    });

    this.lessonJob.start();
    this.streakReminderJob.start();

    console.log('Scheduler service started');
  }

  stop(): void {
    if (this.lessonJob) {
      this.lessonJob.stop();
    }
    if (this.streakReminderJob) {
      this.streakReminderJob.stop();
    }
    console.log('Scheduler service stopped');
  }

  private async deliverDueLessons(): Promise<void> {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    try {
      const users = await UserModel.getUsersDueForLesson(currentTime);

      for (const user of users) {
        await this.deliverLessonToUser(user);
      }
    } catch (error) {
      console.error('Error delivering scheduled lessons:', error);
    }
  }

  private async deliverLessonToUser(user: { id: string; phone_number: string; current_level: string; current_unit: number }): Promise<void> {
    try {
      // Cast to User type for LearningEngine
      const fullUser = await UserModel.findById(user.id);
      if (!fullUser) return;

      const lesson = await this.learningEngine.getNextLesson(fullUser);
      if (!lesson) {
        console.log(`No lesson available for user ${user.id}`);
        return;
      }

      const message = await this.learningEngine.deliverLesson(fullUser, lesson);
      await sendblueClient.sendMessage(user.phone_number, message);

      // Update streak
      await streakService.updateStreak(fullUser);

      console.log(`Delivered lesson to ${user.phone_number}`);
    } catch (error) {
      console.error(`Failed to deliver lesson to ${user.phone_number}:`, error);
    }
  }

  private async sendStreakReminders(): Promise<void> {
    try {
      // Get users with active streaks who haven't practiced today
      // In production, this would be a more sophisticated query
      console.log('Checking for streak reminders...');
      // Implementation would query for at-risk users and send reminders
    } catch (error) {
      console.error('Error sending streak reminders:', error);
    }
  }
}

export const schedulerService = new SchedulerService();
