import { UserModel } from '../models/index.js';
import type { User, Level, DialectPreference, AccountabilityLevel, LearningGoal } from '../types/index.js';

const MESSAGES = {
  welcome: `¡Hola! 👋 I'm Hola — your Spanish tutor that lives in your texts.

I'll send you bite-sized lessons, chat with you in Spanish, and help you actually remember what you learn.

No app needed. Just text back.

Ready to start? (Reply 'yes' or 'sí'!)`,

  level: `Awesome! First, what's your Spanish level?

1️⃣ Complete beginner (starting from zero)
2️⃣ Know some basics (greetings, simple words)
3️⃣ Can hold simple conversations
4️⃣ Intermediate (comfortable but want to improve)

Reply with the number.`,

  goals: `Why do you want to learn Spanish?

1️⃣ Travel
2️⃣ Work or career
3️⃣ Connect with family/friends
4️⃣ Personal enrichment
5️⃣ All of the above

This helps me personalize your lessons.`,

  dialect: `Spanish varies by region. Which would you prefer?

1️⃣ Latin American Spanish (Mexico, Central/South America)
2️⃣ Castilian Spanish (Spain)

Both are great — this just affects some vocabulary and examples.`,

  frequency: `How many lessons per day?

1️⃣ 1 lesson (light, ~2 min/day)
2️⃣ 2 lessons (recommended, ~5 min/day)
3️⃣ 3 lessons (committed, ~8 min/day)

You can always change this later.`,

  time: `When should I send your first lesson?

Just reply with a time like '9am' or '8:30'.

I'll send lessons around this time each day.`,

  accountability: `One more thing — how much should I nudge you?

1️⃣ Light — Just send lessons, I'll respond when I can
2️⃣ Medium — Remind me if I don't respond to lessons
3️⃣ High — Daily check-ins and encouragement

I recommend Medium to build the habit.`,

  firstLesson: `¡Perfecto! You're all set. 🎉

Here's how it works:
• I'll send lessons → You respond
• Text me anytime to practice
• Text /progress to see your stats
• Text /settings to adjust preferences

Let's start with your first word...

Today's word: HOLA (OH-lah)
It means: Hello / Hi

You already know this one! How would you greet a friend in Spanish?`,
};

export class OnboardingService {
  async processStep(user: User, message: string): Promise<string> {
    const step = user.onboarding_step;

    switch (step) {
      case 0:
        return this.handleWelcome(user, message);
      case 1:
        return this.handleLevel(user, message);
      case 2:
        return this.handleGoals(user, message);
      case 3:
        return this.handleDialect(user, message);
      case 4:
        return this.handleFrequency(user, message);
      case 5:
        return this.handleTime(user, message);
      case 6:
        return this.handleAccountability(user, message);
      case 7:
        return this.handleFirstLesson(user, message);
      default:
        // User is onboarded but somehow got here
        return "You're all set! Text me anything to practice Spanish, or /help for commands.";
    }
  }

  private async handleWelcome(user: User, message: string): Promise<string> {
    const lower = message.toLowerCase().trim();

    // Check for affirmative response
    const affirmatives = ['yes', 'si', 'sí', 'yeah', 'yep', 'ok', 'okay', 'sure', 'y'];
    if (affirmatives.some((a) => lower === a || lower.startsWith(a))) {
      await UserModel.incrementOnboardingStep(user.id);
      return MESSAGES.level;
    }

    // First message - send welcome
    if (user.onboarding_step === 0) {
      return MESSAGES.welcome;
    }

    return "I didn't catch that. Ready to start learning Spanish? Just reply 'yes' or 'sí'!";
  }

  private async handleLevel(user: User, message: string): Promise<string> {
    const choice = message.trim();
    const levelMap: Record<string, Level> = {
      '1': 'A0',
      '2': 'A1',
      '3': 'A2',
      '4': 'B1',
    };

    const level = levelMap[choice];
    if (!level) {
      return "Please reply with 1, 2, 3, or 4 to select your level.";
    }

    await UserModel.update(user.id, { current_level: level });
    await UserModel.incrementOnboardingStep(user.id);

    const responses: Record<string, string> = {
      '1': "Starting from scratch — that's exciting! We'll take it nice and slow.",
      '2': "Great — you've got some basics! We'll build from there.",
      '3': "Nice! You can already have conversations. Let's make them even better.",
      '4': "Awesome! You're already comfortable. Let's polish your skills.",
    };

    return `${responses[choice]}\n\n${MESSAGES.goals}`;
  }

