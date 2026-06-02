# Agency Desk MVP

A simple Asana-style project management MVP built with Next.js, Supabase, and plain CSS.

## Features included

- Email/password signup and login
- Auto-created first workspace
- Create multiple workspaces
- Create projects
- Project dashboard
- Create tasks
- Kanban-style task board
- Task status update
- Task priority and due date
- Secure database with Supabase Row Level Security
- Ready for Vercel deployment

## Tech stack

- Next.js App Router
- React
- Supabase Auth
- Supabase Postgres
- Supabase Row Level Security
- Vercel hosting

## 1. Create Supabase project

1. Go to Supabase and create a new project.
2. Open SQL Editor.
3. Copy all code from `supabase/schema.sql`.
4. Run the SQL.
5. Go to Project Settings > API.
6. Copy:
   - Project URL
   - anon public key

## 2. Setup local environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 4. Supabase Auth setting for easy testing

For fast local testing, you can disable email confirmation from Supabase Auth settings.

Path:

```text
Supabase Dashboard > Authentication > Providers > Email > Confirm email
```

If email confirmation is enabled, signup will ask you to confirm email first.

## 5. Deploy to Vercel

1. Push this folder to GitHub.
2. Go to Vercel.
3. Import the GitHub repo.
4. Add these Environment Variables in Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Deploy.

## 6. Important notes

This is an MVP, not a full Asana replacement yet.

Recommended next features:

- Team invitation system
- Client portal role
- Task comments UI
- File upload with Supabase Storage
- Notifications
- Calendar view
- Billing with Stripe
- Activity log UI
- Drag and drop board

## 7. Project structure

```text
app/
  login/
  signup/
  dashboard/
  projects/[projectId]/
components/
lib/
supabase/schema.sql
```

## 8. Common issues

### Missing environment variables

Make sure `.env.local` exists locally and Vercel environment variables are added in Production environment.

### Signup works but dashboard does not open

Your Supabase email confirmation may be enabled. Confirm the email first or temporarily disable email confirmation for testing.

### Database permission error

Make sure you ran the full `supabase/schema.sql` file in Supabase SQL Editor.
