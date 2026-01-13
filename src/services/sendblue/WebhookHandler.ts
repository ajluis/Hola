import type { SendblueInboundMessage, SendblueStatusUpdate } from '../../types/index.js';
import { UserModel } from '../../models/index.js';
import { DailyActivityModel } from '../../models/DailyActivity.js';
import { MessageRouter } from '../MessageRouter.js';
import { sendblueClient } from './SendblueClient.js';
import { getRedisClient } from '../../config/redis.js';

export class WebhookHandler {
  private messageRouter: MessageRouter;

  constructor() {
    this.messageRouter = new MessageRouter();
  }

  async handleInbound(payload: SendblueInboundMessage): Promise<void> {
    // Skip outbound messages
    if (payload.is_outbound) {
      return;
    }

    const { from_number, content, message_handle } = payload;

    // Idempotency check
    const redis = await getRedisClient();
    const processed = await redis.get(`msg:${message_handle}`);
    if (processed) {
      console.log(`Skipping duplicate message: ${message_handle}`);
      return;
    }

    // Mark as processed (expire after 24 hours)
    await redis.setEx(`msg:${message_handle}`, 86400, '1');

    console.log(`Inbound message from ${from_number}: ${content.substring(0, 50)}...`);

    try {
      // Send typing indicator
      await sendblueClient.sendTypingIndicator(from_number);

      // Route message and get response
      const response = await this.messageRouter.route(from_number, content);

      // Send response
      if (response) {
        await sendblueClient.sendMessage(from_number, response);
      }

      // Track activity
      const user = await UserModel.findByPhone(from_number);
      if (user) {
        await DailyActivityModel.incrementMessages(user.id, 'received');
        await DailyActivityModel.incrementMessages(user.id, 'sent');
        await UserModel.incrementMessageCount(user.id, 'received');
        await UserModel.incrementMessageCount(user.id, 'sent');
      }
    } catch (error) {
      console.error('Error processing inbound message:', error);

      // Send error response
      await sendblueClient.sendMessage(
        from_number,
        "Sorry, I'm having trouble right now. Please try again in a moment."
      );
    }
  }

  async handleStatusUpdate(payload: SendblueStatusUpdate): Promise<void> {
    const { message_handle, status, error_code, error_message } = payload;

    if (error_code) {
      console.error(
        `Message ${message_handle} failed: ${error_code} - ${error_message}`
      );
    } else {
      console.log(`Message ${message_handle} status: ${status}`);
    }
  }
}
