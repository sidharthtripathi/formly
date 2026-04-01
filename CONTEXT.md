# Formly - AI-Powered Form Builder

## Project Overview

Formly is an AI-first form builder platform where users create forms using natural language prompts. Built as a **Turborepo monorepo** with:

- **Frontend**: Next.js 15 (App Router) at `apps/web`
- **Backend**: Express.js API at `apps/server`
- **Shared**: Types and DB schema at `packages/shared`
- **Database**: PostgreSQL (Docker)
- **AI**: MiniMax M2.7 via Anthropic SDK
- **Payments**: Stripe

## Directory Structure

```
ai-form/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/         # Login/signup pages
│   │   │   ├── (dashboard)/    # Dashboard, builder, forms, templates, marketplace
│   │   │   ├── f/[slug]/       # Public form filler
│   │   │   └── api/proxy/      # Proxies to Express API
│   │   ├── components/         # React components
│   │   │   ├── builder/       # Form builder components (AI assist + manual modes)
│   │   │   ├── filler/        # Form filling components
│   │   │   ├── analytics/      # AI analysis & charts
│   │   │   ├── marketplace/   # Template marketplace
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── hooks/             # Custom React hooks (useAI, useForms, etc.)
│   │   ├── lib/               # Auth, API client, DB
│   │   └── stores/            # Zustand stores (formStore)
│   │
│   ├── server/                 # Express API (port 3001)
│   │   ├── src/
│   │   │   ├── index.ts       # Express app entry
│   │   │   ├── routes/        # API routes (forms, ai, responses, templates, etc.)
│   │   │   ├── middleware/    # Auth (JWT), rate limiting
│   │   │   └── services/      # Storage service (local/S3)
│   │   └── Dockerfile
│   │
│   └── api/                    # Empty placeholder
│
├── packages/
│   └── shared/                 # Shared types and DB schema
│       ├── types/
│       │   ├── form-schema.ts  # FormSchema, FormField, FieldType types
│       │   └── api.ts
│       └── db/
│           └── schema.ts       # Drizzle ORM schema (users, forms, responses, etc.)
│
├── docker-compose.yml           # Dev: PostgreSQL only
├── docker-compose.prod.yml     # Prod: web + server + postgres
├── Dockerfile                  # Multi-stage build
├── turbo.json
└── package.json
```

## Key Architecture Decisions

### Authentication
- **NextAuth.js v5** with JWT strategy
- Providers: Google OAuth + Credentials (email/password)
- Database adapter: DrizzleAdapter with PostgreSQL
- Users table has `passwordHash` for credentials auth

### API Communication
- Frontend proxies API calls through `apps/web/app/api/proxy/[...path]/route.ts`
- Express API at port 3001 uses `X-User-Id` header for auth
- JWT validated at Next.js edge middleware, user ID passed to Express

### Form Builder
Two editing modes (toggle in header):
1. **AI Assist Mode** - Split editor: chat left, live preview right
2. **Manual Mode** - Field list left, property panel right

### State Management
- **Zustand** with immer middleware for form schema (undo/redo support)
- **TanStack Query** for server state (forms, responses, templates, marketplace)
- **React Hook Form** for form filling validation

### Storage
- Unified storage service toggled via `STORAGE_MODE=local|s3`
- Local: Docker volume at `/app/uploads`
- S3: AWS SDK with presigned URLs

## Environment Variables

Key variables (see `.env.example`):
- `AUTH_SECRET` - NextAuth JWT secret
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` + `ANTHROPIC_BASE_URL` - MiniMax AI
- `STRIPE_SECRET_KEY` + `STRIPE_PRO_PRICE_ID` - Payments
- `STORAGE_MODE=local` - Storage backend toggle
- `NEXT_PUBLIC_API_URL=http://localhost:3001` - Express API URL

## Database Schema (Drizzle)

Tables: `users`, `forms`, `responses`, `templates`, `marketplace_listings`, `marketplace_upvotes`, `analysis_conversations`, `subscriptions`, `webhooks`, `collaborators`, `email_notifications`

NextAuth tables: `accounts`, `sessions`, `verification_tokens`

## API Routes (Express)

| Route | Description |
|-------|-------------|
| `POST/GET /api/forms` | Create/list forms |
| `GET/PATCH/DELETE /api/forms/:id` | Form CRUD |
| `POST /api/forms/:id/publish` | Publish form |
| `GET /api/forms/public/:slug` | Get published form (public) |
| `POST /api/forms/:id/responses` | Submit response (public) |
| `GET /api/forms/:id/responses` | List responses (authed) |
| `GET /api/ai/generate` | AI form generation (SSE) |
| `POST /api/ai/modify` | AI form modification (SSE) |
| `GET/POST /api/templates` | Personal templates |
| `GET/POST/DELETE /api/marketplace` | Marketplace |
| `POST /api/stripe/create-checkout` | Stripe checkout |
| `POST /api/uploads` | File upload |
| `POST /api/webhooks` | Webhook management |

## Important Notes for Agents

1. **Server is `apps/server`**, not `server/` at root
2. **API runs on port 3001**, Next.js frontend on port 3000
3. **Database user is `postgres`** in dev docker-compose, `formly` in prod
4. **Empty `apps/api` directory** is a placeholder, not used
5. **All form fields use `packages/shared/types/form-schema.ts`** as the canonical type
6. **Stripe webhooks** at `/webhooks/stripe` (raw body parsing enabled)
7. **Next.js middleware** protects routes via JWT, passes user ID via `X-User-Id` header to Express
8. **File uploads** served at `/uploads/:filename` when `STORAGE_MODE=local`

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, shadcn/ui, TanStack Query, Zustand, Framer Motion |
| Backend | Express 4, Node.js |
| Database | PostgreSQL 16, Drizzle ORM |
| Auth | NextAuth.js v5 (JWT), Google OAuth, bcrypt |
| AI | MiniMax M2.7 via @anthropic-ai/sdk |
| Payments | Stripe |
| Storage | Local filesystem or AWS S3 |
| Build | Turborepo, Bun |
