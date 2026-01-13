# Hola

SMS-based Spanish language learning app powered by AI.

## Overview

Hola is a conversational Spanish tutor that lives in your text messages. It uses Sendblue for iMessage/SMS integration and Anthropic Claude for AI-powered conversations.

## Features

- **8-step onboarding** to personalize your learning experience
- **Daily lessons** delivered at your preferred time
- **AI-powered conversations** with level-appropriate responses
- **Spaced repetition** for vocabulary retention (SM-2 algorithm)
- **XP and streak system** to keep you motivated
- **Progress tracking** with /progress and /settings commands

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **SMS Gateway**: Sendblue
- **AI**: Anthropic Claude
- **Hosting**: Railway

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local development)
- Sendblue account
- Anthropic API key

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/ajluis/Hola.git
cd Hola
```

2. Install dependencies:
```bash
npm install
```

3. Start PostgreSQL and Redis:
```bash
docker compose up -d
```

4. Copy environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

5. Run migrations:
```bash
npm run migrate
```

6. Seed vocabulary:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

### Environment Variables

See `.env.example` for required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SENDBLUE_API_KEY` - Sendblue API key
- `SENDBLUE_API_SECRET` - Sendblue API secret
- `SENDBLUE_FROM_NUMBER` - Your Sendblue phone number
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `APP_URL` - Your app's public URL (for webhooks)

### Webhook Setup

Configure Sendblue to send webhooks to:
- Inbound: `{APP_URL}/webhooks/sendblue/inbound`
- Status: `{APP_URL}/webhooks/sendblue/status`

## Commands

Users can text these commands:

- `/progress` - View XP, streak, and level
- `/settings` - Adjust preferences
- `/words` - See vocabulary breakdown
- `/level` - Quick level check
- `/help` - Show available commands
- `/pause` - Pause lessons
- `/resume` - Resume lessons

## Project Structure

```
src/
  config/       # Configuration and connections
  db/           # Migrations and seeds
  middleware/   # Express middleware
  models/       # Database models
  routes/       # API routes
  services/     # Business logic
    claude/     # AI integration
    sendblue/   # SMS integration
  types/        # TypeScript types
```

## Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Add PostgreSQL and Redis services
3. Set environment variables
4. Deploy

The app will automatically run migrations on deploy via `railway.json`.

## License

ISC
