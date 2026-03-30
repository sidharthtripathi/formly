# Formly — AI-Powered Form Builder

An AI-powered form builder platform built with a Next.js frontend, Elysia/Bun API, PostgreSQL database, and MiniMax AI integration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), shadcn/ui, Tailwind, TanStack Query, Zustand, Framer Motion |
| Backend | Elysia (Bun), Drizzle ORM, PostgreSQL |
| Auth | better-auth with Google OAuth |
| AI | MiniMax M2.7 via Anthropic SDK |
| Payments | Stripe |
| Storage | Local filesystem or AWS S3 (toggle via env) |

## Project Structure

```
ai-form/
├── apps/
│   ├── api/          # Elysia API server (Bun)
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types and utilities
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- [Bun](https://bun.sh) >= 1.1.0
- [Docker](https://docker.com) (for PostgreSQL and local file storage)

## Setup

### 1. Clone and install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
# App URL (required for auth callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

# Auth (required — generate a secret: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-here

# Google OAuth (create at console.cloud.google.com)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (PostgreSQL)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/formly

# MiniMax AI (required for form generation)
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic

# Stripe (optional — for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Storage (local or s3)
STORAGE_MODE=local
# For S3:
# STORAGE_MODE=s3
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=us-east-1
# S3_BUCKET_NAME=your-bucket
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Push database schema

```bash
bun run db:push
```

### 5. Run the development server

```bash
bun run dev
```

This starts both the API (`http://localhost:3001`) and web (`http://localhost:3000`) apps via Turborepo.

## Development

### Run API only
```bash
cd apps/api && bun run dev
```

### Run web only
```bash
cd apps/web && bun run dev
```

### Build for production
```bash
bun run build
```

### Database migrations
```bash
bun run db:migrate   # Run migrations
bun run db:push      # Push schema (faster for development)
bun run db:studio    # Open Drizzle Studio
```

## Features

- **AI Form Generation** — Describe a form in natural language, AI builds it
- **30+ Field Types** — Text, selection, rating, matrix, file upload, payment, and more
- **Conditional Logic** — Show/hide fields based on answers
- **Multi-page Forms** — Page breaks and navigation
- **Themes & Branding** — Custom colors, logo, CSS
- **Analytics Dashboard** — Charts and conversational AI insights
- **Marketplace** — Share and discover form templates
- **Embed Codes** — Embed forms anywhere
- **Webhooks** — Get notified on form submissions
- **Stripe Payments** — Accept payments within forms
- **Scheduling** — Open/close forms on a schedule
- **Email Notifications** — Get emailed on new responses

## Routes

| Path | Description |
|------|-------------|
| `/` | Dashboard / landing |
| `/login` | Sign in with Google |
| `/builder/[formId]` | Form builder (AI assist + manual) |
| `/f/[slug]` | Public form filler |
| `/forms/[formId]/responses` | View responses |
| `/forms/[formId]/analytics` | Analytics dashboard |
| `/marketplace` | Browse shared templates |
| `/templates` | My saved templates |
