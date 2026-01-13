import { config } from './index.js';

export const sendblueConfig = {
  apiKey: config.SENDBLUE_API_KEY,
  apiSecret: config.SENDBLUE_API_SECRET,
  fromNumber: config.SENDBLUE_FROM_NUMBER,
  webhookSecret: config.SENDBLUE_WEBHOOK_SECRET,
  baseUrl: 'https://api.sendblue.co/api',
  statusCallbackUrl: `${config.APP_URL}/webhooks/sendblue/status`,
};
