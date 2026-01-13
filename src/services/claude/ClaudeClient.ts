import Anthropic from '@anthropic-ai/sdk';
import { claudeConfig } from '../../config/claude.js';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  stopReason: string | null;
}

export class ClaudeClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: claudeConfig.apiKey,
    });
  }

  async createMessage(
    systemPrompt: string,
    messages: ClaudeMessage[],
    maxTokens: number = claudeConfig.maxTokens
  ): Promise<ClaudeResponse> {
    const response = await this.client.messages.create({
      model: claudeConfig.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textContent = response.content.find((block) => block.type === 'text');
    const content = textContent && 'text' in textContent ? textContent.text : '';

    return {
      content,
      stopReason: response.stop_reason,
    };
  }

  async quickResponse(
    systemPrompt: string,
    userMessage: string
  ): Promise<string> {
    const response = await this.createMessage(systemPrompt, [
      { role: 'user', content: userMessage },
    ]);
    return response.content;
  }
}

export const claudeClient = new ClaudeClient();
