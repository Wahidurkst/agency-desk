'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, FolderKanban } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AppShell({ children, user }) {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <Link href="/dashboard" className="sidebar-brand">
            <span className="sidebar-logo">AD</span>
            <span>Agency Desk</span>
          </Link>

          <nav className="sidebar-nav">
            <Link className="sidebar-link active" href="/dashboard">
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link className="sidebar-link" href="/dashboard">
              <FolderKanban size={18} /> Projects
            </Link>
          </nav>
        </div>

        <div className="sidebar-user">
          <span>{user && user.email ? user.email : 'Signed in'}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  )
}
