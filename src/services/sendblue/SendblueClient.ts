import { sendblueConfig } from '../../config/sendblue.js';
import type { SendblueSendRequest, SendblueSendResponse } from '../../types/index.js';

export class SendblueClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = sendblueConfig.baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'sb-api-key-id': sendblueConfig.apiKey,
      'sb-api-secret-key': sendblueConfig.apiSecret,
    };
  }

  async sendMessage(
    toNumber: string,
    content: string,
    mediaUrl?: string
  ): Promise<SendblueSendResponse> {
    const body: SendblueSendRequest = {
      number: toNumber,
      content,
      send_style: 'default',
      status_callback: sendblueConfig.statusCallbackUrl,
    };

    if (mediaUrl) {
      body.media_url = mediaUrl;
    }

    const response = await fetch(`${this.baseUrl}/send-message`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sendblue API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<SendblueSendResponse>;
  }

  async sendTypingIndicator(toNumber: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/send-typing-indicator`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ number: toNumber }),
    });

    if (!response.ok) {
      console.warn('Failed to send typing indicator:', response.status);
    }
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Add +1 if not present (assuming US numbers)
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    return phone.startsWith('+') ? phone : `+${digits}`;
  }
}

// Singleton instance
export const sendblueClient = new SendblueClient();
