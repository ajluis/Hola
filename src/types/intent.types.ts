export type IntentType =
  | 'lesson_response'
  | 'command'
  | 'freeform_spanish'
  | 'freeform_english'
  | 'scenario_response'
  | 'confirmation'
  | 'correction_acceptance'
  | 'onboarding_response'
  | 'unknown';

export interface ClassifiedIntent {
  intent: IntentType;
  confidence: number;
  command?: string;
  commandArgs?: string;
  extractedData?: Record<string, unknown>;
}

export type CommandType =
  | 'settings'
  | 'progress'
  | 'words'
  | 'review'
  | 'scenarios'
  | 'help'
  | 'pause'
  | 'resume'
  | 'level'
  | 'practice';

export interface ParsedCommand {
  command: CommandType;
  args: string[];
}
