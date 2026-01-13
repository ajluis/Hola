import { Router } from 'express';
import type { Request, Response } from 'express';
import { WebhookHandler } from '../services/sendblue/WebhookHandler.js';
import type { SendblueInboundMessage, SendblueStatusUpdate } from '../types/index.js';

const router = Router();
const webhookHandler = new WebhookHandler();

router.post('/sendblue/inbound', async (req: Request, res: Response) => {
  try {
    const payload = req.body as SendblueInboundMessage;

    // Acknowledge receipt immediately (Sendblue expects quick response)
    res.status(200).json({ received: true });

    // Process asynchronously
    await webhookHandler.handleInbound(payload);
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent retries
    if (!res.headersSent) {
      res.status(200).json({ received: true, error: 'Processing failed' });
    }
  }
});

router.post('/sendblue/status', async (req: Request, res: Response) => {
  try {
    const payload = req.body as SendblueStatusUpdate;
    await webhookHandler.handleStatusUpdate(payload);
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Status webhook error:', error);
    res.status(200).json({ received: true });
  }
});

export default router;
