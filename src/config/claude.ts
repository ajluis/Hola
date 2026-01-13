import { config } from './index.js';

export const claudeConfig = {
  apiKey: config.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 500,
};
