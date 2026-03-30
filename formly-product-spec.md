# Formly — Full Product Specification
**Version:** 1.1  
**Date:** March 2026  
**Stack:** Next.js 15 · Elysia/Bun · PostgreSQL · Turborepo · Vercel / Docker Compose  
**AI Model:** MiniMax M2.7 via Anthropic SDK  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Research: Form Types & Field Types](#2-research-form-types--field-types)
3. [System Architecture](#3-system-architecture)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication](#6-authentication)
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 [Home Screen](#71-home-screen)
   - 7.2 [Builder Modes Overview](#72-builder-modes-overview)
   - 7.3 [AI Assist Mode (Split Editor)](#73-ai-assist-mode-split-editor)
   - 7.4 [Manual Mode (Direct Editor)](#74-manual-mode-direct-editor)
   - 7.5 [Form Schema (Internal JSON Model)](#75-form-schema-internal-json-model)
   - 7.6 [Conditional Logic](#76-conditional-logic)
   - 7.7 [Publishing a Form](#77-publishing-a-form)
   - 7.8 [Form Filler (Public / Authenticated)](#78-form-filler-public--authenticated)
   - 7.9 [Response Management & Export](#79-response-management--export)
   - 7.10 [AI Analysis (Pro Feature)](#710-ai-analysis-pro-feature)
   - 7.11 [Templates — Personal & Marketplace](#711-templates--personal--marketplace)
   - 7.12 [Sidebar — Published Forms Manager](#712-sidebar--published-forms-manager)
8. [API Design](#8-api-design)
9. [AI Integration Details](#9-ai-integration-details)
10. [Stripe Subscription Tiers](#10-stripe-subscription-tiers)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Deployment](#12-deployment)
13. [Environment Variables](#13-environment-variables)
14. [Premade Template Library](#14-premade-template-library)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Open Questions & Future v2 Scope](#16-open-questions--future-v2-scope)

---

## 1. Product Overview

**Formly** is an AI-first form builder platform where any authenticated user can create, publish, and manage forms using natural language prompts. The builder supports two editing modes — **AI Assist Mode** (chat-driven, AI generates and modifies fields) and **Manual Mode** (direct drag-and-drop field editing with an inline property panel) — so creators are never blocked from editing their forms even when AI credits are exhausted. The AI generates and refines forms in real time. Once published, forms can be filled by anyone (anonymous mode) or by authenticated Google users only (private mode). Responses are viewable in-app with CSV export, and a paid Pro tier unlocks AI-powered conversational data analysis with dynamic chart generation.

### Core User Roles

| Role | Description |
|------|-------------|
| **Creator** | Authenticated user who creates and manages forms |
| **Respondent** | Anyone who fills a published form (Google auth required if form is private) |

There is **no platform-level admin**. All users are equal creators. Marketplace templates are user-generated and community-upvoted.

---

## 2. Research: Form Types & Field Types

### 2.1 Most Common Form Categories (for Marketplace & Template Library)

Based on industry data, the most frequently used form types on the internet are:

| # | Form Type | Primary Use Case |
|---|-----------|-----------------|
| 1 | **Contact Form** | Inquiries, support messages |
| 2 | **Registration / Sign-up Form** | Events, accounts, memberships |
| 3 | **Survey Form** | Market research, opinion gathering |
| 4 | **Feedback / NPS Form** | Product/service satisfaction |
| 5 | **Lead Generation Form** | Capture email + details for marketing |
| 6 | **Job Application Form** | Recruiting |
| 7 | **Order / Checkout Form** | E-commerce purchases |
| 8 | **Booking / Appointment Form** | Scheduling services |
| 9 | **Quiz / Assessment Form** | Education, scoring, trivia |
| 10 | **Newsletter Subscription Form** | Email list building |
| 11 | **Event RSVP Form** | Attendance confirmation |
| 12 | **Onboarding Form** | User setup, intake questionnaires |
| 13 | **Medical / Health Intake Form** | Patient information |
| 14 | **Bug Report / Support Ticket** | Developer/IT workflows |
| 15 | **File Upload / Submission Form** | Document collection |
| 16 | **Petition / Pledge Form** | Advocacy, social causes |
| 17 | **Waiver / Consent Form** | Legal acknowledgement |
| 18 | **Request Form** | Internal IT, HR, procurement |
| 19 | **Comparison / Calculator Form** | Quoting, pricing estimators |
| 20 | **Conversational / Chat Form** | One-question-at-a-time UX |

### 2.2 Supported Field / Input Types

Formly must support all standard field types the AI can generate and the user can manually configure:

#### Text Inputs
- `short_text` — Single-line text
- `long_text` — Multi-line textarea
- `email` — Email with validation
- `phone` — Phone number with optional country selector
- `url` — URL with validation
- `number` — Numeric input with min/max/step
- `password` — Masked input (for registration-style forms)

#### Selection Inputs
- `single_choice` — Radio buttons (choose one)
- `multiple_choice` — Checkboxes (choose many)
- `dropdown` — Select from dropdown list
- `multi_select_dropdown` — Multi-select dropdown
- `yes_no` — Boolean toggle
- `rating` — Star rating (1–5 or 1–10)
- `nps` — Net Promoter Score (0–10 scale)
- `likert_scale` — Agreement scale (Strongly Disagree → Strongly Agree)
- `ranking` — Drag-to-rank ordered list

#### Date & Time
- `date` — Date picker
- `time` — Time picker
- `date_time` — Combined date-time picker
- `date_range` — Start and end date

#### Media & File
- `file_upload` — Single or multiple file upload with MIME type restrictions
- `image_upload` — Image-only upload with preview
- `signature` — Draw/type signature

#### Layout & Display
- `section_header` — Non-input, decorative heading/divider between fields
- `statement` — Non-input text block (instructions, descriptions)
- `page_break` — Separates form into pages (triggers multi-page mode)

#### Advanced / Special
- `matrix` — Grid of rows × columns (e.g. rate multiple items on same scale)
- `slider` — Numeric value picker on a range slider
- `address` — Structured address block (street, city, state, country, zip)
- `hidden_field` — Pre-filled field not visible to respondent (e.g. UTM params)
- `calculated_field` — Value derived from other fields via formula
- `payment` — Stripe-powered payment input (v2)

### 2.3 Form Structure Patterns

- **Single Page** — All fields on one screen, submit at bottom
- **Multi-Page / Step Form** — Fields grouped into pages with progress bar, back/next navigation
- **Conversational Form** — One field shown at a time, chat-like UX
- **Conditional / Branching Form** — Fields/pages shown/hidden based on previous answers

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Turborepo Monorepo                   │
│                                                          │
│  ┌─────────────────┐       ┌──────────────────────────┐  │
│  │  apps/web        │       │  apps/api                 │  │
│  │  Next.js 15      │◄─────►│  Elysia + Bun             │  │
│  │  App Router      │  HTTP │  REST + SSE               │  │
│  │  Shadcn + Motion │       │  Anthropic SDK (MiniMax)  │  │
│  └─────────────────┘       └──────────┬───────────────┘  │
│                                        │                   │
│  ┌─────────────────┐       ┌──────────▼───────────────┐  │
│  │  packages/       │       │  PostgreSQL (self-hosted) │  │
│  │  shared          │       │  (Docker volume)         │  │
│  │  (types, utils,  │       └──────────────────────────┘  │
│  │   form schema)   │                                      │
│  └─────────────────┘                                      │
└──────────────────────────────────────────────────────────┘
```

### Technology Choices

| Concern | Technology | Reason |
|---------|-----------|--------|
| Frontend | Next.js 15 (App Router) | Server components, streaming, Vercel-native |
| UI Components | shadcn/ui + Tailwind | Accessible, composable, customisable |
| Animations | Framer Motion | Smooth split-editor transitions, AI streaming |
| Server State | TanStack Query (React Query) v5 | Caching, optimistic updates, SSE hooks |
| Client State | Zustand | Lightweight, no boilerplate (replaces Recoil) |
| Backend Framework | Elysia on Bun | Type-safe, blazing fast, Eden treaty for type-safe client |
| Database | PostgreSQL (self-hosted via Docker) | ACID, JSON support, relational responses |
| ORM | Drizzle ORM | Type-safe, Bun-compatible, SQL-first |
| Auth | better-auth | Google OAuth + Email/Password, database sessions, lighter than NextAuth |
| Payments | Stripe | Subscription management |
| AI | MiniMax M2.7 via Anthropic SDK | Streaming form generation and analysis |
| File Storage | **Unified storage service** — local Docker volume or S3 (toggle via `STORAGE_MODE` env) | Simple for local dev, S3-compatible for production |
| Email | Resend | Transactional (form submission confirmations) |

> **Note on Zustand vs Recoil:** Zustand is recommended over Recoil because Recoil is no longer actively maintained by Meta. Zustand is smaller, simpler, and works perfectly with React Query for this use case.

---

## 4. Monorepo Structure

```
formly/
├── apps/
│   ├── web/                          # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/            # Login page (Google OAuth + email/password)
│   │   │   │   └── signup/           # Signup page (Google OAuth + email/password)
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx          # Home screen (prompt box)
│   │   │   │   ├── builder/
│   │   │   │   │   └── [formId]/     # Split-editor builder
│   │   │   │   ├── templates/        # Personal saved templates
│   │   │   │   ├── marketplace/      # Public template marketplace
│   │   │   │   └── forms/
│   │   │   │       └── [formId]/
│   │   │   │           ├── responses/  # Response viewer
│   │   │   │           └── analytics/  # AI analysis chat
│   │   │   ├── f/
│   │   │   │   └── [publicSlug]/     # Public form filler (no auth wrapper)
│   │   │   └── api/
│   │   │       └── auth/             # better-auth route handlers
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn components
│   │   │   ├── builder/              # Editor-specific components
│   │   │   ├── filler/               # Form filling components
│   │   │   ├── marketplace/
│   │   │   └── analytics/
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api-client.ts         # Elysia Eden treaty client
│   │   │   ├── auth.ts               # better-auth config
│   │   │   └── query-client.ts
│   │   └── stores/                   # Zustand stores
│   │
│   └── api/                          # Elysia + Bun backend
│       ├── src/
│       │   ├── index.ts              # App entry point
│       │   ├── routes/
│       │   │   ├── forms.ts
│       │   │   ├── ai.ts             # AI streaming endpoints (SSE)
│       │   │   ├── responses.ts
│       │   │   ├── templates.ts
│       │   │   ├── marketplace.ts
│       │   │   ├── users.ts
│       │   │   ├── stripe.ts
│       │   │   ├── uploads.ts        # File upload (local or S3)
│       │   │   ├── webhooks.ts      # Webhook delivery
│       │   │   └── static.ts        # Local file serving
│       │   ├── db/
│       │   │   ├── schema.ts         # Drizzle schema
│       │   │   ├── schema-extensions.ts # Webhooks, themes, collaborators
│       │   │   ├── migrations/
│       │   │   └── index.ts          # DB connection
│       │   ├── services/
│       │   │   ├── ai.service.ts     # MiniMax calls via Anthropic SDK
│       │   │   ├── storage.ts        # Unified storage (local/S3)
│       │   │   ├── form.service.ts
│       │   │   ├── export.service.ts # CSV/Excel generation
│       │   │   └── stripe.service.ts
│       │   └── middleware/
│       │       ├── auth.ts           # JWT validation
│       │       └── rate-limit.ts
│       └── Dockerfile
│
├── packages/
│   └── shared/
│       ├── types/
│       │   ├── form-schema.ts        # The canonical FormSchema type
│       │   └── api.ts                # Shared API types
│       └── utils/
│           └── form-validators.ts
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── turbo.json
├── package.json                      # Root workspace config (bun)
└── .env.example
```

---

## 5. Database Schema

All tables use `uuid` as primary keys. Timestamps are `timestamptz`.

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  -- AI credit tracking (resets monthly via cron/Stripe billing cycle)
  ai_credits_used INT DEFAULT 0,          -- total used this billing period
  ai_credits_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forms
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,           -- FormSchema (see section 7.3)
  is_published BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  public_slug TEXT UNIQUE,         -- URL-friendly slug for /f/:slug
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL if anonymous
  answers JSONB NOT NULL,           -- { fieldId: value }
  metadata JSONB,                   -- { userAgent, ip (hashed), submittedAt }
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,  -- true = listed in marketplace
  source_form_id UUID REFERENCES forms(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace (public templates)
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                    -- e.g. "Survey", "Job Application"
  tags TEXT[],
  upvote_count INT DEFAULT 0,
  copy_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Upvotes (junction table, one per user per listing)
CREATE TABLE marketplace_upvotes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- AI Analysis Conversations
CREATE TABLE analysis_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]',  -- [{role, content, chartSpec?}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Stripe webhook synced)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT,                      -- active, canceled, past_due
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks (V2)
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,          -- ['form.submission.created', 'form.published', ...]
  secret TEXT,
  form_id UUID,                     -- NULL = all forms
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Themes / Branding (V2)
CREATE TABLE form_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  colors JSONB,                     -- { primary, background, text, border }
  logo_url TEXT,
  font_family TEXT,
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Collaborators (V2)
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',  -- viewer, editor, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_id, user_id)
);

-- Email Notifications (V2)
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL,
  type TEXT NOT NULL,               -- new_response, daily_digest, weekly_digest
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Indexes

```sql
CREATE INDEX idx_forms_owner ON forms(owner_id);
CREATE INDEX idx_forms_slug ON forms(public_slug);
CREATE INDEX idx_responses_form ON responses(form_id);
CREATE INDEX idx_templates_owner ON templates(owner_id);
CREATE INDEX idx_marketplace_category ON marketplace_listings(category);
CREATE INDEX idx_marketplace_upvotes ON marketplace_listings(upvote_count DESC);
```

---

## 6. Authentication

### Strategy
- **Google OAuth + Email/Password** — for both creators and respondents
- **better-auth** handles auth on the Next.js side
- **Database sessions** — session stored in DB, passed as `Authorization: Bearer <token>` to the Elysia API
- The API validates the session token against the DB

### Session Flow
```
# Email/Password
User → Sign up with Email/Password → Create user in DB → Issue session token
User → Sign in with Email/Password → Validate credentials → Issue session token

# Google OAuth
User → "Sign in with Google" → Google OAuth → better-auth callback
→ Create/update user in DB → Issue session token

# API Authorization
→ Subsequent API calls include Authorization header
→ Elysia middleware validates token → attaches user to context
```

### Protected Routes
- **Creator routes** (`/builder/*`, `/forms/*`, `/templates/*`, `/marketplace/my`) — require auth
- **Form filler** (`/f/:slug`) — conditionally protected based on `form.is_anonymous`
- **Marketplace browse** (`/marketplace`) — public, no auth needed

---

## 7. Feature Specifications

### 7.1 Home Screen

**Route:** `/` (authenticated)

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  [≡ Sidebar]    formly              [Avatar + Name] │
├────────────────────────────────────────────────────┤
│                                                    │
│      Create a form with AI                         │
│   ┌──────────────────────────────────────────┐     │
│   │  Describe the form you want to create... │     │
│   │                                          │     │
│   └──────────────────────────────────────────┘     │
│              [ ✨ Generate Form ]                   │
│                                                    │
│   ─────────── or start with ─────────────          │
│                                                    │
│   [ 🏪 Marketplace ]  [ 📋 My Templates ]          │
│                                                    │
│   ─────── Quick Templates ────────────             │
│   [Contact Form] [Survey] [Job App] [Feedback]     │
│   [Event RSVP]   [Quiz]   [Lead Gen] [Booking]     │
└────────────────────────────────────────────────────┘
```

**Sidebar (closable, persistent state):**
- Lists all published forms belonging to the creator
- Each item shows: form title, response count, status badge (Published / Draft / Closed)
- Click → opens form management (responses, analytics, edit)
- "New Form" shortcut at top of sidebar

**Quick Templates:**
- 8–12 one-click template cards (see Section 14 for the full list)
- Clicking a quick template skips the prompt step and opens the builder with a pre-generated schema

**Behaviour on Prompt Submit:**
1. User types prompt → hits Enter or clicks "Generate Form"
2. Navigate to `/builder/new` with the prompt as query param (or session state)
3. Builder screen loads and AI immediately begins streaming the form

---

### 7.2 Builder Modes Overview

Every form — whether created from a prompt, a template, or the marketplace — opens in the **builder**. The builder has two modes that the creator can switch between at any time using a toggle in the header:

| | AI Assist Mode | Manual Mode |
|---|---|---|
| **Primary interaction** | Natural language prompt chat | Click-to-edit field properties |
| **Layout** | Split: AI chat left / form preview right | Single-screen: field list + inline property panel |
| **Field selection** | Click field to tag it as AI context (`@fieldname`) | Click field to open its property editor |
| **When AI credits run out** | Automatically switches to Manual Mode | Already in Manual Mode |
| **Who can use it** | Free (within credit limit) + Pro | Everyone, always |

#### Mode Switch Behaviour

- A **mode toggle** (e.g. `[✨ AI Assist] [✏ Manual]`) lives in the builder header
- Switching modes is instant — the form schema is unchanged, only the UI reconfigures
- **Automatic fallback:** When a Free user exhausts their monthly AI credits, the builder detects this on the next AI call, shows a non-blocking toast — *"AI credits used up. You've been switched to Manual Mode. Upgrade to Pro for unlimited AI."* — and switches to Manual Mode. The user can still edit, add, delete, and reorder fields manually without any restriction.
- Pro users always have AI Assist available and are never auto-switched

#### Credit Consumption Rules

- **1 credit** = one AI prompt submission (whether it modifies 1 field or the whole form)
- Credit count increments on the API side before streaming begins
- If a user hits their limit mid-prompt, the current generation is completed (not cut off) but the next prompt will be blocked in AI Assist Mode
- Credits reset at the start of each calendar month (midnight UTC on the 1st)

---

### 7.3 AI Assist Mode (Split Editor)

**Route:** `/builder/[formId]` (default mode on first open; persists user's last-used mode per form in `localStorage`)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back   formly   [Form Title - editable]  [✨AI ●|Manual]  [Publish] │
├──────────────────────────────────────────────────────────────┤
│   LEFT PANEL (40%)          │   RIGHT PANEL (60%)            │
│   AI Chat Interface         │   Live Form Preview            │
│                             │                                │
│  ┌─────────────────────┐    │   ┌──────────────────────────┐ │
│  │ Conversation log    │    │   │                          │ │
│  │                     │    │   │   [Rendered Form Fields] │ │
│  │ 🤖 Added 3 fields:  │    │   │                          │ │
│  │    Name, Email,     │    │   │  ┌──────────────────────┐│ │
│  │    Message          │    │   │  │ Full Name *   [  ]  ││ │
│  │                     │    │   │  └──────────────────────┘│ │
│  │ 👤 Make email       │    │   │  ┌──────────────────────┐│ │
│  │    optional         │    │   │  │ Email        [  ]  ││ │
│  │                     │    │   │  └──────────────────────┘│ │
│  │ 🤖 Done — email     │    │   │                          │ │
│  │    is now optional  │    │   └──────────────────────────┘ │
│  └─────────────────────┘    │                                │
│                             │                                │
│  Selected: @Email Field  ✕  │                                │
│  ┌─────────────────────┐    │                                │
│  │ Type your prompt... │    │                                │
│  │                   ↵ │    │                                │
│  └─────────────────────┘    │                                │
│  [⏹ Stop]  Credits: 14/20   │                                │
└─────────────────────────────┴────────────────────────────────┘
```

#### Left Panel — AI Chat Interface
- **Conversation history** shows the back-and-forth log: user prompts and AI confirmations (e.g. "Added 3 fields: Name, Email, Message")
- **Field Selector Tag:** Clicking any field in the right panel highlights it and injects an `@FieldName` badge into the prompt input box. The AI uses this to scope changes to that specific field. Multiple fields can be tagged.
- **Prompt input:** Textarea at the bottom. Submits on Enter (Shift+Enter = newline).
- **While generating:** Input is disabled. A **⏹ Stop** button aborts the stream. The right panel updates progressively as tokens arrive.
- **After generation:** Input re-enables, conversation log updates with the AI's summary of changes.
- **Credit counter:** Shown below the input as `Credits: X / 20` for Free users. Hidden for Pro. When X = 0, input is replaced with an upgrade nudge + a "Switch to Manual Mode" button.

#### Right Panel — Live Form Preview
- Fully interactive preview rendered from the live `FormSchema`
- Fields are **clickable** — clicking a field highlights it (blue ring) and injects `@FieldName` into the left panel prompt input
- Multi-page forms show page tabs + progress bar at the top of the preview panel
- The preview scrolls independently
- On hover over any field, a **mini toolbar** appears: `[✏ Edit manually] [↕ Drag to reorder] [🗑 Delete]` — these actions work directly in AI Assist Mode too and do not consume credits

#### Auto-Save
- Schema is auto-saved to the DB with 1-second debounce after any change (AI or manual)
- Header shows a "Saving…" → "Saved ✓" indicator

#### Undo / Redo
- Every AI response or manual change pushes a schema snapshot to the Zustand undo stack (max 20)
- Standard `Ctrl+Z` / `Ctrl+Y` — works across both AI and manual edits

---

### 7.4 Manual Mode (Direct Editor)

**Route:** Same `/builder/[formId]`, toggled via the mode switch in the header

**When it applies:**
- User explicitly toggles to Manual Mode
- Free user's AI credits are exhausted (auto-switched)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back   formly   [Form Title - editable]  [AI|Manual ●]  [Publish] │
├────────────────────────────────────────┬────────────────────────┤
│  FIELD LIST (50%)                      │  PROPERTY PANEL (50%)  │
│                                        │                        │
│  Pages:  [Page 1 ●] [+ Add Page]       │  (no field selected)   │
│  ─────────────────────────────────     │  Select a field to     │
│                                        │  edit its properties   │
│  [+ Add Field ▾]  ← dropdown of all   │                        │
│    field types                         │                        │
│                                        │                        │
│  ┌───────────────────────────────┐     │                        │
│  │ ⠿  Full Name        short_text│     │                        │
│  │    Required ●                 │     │                        │
│  └───────────────────────────────┘     │                        │
│  ┌───────────────────────────────┐     │  ← Click any field     │
│  │ ⠿  Email Address    email    │     │     to open its        │
│  │    Optional                   │     │     property panel     │
│  └───────────────────────────────┘     │                        │
│  ┌───────────────────────────────┐     │                        │
│  │ ⠿  Message          long_text │     │                        │
│  │    Required ●                 │     │                        │
│  └───────────────────────────────┘     │                        │
│                                        │                        │
│  [+ Add Field ▾]                       │                        │
└────────────────────────────────────────┴────────────────────────┘
```

**When a field is selected, the right Property Panel shows:**

```
┌────────────────────────────────────────┐
│  ✏ Editing: Email Address              │
│                                        │
│  Field Type:  [email          ▾]       │
│  Label:       [Email Address      ]    │
│  Placeholder: [you@example.com    ]    │
│  Help Text:   [                   ]    │
│  Required:    [Toggle: OFF]            │
│                                        │
│  ── Validation ──                      │
│  (email type has no extra validation)  │
│                                        │
│  ── Conditional Logic ──               │
│  [+ Add Rule]                          │
│  (no rules yet)                        │
│                                        │
│  [🗑 Delete Field]                     │
└────────────────────────────────────────┘
```

#### Field List Behaviour
- Fields are **drag-and-drop reorderable** within a page (using `@dnd-kit/sortable`)
- Drag handle (`⠿`) on the left of each field card
- Each card shows: field label, field type badge, required/optional indicator
- Click any card → opens its Property Panel on the right
- Active/selected card has a highlighted border

#### Adding Fields
- `[+ Add Field ▾]` button opens a dropdown grouped by category (Text, Selection, Date & Time, Media, Layout, Advanced)
- Selecting a type instantly appends a new field with sensible defaults to the current page
- New field is auto-selected, Property Panel opens immediately for the creator to fill in the label

#### Property Panel — Per Field Type Details
Every field type exposes relevant properties. Examples:

| Field Type | Extra Properties Shown |
|-----------|----------------------|
| `short_text` / `long_text` | Min/max length, regex pattern |
| `single_choice` / `multiple_choice` | Options list (add/remove/reorder inline), allow "Other" toggle |
| `dropdown` / `multi_select_dropdown` | Same options editor |
| `rating` | Max rating (5 or 10), icon style (star/heart/number) |
| `nps` | Low label / High label text |
| `likert_scale` | Scale labels (Strongly Disagree → Strongly Agree), number of points |
| `slider` | Min, Max, Step, show value label toggle |
| `matrix` | Row labels editor, column labels editor |
| `file_upload` | Allowed MIME types (multi-select), max file size (MB), multiple files toggle |
| `date` / `time` | Min/max date, default value |
| `hidden_field` | Default value (static string or `{{url_param}}` syntax) |
| `page_break` | Page title, page description |
| `section_header` | Heading text, subtext |
| `statement` | Body text (rich text editor — bold, italic, links) |

#### Conditional Logic in Manual Mode
- Each field's Property Panel has a **"Conditional Logic"** section at the bottom
- Creator clicks `[+ Add Rule]` to add a condition:
  - **If** [field dropdown] [operator dropdown] [value input]
  - **Then** [action dropdown: show / hide / jump to page / require] [target field/page dropdown]
- Multiple rules stack (AND logic)
- Rules are displayed as readable pills: *"If Country = 'Other' → Show: Specify Country"*

#### Pages in Manual Mode
- Page tabs shown at the top of the field list
- `[+ Add Page]` appends a new blank page
- Right-click a page tab → rename / delete page
- Dragging a field card to a different page tab moves the field

#### Credit Banner (when auto-switched from AI Assist Mode)
- A non-intrusive yellow banner at the top of the builder reads:
  *"You've used all your AI credits for this month. You're now in Manual Mode. [Upgrade to Pro →]"*
- Banner is dismissible (stores dismiss state in `localStorage`)
- The mode toggle in the header still shows both options — clicking AI Assist when credits are 0 shows a modal: *"You've run out of AI credits. Upgrade to Pro for unlimited AI, or wait until [reset date]."*

---

### 7.5 Form Schema (Internal JSON Model)

All forms are stored and transmitted as a canonical `FormSchema` JSON object. This is the single source of truth for both the AI output and the form renderer.

```typescript
// packages/shared/types/form-schema.ts

export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'url' | 'number' | 'password'
  | 'single_choice' | 'multiple_choice' | 'dropdown' | 'multi_select_dropdown'
  | 'yes_no' | 'rating' | 'nps' | 'likert_scale' | 'ranking'
  | 'date' | 'time' | 'date_time' | 'date_range'
  | 'file_upload' | 'image_upload' | 'signature'
  | 'section_header' | 'statement' | 'page_break'
  | 'matrix' | 'slider' | 'address' | 'hidden_field' | 'calculated_field';

export interface FieldOption {
  id: string;          // uuid
  label: string;
  value: string;
}

export interface ConditionalRule {
  fieldId: string;     // source field
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
  action: 'show' | 'hide' | 'jump_to_page' | 'require';
  targetId: string;    // target field id OR page id
}

export interface FormField {
  id: string;          // uuid
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  pageIndex: number;   // 0-based, which page this field belongs to
  order: number;       // order within the page
  options?: FieldOption[];          // for choice fields
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;              // regex
    allowedFileTypes?: string[];   // e.g. ['.pdf', '.png']
    maxFileSizeMb?: number;
  };
  matrixRows?: string[];           // for matrix type
  matrixColumns?: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  ratingMax?: number;              // 5 or 10
  hiddenDefaultValue?: string;     // for hidden_field
  calculatedFormula?: string;      // for calculated_field
  conditions?: ConditionalRule[];  // field-level conditions
}

export interface FormPage {
  id: string;
  index: number;
  title?: string;
  description?: string;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  pages: FormPage[];
  fields: FormField[];
  settings: {
    showProgressBar: boolean;
    allowMultipleSubmissions: boolean;
    successMessage: string;
    redirectUrl?: string;
    formStyle?: 'default' | 'conversational';
  };
  version: number;     // incremented on every AI edit (for undo history)
}
```

---

### 7.6 Conditional Logic

Conditions are stored per-field in `field.conditions[]`. The form renderer evaluates them client-side in real time.

**Supported Actions:**
- `show` / `hide` — show or hide a target field
- `jump_to_page` — skip to a specific page (multi-page forms)
- `require` — dynamically mark a field as required

**Evaluation:**
- All conditions for a field are evaluated after every input change
- Multiple conditions on the same field are AND-ed by default
- The AI understands conditional logic from natural language: *"If the user selects 'Other' in the country dropdown, show a text field asking them to specify"*

**Example:**
```json
{
  "fieldId": "country_dropdown_id",
  "operator": "equals",
  "value": "Other",
  "action": "show",
  "targetId": "country_specify_text_id"
}
```

---

### 7.7 Publishing a Form

**Trigger:** "Publish" button in the builder header.

**Publishing Modal:**
```
┌─────────────────────────────────────────┐
│  Publish Form                           │
│                                         │
│  Who can fill this form?                │
│  ○ Anyone (Anonymous)                   │
│    No login required for respondents    │
│  ● Authenticated Users Only             │
│    Respondents must sign in (Google or Email/Password) │
│                                         │
│  Allow multiple submissions?            │
│  [Toggle: OFF]                          │
│                                         │
│  Public URL (auto-generated):           │
│  formly.app/f/summer-feedback-2024      │
│  [Copy Link]  [Regenerate slug]         │
│                                         │
│          [ Cancel ]  [ Publish ✓ ]      │
└─────────────────────────────────────────┘
```

**Slug Generation:**
- Auto-generated from form title (slugified) + 4-char random suffix for uniqueness
- Creator can regenerate if they want a cleaner URL

**Post-Publish:**
- Form status → `published`
- Public URL is live immediately
- Creator is returned to the builder, which now shows a green "Published" badge
- A toast shows the shareable link with a copy button

**Editing After Publish:**
- Creator can return to `/builder/[formId]` at any time and continue prompting
- Changes are saved as a new schema version
- The live form at `/f/:slug` is updated immediately (no versioning for respondents in v1)

---

### 7.8 Form Filler (Public / Authenticated)

**Route:** `/f/[publicSlug]`

**Access Control:**
- If `form.is_anonymous = true` → anyone can access, no login needed
- If `form.is_anonymous = false` → middleware redirects to sign-in, then back to the form

**Filler UX:**
```
┌──────────────────────────────────┐
│  [Form Title]                    │
│  [Form Description]              │
│                                  │
│  ████████░░░░░░░  Step 2 of 4   │  ← Progress bar (multi-page)
│                                  │
│  Question 1                      │
│  [Input Field]                   │
│                                  │
│  Question 2                      │
│  [Input Field]                   │
│                                  │
│       [ ← Back ]  [ Next → ]     │
└──────────────────────────────────┘
```

**Behaviour:**
- Single-page forms: All fields visible, single "Submit" button
- Multi-page forms: Page-by-page navigation, progress bar, back/next buttons
- Conversational forms: One field at a time, animated transition between fields
- Conditional logic evaluated in real time as user fills fields
- Client-side validation before advancing pages or submitting
- On submit → POST to `/api/responses` → success message shown or redirect URL

**Closed / Not Found states:**
- If `form.status = 'closed'` → show "This form is no longer accepting responses"
- If form not found → 404 page

---

### 7.9 Response Management & Export

**Route:** `/forms/[formId]/responses`

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  ← Forms    "Summer Feedback Form"    [Export CSV ↓]       │
├────────────────────────────────────────────────────────────┤
│  Total Responses: 142   Completion Rate: 87%               │
├────────────────────────────────────────────────────────────┤
│  [Filter by date]  [Search]                                │
├────────┬───────────┬───────────────┬────────────────────── │
│  #     │ Submitted │ Respondent    │  Q1        │ Q2  ...  │
├────────┼───────────┼───────────────┼────────────┼──────── │
│  1     │ Mar 12    │ john@...      │  Great!    │ 5 ★  ... │
│  2     │ Mar 13    │ Anonymous     │  Good      │ 4 ★  ... │
├────────┴───────────┴───────────────┴────────────┴──────── │
│  [← Prev]  Page 1 of 8  [Next →]                          │
└────────────────────────────────────────────────────────────┘
```

**Export:**
- `GET /api/forms/:id/responses/export?format=csv`
- Returns a CSV file with one row per response, one column per field
- File is streamed, not buffered — handles large response sets efficiently

**In-App View:**
- Paginated table (20 rows per page)
- Click any row to expand the full response in a side-drawer
- Filter by date range
- Search across text responses

---

### 7.10 AI Analysis (Pro Feature)

**Route:** `/forms/[formId]/analytics`

**Access Control:** Pro plan required. Free users see a locked state with upgrade CTA.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  ← Responses    AI Analysis    "Summer Feedback"     │
├────────────────────────────┬─────────────────────────┤
│   CHAT PANEL (left)        │   VISUALISATION (right) │
│                            │                         │
│   AI: Here's a summary of  │   [Chart renders here]  │
│   your 142 responses...    │                         │
│                            │   e.g. Pie chart of     │
│   "What % gave 5 stars?"   │   rating distribution   │
│                            │                         │
│   AI: 34% of respondents   │   [Dynamic chart from   │
│   gave a 5-star rating...  │    AI-generated spec]   │
│                            │                         │
│   [Type your question...↵] │                         │
└────────────────────────────┴─────────────────────────┘
```

**How It Works:**
1. User opens analytics → system sends all response data + form schema to AI as context
2. AI generates an initial summary (key stats, completion rate, notable trends)
3. User can ask follow-up questions in natural language
4. When a question implies a visualisation ("show me a pie chart of..."), the AI returns a **chart specification JSON** alongside the text answer
5. The chart spec is rendered client-side using **Recharts**

**Chart Spec Format (AI returns this JSON):**
```json
{
  "type": "pie" | "bar" | "line" | "scatter" | "histogram",
  "title": "Rating Distribution",
  "data": [
    { "label": "5 Stars", "value": 48 },
    { "label": "4 Stars", "value": 35 }
  ],
  "xAxis": "label",
  "yAxis": "value"
}
```

The frontend has a `<ChartRenderer chartSpec={...} />` component that maps `type` to the appropriate Recharts component. The AI generates this JSON embedded in its response, and the frontend parses it out.

**Conversation Persistence:**
- Chat history stored in `analysis_conversations` table
- Resumable across sessions

**Rate Limits (Pro):**
- 100 AI analysis messages per month per user
- Shown as a usage counter in the UI

---

### 7.11 Templates — Personal & Marketplace

#### Personal Templates

**Route:** `/templates`

- List of templates saved by the current user
- Each card shows: title, description, last used date, "Use Template" / "Edit" / "Publish to Marketplace" / "Delete"
- **Saving a template:** From the builder, a "Save as Template" button in the header opens a modal asking for template title and description. The current form schema is saved as a template.
- **Using a template:** Clicking "Use Template" creates a new form pre-populated with the template's schema and opens the builder. The user can then prompt the AI to modify it.

#### Marketplace

**Route:** `/marketplace`

```
┌────────────────────────────────────────────────────┐
│  🏪 Marketplace                  [Search...]       │
│                                                    │
│  [All] [Survey] [Contact] [Job App] [Feedback] ... │
│                                                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ 📋 NPS Survey│  │ 📋 Job App   │               │
│  │ by @priya    │  │ by @carlos   │               │
│  │ ▲ 241        │  │ ▲ 189        │               │
│  │ 📋 1.2k used │  │ 📋 934 used  │               │
│  │ [Use This]   │  │ [Use This]   │               │
│  └──────────────┘  └──────────────┘               │
└────────────────────────────────────────────────────┘
```

**Marketplace Listing:**
- Template cards show: title, author handle, upvote count, copy/use count, category tags
- Search by title or tag
- Filter by category
- Sort by: Most Upvoted / Most Used / Newest

**Upvoting:**
- One upvote per user per listing
- Toggle upvote (click again to remove)
- `POST /api/marketplace/:listingId/upvote`

**Using a Marketplace Template:**
1. Click "Use This" → creates a copy of the template in the user's personal templates
2. Opens the builder pre-loaded with the schema
3. User can immediately prompt AI to customise it

**Publishing to Marketplace:**
- From personal templates → "Publish to Marketplace"
- Fills in a modal: title, description, category (dropdown), tags (free text)
- Instantly listed — no admin review
- Creator can unpublish at any time (removes from marketplace, their personal template remains)

---

### 7.12 Sidebar — Published Forms Manager

The sidebar is present on all creator routes (`/`, `/builder/*`, `/templates`, `/marketplace`).

**Sidebar Contents:**
```
┌──────────────────────┐
│  ✨ New Form         │
├──────────────────────┤
│  My Forms            │
│                      │
│  📋 Summer Survey    │
│     142 responses    │
│     ● Published      │
│                      │
│  📋 Job Application  │
│     8 responses      │
│     ● Published      │
│                      │
│  📋 Product Feedback │
│     0 responses      │
│     ○ Draft          │
└──────────────────────┘
```

**Clicking a form** opens a contextual popover/submenu:
- 📝 Edit Form (→ builder)
- 👁 View Responses (→ responses page)
- 📊 AI Analysis (→ analytics page, Pro badge if not on Pro)
- 🔗 Copy Public URL
- 📋 Save as Template
- ⚙️ Form Settings (change anonymous/auth, close form)
- 🗑️ Delete Form

---

## 8. API Design

Base URL: `https://api.formly.app` (prod) or `http://localhost:3001` (local)

All endpoints return `application/json`. AI endpoints use `text/event-stream` (SSE).

### Authentication Header
```
Authorization: Bearer <session_token>
```

### Routes

#### Forms
```
POST   /api/forms                    # Create new form
GET    /api/forms                    # List creator's forms
GET    /api/forms/:id                # Get single form
PATCH  /api/forms/:id                # Update form (schema, settings)
DELETE /api/forms/:id                # Delete form
POST   /api/forms/:id/publish        # Publish form (set slug, is_published)
GET    /api/forms/public/:slug       # Get published form (no auth)
```

#### AI — Form Generation (SSE)
```
POST   /api/ai/generate              # Generate form from prompt (streams FormSchema)
POST   /api/ai/modify                # Modify form with prompt (streams diff/new schema)
```

**SSE Event Format for form generation:**
```
event: schema_delta
data: { "op": "set_field", "field": { ...FormField } }

event: schema_delta
data: { "op": "set_title", "value": "Customer Feedback Form" }

event: done
data: { "schema": { ...complete FormSchema } }
```

#### Responses
```
POST   /api/forms/:id/responses      # Submit a form response (public endpoint, auth optional)
GET    /api/forms/:id/responses      # Get all responses (paginated, creator only)
GET    /api/forms/:id/responses/export?format=csv  # Export CSV
```

#### AI Analysis (SSE, Pro only)
```
POST   /api/forms/:id/analysis/chat  # Send message, stream AI response
GET    /api/forms/:id/analysis       # Get conversation history
```

#### Templates
```
GET    /api/templates                # List creator's templates
POST   /api/templates                # Save new template
DELETE /api/templates/:id            # Delete template
POST   /api/templates/:id/use        # Copy template to a new form (returns new formId)
```

#### Marketplace
```
GET    /api/marketplace              # List public listings (filter/sort/search)
POST   /api/marketplace              # Publish a template to marketplace
DELETE /api/marketplace/:id          # Unpublish (creator only)
POST   /api/marketplace/:id/upvote   # Toggle upvote
POST   /api/marketplace/:id/copy     # Copy to personal templates
```

#### Users & Billing
```
GET    /api/users/me                 # Get current user (plan, usage, credits_used, credits_reset_at)
GET    /api/users/me/credits         # Get current AI credit status { used, limit, resetsAt }
POST   /api/stripe/create-checkout   # Create Stripe checkout session
POST   /api/stripe/portal            # Open Stripe billing portal
POST   /api/stripe/webhook           # Stripe webhook handler
```

#### File Storage (Local or S3 — unified via STORAGE_MODE)
```
POST   /api/uploads                  # Upload a file (auth required), returns { url, filename, mimeType, size }
DELETE /api/uploads                  # Delete a file (auth required)
GET    /uploads/:filename             # Serve local file (public, STORAGE_MODE=local only)
```

#### Webhooks
```
POST   /api/webhooks                 # Create webhook (auth required)
GET    /api/webhooks                 # List user's webhooks
DELETE /api/webhooks/:id            # Delete webhook
POST   /api/webhooks/:id/test        # Send test webhook delivery
```

---

## 9. AI Integration Details

### Model
**MiniMax M2.7** accessed via the Anthropic SDK (compatible API endpoint).

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL, // https://api.minimax.io/anthropic
});
// Model: "MiniMax-M2.7" (exact casing per MiniMax docs)
```

### System Prompts

#### Form Generation Prompt
```
You are Formly's AI form designer. Your job is to generate a FormSchema JSON object
based on the user's description.

Rules:
- Always output valid FormSchema JSON as defined in the schema spec
- Choose appropriate field types for each piece of data
- Add sensible validation, placeholders, and help text
- For multi-step forms, use page_break fields to separate pages
- Include conditional logic when it makes the form more intelligent
- Keep labels concise and user-friendly
- Required fields should be the minimum necessary
- Output ONLY the JSON object, no markdown, no explanation

FormSchema spec: [injected from packages/shared/types/form-schema.ts]
```

#### Form Modification Prompt
```
You are Formly's AI form editor. The user wants to modify an existing form.
You will receive the current FormSchema and a modification request.

Rules:
- Return the complete updated FormSchema
- If the user has tagged a specific field (@fieldname), only modify that field
  unless explicitly told to change others
- Preserve all existing field IDs unless adding/removing fields
- Preserve existing validation, conditions, and settings unless asked to change them
- Output ONLY the updated JSON object

Current form schema: [injected]
Selected field (if any): [injected]
User request: [injected]
```

#### Analysis Prompt
```
You are Formly's data analyst AI. You help form creators understand their response data.

You have access to:
- The form schema (all questions and field types)
- All response data (aggregated and individual)

When the user asks for a chart or visualisation, include a JSON block in your response
with the following format:
<chart>
{
  "type": "pie|bar|line|histogram|scatter",
  "title": "...",
  "data": [...],
  "xAxis": "...",
  "yAxis": "..."
}
</chart>

Otherwise respond in clear, plain English. Be concise and actionable.

Form schema: [injected]
Response data summary: [injected — aggregate counts, not raw PII for anonymous forms]
```

### Streaming Implementation (SSE in Elysia)

```typescript
// apps/api/src/routes/ai.ts
app.post('/api/ai/generate', async ({ body, set }) => {
  set.headers['Content-Type'] = 'text/event-stream';
  set.headers['Cache-Control'] = 'no-cache';

  const stream = await client.messages.stream({
    model: 'minimax-m2.7',
    max_tokens: 4096,
    system: GENERATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: body.prompt }],
  });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        controller.enqueue('event: done\ndata: {}\n\n');
        controller.close();
      }
    }),
    { headers: set.headers }
  );
});
```

### Frontend SSE Consumption

```typescript
// hooks/useFormGeneration.ts
import { useEffect } from 'react';
import { useFormStore } from '@/stores/formStore';

export function useFormGeneration(prompt: string) {
  const { setSchema, applyDelta } = useFormStore();

  useEffect(() => {
    const es = new EventSource(`/api/ai/generate?prompt=${encodeURIComponent(prompt)}`);
    
    es.addEventListener('schema_delta', (e) => {
      applyDelta(JSON.parse(e.data));
    });
    
    es.addEventListener('done', (e) => {
      setSchema(JSON.parse(e.data).schema);
      es.close();
    });

    return () => es.close();
  }, [prompt]);
}
```

---

## 10. Stripe Subscription Tiers

### Plans

| Feature | Free | Pro ($12/month) |
|---------|------|-----------------|
| Forms | 5 active | Unlimited |
| Responses per form | 100 | Unlimited |
| **AI Assist Mode** | ✅ (20 AI prompts/month) | ✅ Unlimited |
| **Manual Mode** | ✅ Always available | ✅ Always available |
| **Auto-fallback to Manual when credits expire** | ✅ | N/A |
| AI Analysis (chat about data) | ❌ | ✅ 100 msgs/month |
| Dynamic charts in analysis | ❌ | ✅ |
| CSV Export | ✅ | ✅ |
| Marketplace publish | ✅ | ✅ |
| Multi-page forms | ✅ | ✅ |
| Conditional logic | ✅ | ✅ |
| File uploads | ❌ | ✅ |
| Remove "Made with Formly" branding | ❌ | ✅ |

> **Key principle:** Free users are **never blocked from editing their forms**. When AI credits (20/month) are exhausted, the builder automatically switches to Manual Mode so the creator retains full control over their forms at all times. AI Assist is a productivity accelerator, not a gate on core functionality.

### Stripe Integration

- **Checkout:** `POST /api/stripe/create-checkout` → returns Stripe Checkout Session URL → redirect
- **Billing Portal:** `POST /api/stripe/portal` → returns portal URL → redirect
- **Webhook:** `POST /api/stripe/webhook` listens for:
  - `customer.subscription.created` → set user plan to `pro`
  - `customer.subscription.deleted` → set user plan to `free`
  - `customer.subscription.updated` → sync status
- Plan is cached on the `users.plan` column, synced on every webhook event

---

## 11. Frontend Architecture

### State Management Strategy

```
┌────────────────────────────────────────────────────┐
│  Server State (TanStack Query)                     │
│  - Forms list, form details                        │
│  - Responses (paginated)                           │
│  - Templates, marketplace listings                 │
│  - User profile, subscription                      │
├────────────────────────────────────────────────────┤
│  Client / UI State (Zustand)                       │
│  - Current form schema (builder)                   │
│  - Undo/redo history stack                         │
│  - Selected field (for AI context tagging)         │
│  - Sidebar open/closed                             │
│  - AI generation in-progress status                │
├────────────────────────────────────────────────────┤
│  Form State (React Hook Form)                      │
│  - Form filler validation and submission           │
└────────────────────────────────────────────────────┘
```

### Key Stores

```typescript
// stores/formStore.ts (Zustand)
interface FormStore {
  schema: FormSchema | null;
  history: FormSchema[];        // undo stack
  historyIndex: number;
  selectedFieldId: string | null;
  isGenerating: boolean;
  builderMode: 'ai' | 'manual'; // current editor mode
  
  setSchema: (schema: FormSchema) => void;
  applyDelta: (delta: SchemaDelta) => void;
  selectField: (fieldId: string | null) => void;
  setMode: (mode: 'ai' | 'manual') => void;
  switchToManualDueToCredits: () => void; // sets mode + shows credit-expired banner
  undo: () => void;
  redo: () => void;
  setGenerating: (v: boolean) => void;
  
  // Manual mode field operations (no AI, no credits consumed)
  addField: (type: FieldType, pageIndex: number) => void;
  updateField: (fieldId: string, patch: Partial<FormField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (pageIndex: number, oldIndex: number, newIndex: number) => void;
  moveFieldToPage: (fieldId: string, targetPageIndex: number) => void;
  addPage: () => void;
  deletePage: (pageIndex: number) => void;
  renamePage: (pageIndex: number, title: string) => void;
}
```

### React Query Patterns

```typescript
// Use optimistic updates for field tagging / selection
// Use suspense boundaries for builder route
// Use infinite queries for responses pagination
// Use prefetch on sidebar form hover

// Key naming convention:
['forms', userId]                        // forms list
['forms', formId]                        // single form
['responses', formId, { page, filters }] // paginated responses
['templates', userId]                    // personal templates
['marketplace', { category, sort, q }]   // marketplace listings
['analysis', formId]                     // analysis conversation
['user', 'me']                           // current user + plan
```

### API Client (Elysia Eden Treaty)

```typescript
// lib/api-client.ts
import { treaty } from '@elysiajs/eden';
import type { App } from '../../api/src/index';  // type import only

export const api = treaty<App>(process.env.NEXT_PUBLIC_API_URL!);

// Usage in components:
const { data } = await api.forms.get();        // fully type-safe
await api.forms({ id }).patch({ schema });      // type-safe patch
```

### Component Architecture

Key reusable components:

```
components/
├── builder/
│   ├── BuilderShell.tsx          # Wrapper: renders AI or Manual layout based on mode
│   ├── ModeToggle.tsx            # [✨ AI Assist | ✏ Manual] toggle in header
│   ├── CreditsBanner.tsx         # Yellow banner shown when auto-switched to Manual
│   ├── CreditsCounter.tsx        # "Credits: X/20" shown in AI Assist left panel
│   │
│   ├── ai-assist/
│   │   ├── SplitEditor.tsx       # AI Assist layout: chat left, preview right
│   │   ├── PromptPanel.tsx       # Left: AI chat interface + field tag input
│   │   └── FormPreview.tsx       # Right: live read-only preview of form
│   │
│   ├── manual/
│   │   ├── ManualEditor.tsx      # Manual layout: field list left, property panel right
│   │   ├── FieldList.tsx         # Draggable list of fields per page
│   │   ├── FieldCard.tsx         # Individual field row with drag handle
│   │   ├── AddFieldMenu.tsx      # Dropdown grouped by field category
│   │   ├── PropertyPanel.tsx     # Right panel: field property editor
│   │   ├── OptionsEditor.tsx     # Inline add/remove/reorder options for choice fields
│   │   ├── ConditionRuleEditor.tsx # Add/edit conditional logic rules
│   │   └── PageTabs.tsx          # Page tab bar with add/rename/delete
│   │
│   ├── shared/
│   │   ├── FieldRenderer.tsx     # Renders any field by type (used by FormPreview + Filler)
│   │   ├── FieldSelector.tsx     # Click-to-tag field overlay (AI Assist mode)
│   │   └── PublishModal.tsx
│   │
├── filler/
│   ├── FormFiller.tsx
│   ├── PageRenderer.tsx
│   ├── ConditionalWrapper.tsx
│   └── ProgressBar.tsx
│
├── analytics/
│   ├── AnalysisChat.tsx
│   └── ChartRenderer.tsx
│
└── marketplace/
    ├── ListingCard.tsx
    └── UpvoteButton.tsx
```

---

## 12. Deployment

### Docker Compose (Self-hosted / Local Dev)

**Storage:** Uses `uploads_data` Docker volume for local file storage (when `STORAGE_MODE=local`). Mount a bind path for production.

```yaml
# docker-compose.yml
version: '3.9'
services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - api
      - postgres
    volumes:
      - uploads_data:/app/uploads  # Local upload storage

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      - postgres
    volumes:
      - uploads_data:/app/uploads  # Local upload storage

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: formly
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: formly
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
  uploads_data:  # Named volume for local file uploads
```

```dockerfile
# apps/api/Dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json bun.lockb ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "run", "apps/api/src/index.ts"]
```

### Vercel Deployment

- `apps/web` → Vercel project (Next.js)
- `apps/api` → Vercel Serverless Functions **or** a separate Fly.io / Railway deployment (recommended: Railway for Elysia, since Vercel serverless has cold-start issues with Bun + long-lived SSE)
- PostgreSQL → Neon (managed Postgres, Vercel-native) **or** keep self-hosted on Railway with a Docker volume

> **Recommendation for Vercel + Bun:** Deploy the Elysia API to **Railway** (Docker-based, native Bun support, persistent Postgres volume). Deploy Next.js to Vercel. This gives the best of both worlds.

### Turbo Build Pipeline

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

---

## 13. Environment Variables

```bash
# .env.example

# ============================================
# STORAGE MODE — "local" or "s3"
# ============================================
STORAGE_MODE=local                   # Toggle between local and S3 storage

# ── Local Storage (STORAGE_MODE=local) ──
UPLOAD_DIR=/app/uploads

# ── S3 Storage (STORAGE_MODE=s3) ──
AWS_ACCESS_KEY_ID=                  # AWS access key (use IAM roles in production)
AWS_SECRET_ACCESS_KEY=               # AWS secret key
AWS_REGION=us-east-1                # AWS region
AWS_S3_BUCKET=formly-uploads        # S3 bucket name
# AWS_S3_ENDPOINT=                  # Optional: custom S3 endpoint (MinIO, Backblaze, etc.)

# Auth
AUTH_SECRET=                        # better-auth secret (auto-generated if blank)
GOOGLE_CLIENT_ID=                  # Google OAuth client ID
GOOGLE_CLIENT_SECRET=               # Google OAuth client secret

# Database
DATABASE_URL=postgresql://formly:password@localhost:5432/formly

# AI — MiniMax M2.7 via Anthropic SDK
# Get from https://platform.minimax.io/subscribe/token-plan
# API key is exclusive to Token Plan — not interchangeable with pay-as-you-go keys
ANTHROPIC_API_KEY=
# Use this exact endpoint for Anthropic SDK compatibility
ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic

# Stripe
STRIPE_SECRET_KEY=                 # Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= # Stripe publishable key
STRIPE_WEBHOOK_SECRET=             # Stripe webhook signing secret
STRIPE_PRO_PRICE_ID=               # Stripe price ID for $12/month Pro plan

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001       # Server-side

# Email — Resend (optional)
RESEND_API_KEY=
```

### Required vs Optional Credentials

| Variable | Required | Auto-Generated |
|----------|----------|----------------|
| `AUTH_SECRET` | No | ✅ Generated by better-auth if blank |
| `GOOGLE_CLIENT_ID` | **Yes** | — |
| `GOOGLE_CLIENT_SECRET` | **Yes** | — |
| `DATABASE_URL` | Yes | ✅ Default: localhost Docker postgres |
| `ANTHROPIC_API_KEY` | **Yes** | — |
| `ANTHROPIC_BASE_URL` | **Yes** | ✅ Default: `https://api.minimax.io/anthropic` |
| `STRIPE_*` | No (payments) | — |
| `RESEND_API_KEY` | No (email) | — |
| `AWS_*` (S3) | Only if `STORAGE_MODE=s3` | — |
| `UPLOAD_DIR` | No | ✅ Default: `/app/uploads` |

---

## 14. Premade Template Library

The following 12 quick-start templates should be pre-built and seeded in the database as system templates (not owned by any user). They appear on the home screen as one-click starting points.

| # | Template Name | Key Fields |
|---|--------------|-----------|
| 1 | **Contact Us** | Name, Email, Subject, Message |
| 2 | **Customer Feedback** | Overall rating (stars), What went well (long text), What could improve (long text), NPS (0–10) |
| 3 | **Event Registration** | Name, Email, Phone, Event session (dropdown), Dietary requirements, T-shirt size |
| 4 | **Job Application** | Name, Email, Phone, Position (dropdown), Upload CV (file), Cover letter (long text), LinkedIn URL, Years of experience (number) |
| 5 | **Customer Survey** | Multiple choice questions, Likert scales, Open-ended feedback |
| 6 | **Lead Generation** | Name, Email, Company, Job title, Interest area (dropdown), How did you hear about us |
| 7 | **Bug Report** | Summary (short text), Steps to reproduce (long text), Expected vs actual behaviour, Severity (dropdown), Screenshot (file upload) |
| 8 | **Meeting / Appointment Booking** | Name, Email, Preferred date, Preferred time slot, Meeting type (dropdown), Notes |
| 9 | **Product Waitlist** | Email, Name, What are you most excited about? (multiple choice), How did you hear about us |
| 10 | **Quiz / Knowledge Check** | Multiple single-choice questions with correct answer marking |
| 11 | **Employee Onboarding** | Personal info, Emergency contact, Equipment preferences, Dietary requirements, Tech setup (multi-select) |
| 12 | **Anonymous Feedback (HR)** | Department (dropdown), Feedback type, Description (long text) — pre-set to anonymous mode |

---

## 15. Non-Functional Requirements

### Performance
- Form builder split-editor: right panel re-renders < 16ms after schema delta (60fps)
- AI first token: < 1 second from prompt submission
- Form filler page load: < 2 seconds (SSR + CDN)
- Response table: paginated at 20 rows, < 500ms per page

### Security
- All API routes protected by JWT validation middleware
- Form submission endpoints rate-limited: 10 submissions per IP per 10 minutes
- AI endpoints rate-limited: per-user based on plan tier
- File uploads: virus scan not in v1, but enforce MIME type and max size server-side
- Stripe webhook validated via signature header
- SQL injection: mitigated by Drizzle ORM parameterised queries
- PII in responses: stored in DB, not sent to AI analysis by default (aggregate stats only)

### Accessibility
- All shadcn/ui components are ARIA-compliant by default
- Form filler must be fully keyboard navigable
- Progress bar uses `role="progressbar"` with `aria-valuenow`
- Colour contrast minimum AA (4.5:1)

### Mobile Responsiveness
- Form filler: fully responsive, optimised for mobile (single column, large tap targets)
- Builder: tablet (768px+) minimum — split editor collapses to tabs on smaller screens
- Home screen: responsive grid

---

## 16. Open Questions & Future v2 Scope

### Built in Current Version
- ✅ Payment field type (Stripe Elements embedded in forms)
- ✅ Webhooks — notify external URLs on form submission
- ✅ Embed code (iframe, JS snippet, or direct link)
- ✅ Form themes / branding customisation (6 presets + custom colours)
- ✅ Collaborators — share form editing with team members (viewer/editor/admin roles)
- ✅ Form scheduling (open from date X to date Y)
- ✅ Email notifications to creator on new response
- ✅ Unified storage — local Docker volume or S3 (toggle via STORAGE_MODE env)

### Remaining v2 / Future Scope
- Zapier / Make integration
- Respondent confirmation email on submission
- GDPR data export / deletion tools
- Conversational form mode (one-question-at-a-time) — architecture supports it, UX deferred
- Form version history (rollback capability)
- Team workspaces (beyond per-form collaborators)

### Open Questions for Team
1. **Slug uniqueness:** Should creators be able to fully customise the public slug? Needs uniqueness check UX.
2. **Form versioning for respondents:** If a creator edits a published form, do in-progress submissions follow the old or new schema? v1 recommendation: new schema applies immediately (simpler), document this behaviour.
3. **Analysis data privacy:** Should raw individual responses ever be sent to the AI, or only aggregated stats? Recommendation: aggregated only by default, with an explicit opt-in toggle for raw data (with a clear privacy notice). ✅ Confirmed: aggregated only by default.
4. **Marketplace moderation:** As the platform grows, community flagging + basic keyword filter should be added before v2.
5. **MiniMax M2.7 context window:** Verify max tokens for large response datasets in analysis. May need chunking/summarisation strategy for forms with 1000+ responses.
6. **Storage:** For production S3 deployments, consider using pre-signed URLs with short expiry for private buckets instead of always using public bucket URLs.

---

*This document is the authoritative v1 specification for Formly. All implementation decisions not covered here should default to the simplest working option and be documented as a decision record by the developer.*
