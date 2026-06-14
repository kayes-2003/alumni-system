# AlumniConnect — Alumni Management System

A modern, responsive, production-ready Alumni Management System built with **React + TypeScript + Vite + Tailwind CSS + Shadcn UI** on the frontend and **Supabase** (PostgreSQL, Auth, Storage, Realtime, Edge Functions) on the backend.

## ✅ Current Status (Foundation Phase)

This phase delivers the project foundation:

- ✅ Vite + React + TypeScript scaffold with path aliases (`@/`)
- ✅ Tailwind CSS + Shadcn-style design tokens (light/dark mode)
- ✅ Complete responsive landing page (Hero, About, Statistics, Testimonials, CTA, Footer)
- ✅ Authentication: Email/Password, Google OAuth, GitHub OAuth via Supabase Auth
- ✅ Password reset & email verification flows
- ✅ Role-based access control (Admin, Alumni, Student) with protected routes
- ✅ Complete Supabase SQL schema with RLS policies for all core tables
- ✅ Stub pages for Alumni Directory, Events, Careers, News, Mentorship, Membership, Contact
- ✅ Role-specific dashboard shells (Admin / Alumni / Student)

> Subsequent phases will build out each feature (directory search/filters, event management + QR check-in, career portal, mentorship workflows, community feed, realtime messaging, Stripe membership payments, admin management screens).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI patterns |
| Routing | React Router v7 |
| Data fetching | TanStack Query |
| Forms & validation | React Hook Form + Zod |
| Icons / Animation | Lucide React, Framer Motion |
| Charts | Chart.js (to be added in dashboard phase) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| Payments | Stripe Checkout, Webhooks, Customer Portal (next phase) |
| Email | Resend (next phase) |
| Deployment | Vercel (frontend) + Supabase (backend) |

## Project Structure

```
alumni-system/
├── src/
│   ├── components/
│   │   ├── ui/          # Reusable Shadcn-style primitives (button, input, card, label)
│   │   ├── layout/       # Navbar, Footer, MainLayout, ProtectedRoute, PlaceholderPage
│   │   └── landing/      # Hero, About, Statistics, Testimonials, CTA
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state, session, profile, RBAC helpers
│   ├── lib/
│   │   ├── supabase.ts   # Supabase client
│   │   └── utils.ts      # cn() class merge helper
│   ├── pages/
│   │   ├── auth/          # Login, Register, Forgot/Reset Password, OAuth callback
│   │   ├── dashboard/      # Admin, Alumni, Student dashboards
│   │   └── *.tsx          # Landing, Alumni Directory, Events, Careers, News, etc.
│   ├── types/
│   │   └── database.ts   # Supabase database row/insert/update types
│   ├── App.tsx            # Route definitions
│   └── main.tsx           # App entry, providers (Router, QueryClient, AuthProvider)
├── supabase/
│   └── schema.sql          # Full Postgres schema + RLS policies + storage buckets
├── .env.example
└── README.md
```

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- (Later phases) A [Stripe](https://stripe.com) account and [Resend](https://resend.com) account

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_APP_URL=http://localhost:5173
```

You can find your Supabase URL and anon key in **Project Settings → API**.

### 4. Set up the database

In the Supabase Dashboard, open the **SQL Editor** and run the contents of `supabase/schema.sql`. This creates:

- All core tables (`profiles`, `departments`, `batches`, `memberships`, `payments`, `events`, `event_registrations`, `jobs`, `job_applications`, `mentorship_requests`, `posts`, `comments`, `notifications`, `messages`, `gallery`, `news`, `contact_messages`, etc.)
- Enum types for roles, membership plans/status, job types, verification & mentorship status
- A trigger that auto-creates a `profiles` row whenever a new user signs up via Supabase Auth
- Row Level Security (RLS) policies enforcing role-based access for every table
- Storage buckets (`avatars`, `event-banners`, `gallery`, `news-images`, `resumes`) with appropriate access policies
- Seed data for sample departments and batches

### 5. Configure Authentication providers

In **Authentication → Providers** in the Supabase Dashboard:

- **Email**: enabled by default. Configure email templates under **Authentication → Email Templates** (confirmation, password reset).
- **Google OAuth**: add your Google Cloud OAuth Client ID/Secret and set the redirect URL to `https://<your-project>.supabase.co/auth/v1/callback`.
- **GitHub OAuth**: add your GitHub OAuth App Client ID/Secret with the same callback URL.

In **Authentication → URL Configuration**, set:

- Site URL: `http://localhost:5173` (or your production URL)
- Redirect URLs: add `http://localhost:5173/auth/callback` and `https://your-production-domain.com/auth/callback`

### 6. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 7. Build for production

```bash
npm run build
```

### 8. Deploy

- **Frontend**: Push to GitHub and import the repo in [Vercel](https://vercel.com). Add the same environment variables from `.env` in the Vercel project settings.
- **Backend**: Supabase is already hosted — just ensure your production Site URL and Redirect URLs are configured as described above.

## Role-Based Access Control

Three roles are supported: `admin`, `alumni`, `student`.

- New users default to the `student` role on sign-up (configurable via the `handle_new_user` trigger in `schema.sql`).
- Admins can promote/verify users via the admin dashboard (to be built).
- Routes under `/dashboard/admin`, `/dashboard/alumni`, and `/dashboard/student` are protected by the `<ProtectedRoute allowedRoles={[...]}>` component and enforced server-side via RLS using the `is_admin()` helper and per-table policies.

## Next Development Phases

1. **Alumni Directory** — search/filter UI backed by Supabase queries (name, department, batch, year, company, location)
2. **Profile Management** — edit profile, avatar upload to Storage, privacy settings
3. **Admin Dashboard** — user management, alumni verification, department/batch CRUD, analytics charts
4. **Events** — creation, registration, QR code generation/check-in, gallery uploads
5. **Career Portal** — job posting, applications, resume upload
6. **Mentorship** — request/accept/schedule flows
7. **Community Feed** — posts, likes, comments, realtime updates via Supabase Realtime
8. **Notifications & Messaging** — realtime notifications and direct messaging
9. **Membership & Payments** — Stripe Checkout, webhooks (Edge Functions), Customer Portal, invoice history
10. **Email** — Resend integration for verification, password reset, event confirmations, receipts

## License

This project is provided as a starting template — adapt licensing as needed for your institution.
