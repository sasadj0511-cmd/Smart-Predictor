# Render Deployment Guide

## Quick Start

This repository is configured for deployment on **Render**.

### Build Command
```bash
npm install && npm run build
```

### Start Command
```bash
npm start
```

## Environment Variables

Set these environment variables in Render dashboard:

### Required for AI Features
- `GEMINI_API_KEY` - Google Gemini API key
- `PERPLEXITY_API_KEY` - Perplexity AI API key

### Required for Notifications
- `TELEGRAM_BOT_TOKEN` - Telegram Bot token from BotFather
- `TELEGRAM_CHAT_ID` - Your personal Telegram Chat ID

### Required for Sports Data
- `SPORTMONKS_API_TOKEN` - Sportmonks API token (optional, app has fallback)

### Application
- `APP_URL` - Your app's public URL (e.g., https://your-app.onrender.com)
- `NODE_ENV` - Set to `production`

## Configuration Files

- **render.yaml** - Render deployment configuration (auto-detected)
- **.env.example** - Environment variables template
- **package.json** - Build scripts and dependencies

## How It Works

1. Render reads `render.yaml` for build/start commands
2. Build phase: `npm install && npm run build` (Vite transpiles React + TypeScript)
3. Start phase: `npm start` (runs with `tsx` for TypeScript execution)
4. Express server starts on PORT provided by Render (defaults to 3000)
5. Vite static assets served from `dist/` folder

## Troubleshooting

### Build fails with TypeScript errors
- Check `package.json` has `tsx` in `dependencies` (not devDependencies)
- Verify `npm run lint` passes locally

### App crashes on startup
- Ensure all required env vars are set in Render dashboard
- Check `.env.example` for required variables
- Missing optional keys (SPORTMONKS_API_TOKEN) should not crash

### Port binding issues
- Server reads `process.env.PORT` from Render
- Default fallback to 3000 if not set
- Render automatically assigns PORT to avoid conflicts

## Support

For questions:
- Check GitHub Issues
- Review `.env.example` for variable descriptions
- Render docs: https://render.com/docs
