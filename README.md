# Agency Desk MVP

A simple Asana-style project management MVP built with Next.js, Supabase, and plain CSS.

## Features included

- Email/password signup and login
- Auto-create first workspace
- Create multiple workspaces
- Create projects
- Asana-inspired project dashboard
- Project cards and portfolio view
- Create tasks
- Kanban-style task board
- List-style task view
- Task detail drawer
- Task status update
- Task priority and due date
- Secure database with Supabase Row Level Security
- Ready for Vercel deployment

## Required Vercel environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` also works if you use the older Supabase key name.
