import type { User } from '../types/user.types.js';
import type { ClassifiedIntent, IntentType, CommandType, ParsedCommand } from '../types/intent.types.js';

const COMMANDS: Record<string, CommandType> = {
  '/settings': 'settings',
  '/progress': 'progress',
  '/words': 'words',
  '/review': 'review',
  '/scenarios': 'scenarios',
  '/help': 'help',
  '/pause': 'pause',
  '/resume': 'resume',
  '/level': 'level',
};

const CONFIRMATION_PATTERNS = [
  /^(yes|si|sí|yeah|yep|ok|okay|sure|claro|vale|correct|right)$/i,
  /^(1|2|3|4|5)$/,
];

const CORRECTION_ACCEPTANCE_PATTERNS = [
  /^(oh|ah|i see|got it|thanks|gracias|understood|okay)$/i,
  /^(makes sense|that helps|thank you)$/i,
];

const SPANISH_INDICATORS = [
  /[áéíóúüñ¿¡]/i,
  /^(hola|gracias|bueno|bien|mal|quiero|tengo|estoy|soy|voy|como|donde|cuando|porque|que)\b/i,
  /\b(es|el|la|los|las|un|una|de|en|con|por|para)\b/i,
];

export class IntentClassifier {
  classify(message: string, user: User | null): ClassifiedIntent {
    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. Check for commands first
    const command = this.parseCommand(lower);
    if (command) {
      return {
        intent: 'command',
        confidence: 1.0,
        command: command.command,
        commandArgs: command.args.join(' '),
      };
    }

    // 2. Check PRACTICE command
    if (lower.startsWith('practice ')) {
      return {
        intent: 'command',
        confidence: 0.95,
        command: 'practice',
        commandArgs: trimmed.slice(9).trim(),
      };
    }

    // 3. Check user state for context
    if (user) {
      // User in onboarding
      if (!user.onboarding_completed) {
        return {
          intent: 'onboarding_response',
          confidence: 0.95,
          extractedData: { step: user.onboarding_step },
        };
      }
    }

    // 4. Check for confirmation
    if (this.isConfirmation(lower)) {
      return {
        intent: 'confirmation',
        confidence: 0.9,
      };
    }

    // 5. Check for correction acceptance
    if (this.isCorrectionAcceptance(lower)) {
      return {
        intent: 'correction_acceptance',
        confidence: 0.85,
      };
    }

    // 6. Determine if Spanish or English freeform
    if (this.containsSpanish(trimmed)) {
      return {
        intent: 'freeform_spanish',
        confidence: 0.8,
      };
    }

    // 7. Default to lesson response if we have context, otherwise freeform English
    // In production, we'd check if there's an active lesson session
    return {
      intent: 'freeform_english',
      confidence: 0.7,
    };
  }

  private parseCommand(message: string): ParsedCommand | null {
    const parts = message.split(/\s+/);
    const cmd = parts[0];

    if (COMMANDS[cmd]) {
      return {
        command: COMMANDS[cmd],
        args: parts.slice(1),
      };
    }

    return null;
  }

  private isConfirmation(message: string): boolean {
    return CONFIRMATION_PATTERNS.some((pattern) => pattern.test(message));
  }

  private isCorrectionAcceptance(message: string): boolean {
    return CORRECTION_ACCEPTANCE_PATTERNS.some((pattern) => pattern.test(message));
  }

  private containsSpanish(message: string): boolean {
    return SPANISH_INDICATORS.some((pattern) => pattern.test(message));
  }

  getIntentDescription(intent: IntentType): string {
    const descriptions: Record<IntentType, string> = {
      lesson_response: 'Response to a lesson prompt',
      command: 'System command',
      freeform_spanish: 'Free Spanish conversation',
      freeform_english: 'English question or chat',
      scenario_response: 'Response during active scenario',
      confirmation: 'Confirmation response',
      correction_acceptance: 'Acknowledging a correction',
      onboarding_response: 'Onboarding flow response',
      unknown: 'Unknown intent',
    };
    return descriptions[intent];
  }
}

export const intentClassifier = new IntentClassifier();