  private async handleGoals(user: User, message: string): Promise<string> {
    const choice = message.trim();
    const goalMap: Record<string, LearningGoal[]> = {
      '1': ['travel'],
      '2': ['work'],
      '3': ['family'],
      '4': ['personal'],
      '5': ['travel', 'work', 'family', 'personal'],
    };

    const goals = goalMap[choice];
    if (!goals) {
      return "Please reply with 1, 2, 3, 4, or 5 to select your goal.";
    }

    await UserModel.update(user.id, { goals });
    await UserModel.incrementOnboardingStep(user.id);

    const responses: Record<string, string> = {
      '1': "Travel is one of the best reasons! I'll include lots of practical scenarios.",
      '2': "Career boost! I'll focus on professional vocabulary and formal speech.",
      '3': "Connecting with loved ones — that's beautiful. We'll make it conversational.",
      '4': "Personal growth — love it! We'll make learning enjoyable.",
      '5': "You want it all! I'll give you a well-rounded experience.",
    };

    return `${responses[choice]}\n\n${MESSAGES.dialect}`;
  }

  private async handleDialect(user: User, message: string): Promise<string> {
    const choice = message.trim();
    const dialectMap: Record<string, DialectPreference> = {
      '1': 'latam',
      '2': 'castilian',
    };

    const dialect = dialectMap[choice];
    if (!dialect) {
      return "Please reply with 1 or 2 to select your dialect preference.";
    }

    await UserModel.update(user.id, { dialect_preference: dialect });
    await UserModel.incrementOnboardingStep(user.id);

    const response = choice === '1'
      ? "¡Perfecto! Latin American Spanish it is."
      : "¡Vale! Castilian Spanish it is.";

    return `${response}\n\n${MESSAGES.frequency}`;
  }

  private async handleFrequency(user: User, message: string): Promise<string> {
    const choice = message.trim();
    const frequencyMap: Record<string, number> = {
      '1': 1,
      '2': 2,
      '3': 3,
    };

    const count = frequencyMap[choice];
    if (!count) {
      return "Please reply with 1, 2, or 3 to select your lesson frequency.";
    }

    await UserModel.update(user.id, { daily_lesson_count: count });
    await UserModel.incrementOnboardingStep(user.id);

    return `Great choice — ${count} lesson${count > 1 ? 's' : ''} per day.\n\n${MESSAGES.time}`;
  }

  private async handleTime(user: User, message: string): Promise<string> {
    const timeStr = this.parseTime(message);
    if (!timeStr) {
      return "I didn't understand that time. Please reply like '9am' or '14:30'.";
    }

    await UserModel.update(user.id, { lesson_time_morning: timeStr });
    await UserModel.incrementOnboardingStep(user.id);

    return `Got it — lessons at ${this.formatTime(timeStr)}.\n\n${MESSAGES.accountability}`;
  }

  private async handleAccountability(user: User, message: string): Promise<string> {
    const choice = message.trim();
    const levelMap: Record<string, AccountabilityLevel> = {
      '1': 'light',
      '2': 'medium',
      '3': 'high',
    };

    const level = levelMap[choice];
    if (!level) {
      return "Please reply with 1, 2, or 3 to select your accountability level.";
    }

    await UserModel.update(user.id, { accountability_level: level });
    await UserModel.incrementOnboardingStep(user.id);

    return MESSAGES.firstLesson;
  }

  private async handleFirstLesson(user: User, message: string): Promise<string> {
    const lower = message.toLowerCase().trim();

    // Check if they responded with hola
    if (lower.includes('hola')) {
      await UserModel.completeOnboarding(user.id);
      await UserModel.addXP(user.id, 15);

      return `¡Perfecto! 🎉 You just completed your first lesson.

+15 XP earned

Tomorrow at your scheduled time, I'll send your next word. In the meantime, feel free to text me anytime to practice!`;
    }

    return "Try greeting me in Spanish! How would you say 'hello'?";
  }

  private parseTime(input: string): string | null {
    const trimmed = input.trim().toLowerCase();

    // Match patterns like "9am", "9:30am", "14:00", "2pm"
    const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);

    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
      const period = match12[3];

      if (hours < 1 || hours > 12 || minutes > 59) return null;

      if (period === 'pm' && hours !== 12) hours += 12;
      if (period === 'am' && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);

      if (hours > 23 || minutes > 59) return null;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    return null;
  }

  private formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}
