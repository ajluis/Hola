import { claudeClient, type ClaudeMessage } from './ClaudeClient.js';
import { buildSystemPrompt, buildErrorCorrectionPrompt } from './prompts/system.js';
import { ConversationSessionModel, type Message } from '../../models/ConversationSession.js';
import { UserVocabModel } from '../../models/UserVocab.js';
import { VocabItemModel } from '../../models/VocabItem.js';
import type { User } from '../../types/index.js';

export class ConversationEngine {
  async handleFreeform(
    user: User,
    message: string,
    intent: 'freeform_spanish' | 'freeform_english'
  ): Promise<string> {
    // Get or create active session
    let session = await ConversationSessionModel.getActiveSession(user.id);
    if (!session) {
      session = await ConversationSessionModel.create(user.id, 'freeform');
    }

    // Add user message to session
    await ConversationSessionModel.addMessage(session.id, 'user', message);

    // Get context
    const context = await this.buildContext(user);

    // Build conversation history
    const recentMessages = await ConversationSessionModel.getRecentMessages(user.id, 8);
    const claudeMessages: ClaudeMessage[] = recentMessages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    }));

    // Add current message if not already included
    if (claudeMessages.length === 0 || claudeMessages[claudeMessages.length - 1].content !== message) {
      claudeMessages.push({ role: 'user', content: message });
    }

    // Generate response
    const systemPrompt = buildSystemPrompt(user, context);
    const response = await claudeClient.createMessage(systemPrompt, claudeMessages);

    // Check for errors if Spanish was used
    if (intent === 'freeform_spanish') {
      await this.checkAndLogErrors(session.id, message, user.current_level);
    }

    // Add assistant response to session
    await ConversationSessionModel.addMessage(session.id, 'assistant', response.content);

    return this.formatForSMS(response.content);
  }

  async generateLessonResponse(
    user: User,
    userResponse: string,
    vocabWord: string,
    correct: boolean
  ): Promise<string> {
    const context = await this.buildContext(user);
    const systemPrompt = buildSystemPrompt(user, context);

    const prompt = correct
      ? `The student correctly used "${vocabWord}" in their response: "${userResponse}".
         Give brief positive feedback (1-2 sentences) and optionally ask a follow-up question to continue the conversation naturally.`
      : `The student attempted to use "${vocabWord}" but made an error: "${userResponse}".
         Provide gentle correction using recasting, then encourage them. Keep it brief and supportive.`;

    const response = await claudeClient.quickResponse(systemPrompt, prompt);
    return this.formatForSMS(response);
  }

  private async buildContext(user: User): Promise<{ recentVocab: string[]; dueForReview: string[] }> {
    // Get vocabulary due for review
    const dueVocab = await UserVocabModel.getDueForReview(user.id, 5);
    const dueVocabIds = dueVocab.map((v) => v.vocab_id);

    // Get the actual vocab items
    const dueItems = await Promise.all(
      dueVocabIds.map((id) => VocabItemModel.findById(id))
    );

    const dueForReview = dueItems
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item) => item.spanish);

    // For now, recent vocab is empty (would come from recent lessons)
    const recentVocab: string[] = [];

    return { recentVocab, dueForReview };
  }

  private async checkAndLogErrors(
    sessionId: string,
    userText: string,
    level: string
  ): Promise<void> {
    try {
      const prompt = buildErrorCorrectionPrompt(userText, level);
      const analysis = await claudeClient.quickResponse(
        'You are a Spanish language analysis tool. Identify errors briefly.',
        prompt
      );

      // Check if there were errors (simple heuristic)
      if (
        analysis.toLowerCase().includes('error') ||
        analysis.toLowerCase().includes('correction') ||
        analysis.toLowerCase().includes('should be')
      ) {
        await ConversationSessionModel.addError(sessionId, {
          user_said: userText,
          correction: analysis,
        });
      }
    } catch (error) {
      console.error('Error checking for language errors:', error);
    }
  }

  private formatForSMS(text: string): string {
    // Ensure message isn't too long for SMS
    const maxLength = 1600; // SMS limit with concatenation

    if (text.length <= maxLength) {
      return text;
    }

    // Truncate at a sentence boundary
    const truncated = text.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclaim = truncated.lastIndexOf('!');

    const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);

    if (lastSentence > maxLength / 2) {
      return truncated.slice(0, lastSentence + 1);
    }

    return truncated + '...';
  }
}
