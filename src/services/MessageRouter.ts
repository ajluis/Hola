import { UserModel } from '../models/index.js';
import { intentClassifier } from './IntentClassifier.js';
import { userRateLimiter } from './RateLimiter.js';
import { OnboardingService } from './OnboardingService.js';
import { ConversationEngine } from './claude/ConversationEngine.js';
import { CommandHandler } from './CommandHandler.js';
import { LearningEngine } from './LearningEngine.js';
import type { User } from '../types/index.js';

export class MessageRouter {
  private onboardingService: OnboardingService;
  private conversationEngine: ConversationEngine;
  private commandHandler: CommandHandler;
  private learningEngine: LearningEngine;

  constructor() {
    this.onboardingService = new OnboardingService();
    this.conversationEngine = new ConversationEngine();
    this.commandHandler = new CommandHandler();
    this.learningEngine = new LearningEngine();
  }

  async route(phoneNumber: string, message: string): Promise<string> {
    // Rate limiting
    const rateLimitResult = await userRateLimiter.checkLimit(phoneNumber);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limited: ${phoneNumber}`);
      // Don't respond to rate-limited requests
      return '';
    }

    // Get or create user
    let user = await UserModel.findByPhone(phoneNumber);
    if (!user) {
      user = await UserModel.create({ phone_number: phoneNumber });
      console.log(`Created new user: ${user.id}`);
    }

    // Classify intent
    const intent = intentClassifier.classify(message, user);
    console.log(`Intent: ${intent.intent} (confidence: ${intent.confidence})`);

    // Route based on intent
    switch (intent.intent) {
      case 'onboarding_response':
        return this.onboardingService.processStep(user, message);

      case 'command':
        return this.commandHandler.handle(user, intent.command!, intent.commandArgs);

      case 'freeform_spanish':
      case 'freeform_english':
        return this.conversationEngine.handleFreeform(user, message, intent.intent);

      case 'lesson_response':
        return this.learningEngine.handleLessonResponse(user, message);

      case 'confirmation':
        return this.handleConfirmation(user, message);

      case 'correction_acceptance':
        return this.handleCorrectionAcceptance(user);

      default:
        return this.conversationEngine.handleFreeform(user, message, 'freeform_english');
    }
  }

  private async handleConfirmation(user: User, message: string): Promise<string> {
    // Check if user is in onboarding
    if (!user.onboarding_completed) {
      return this.onboardingService.processStep(user, message);
    }

    // Otherwise treat as lesson response
    return this.learningEngine.handleLessonResponse(user, message);
  }

  private async handleCorrectionAcceptance(_user: User): Promise<string> {
    const responses = [
      "Great! Let's keep practicing. 💪",
      "Awesome! You're doing great.",
      "Perfect! Ready for the next one?",
      "¡Muy bien! Let's continue.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
