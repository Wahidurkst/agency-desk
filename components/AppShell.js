'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, BriefcaseBusiness, CheckCircle2, ChevronDown, Home, LayoutDashboard, LogOut, Plus, Search, Settings, Sparkles, UsersRound } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AppShell({ children, user, active }) {
  const router = useRouter()
  var email = user && user.email ? user.email : ''
  var initial = email ? email.charAt(0).toUpperCase() : 'A'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <div className="brand-row">
          <div className="brand-mark">AD</div>
          <div>
            <strong>Agency Desk</strong>
            <span>Project OS</span>
          </div>
        </div>

        <button className="sidebar-create" type="button">
          <Plus size={18} />
          Create
        </button>

        <nav className="sidebar-nav">
          <Link className={active === 'dashboard' ? 'nav-item active' : 'nav-item'} href="/dashboard">
            <Home size={18} />
            Home
          </Link>
          <Link className={active === 'projects' ? 'nav-item active' : 'nav-item'} href="/dashboard">
            <LayoutDashboard size={18} />
            Projects
          </Link>
          <a className="nav-item muted-nav" href="#">
            <CheckCircle2 size={18} />
            My tasks
          </a>
          <a className="nav-item muted-nav" href="#">
            <Bell size={18} />
            Inbox
          </a>
          <a className="nav-item muted-nav" href="#">
            <UsersRound size={18} />
            Team
          </a>
        </nav>

        <div className="sidebar-section">
          <div className="section-title">Workspace</div>
          <div className="workspace-chip">
            <BriefcaseBusiness size={16} />
            My Workspace
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="sidebar-upgrade">
          <Sparkles size={18} />
          <strong>Asana-style workspace</strong>
          <p>Projects, boards, lists, priorities and team work in one clean view.</p>
        </div>

        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar-small">{initial}</div>
            <span>{email}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} type="button">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="global-topbar">
          <div className="global-search">
            <Search size={18} />
            <input placeholder="Search projects, tasks, people" readOnly />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" type="button"><Bell size={18} /></button>
            <button className="icon-btn" type="button"><Settings size={18} /></button>
            <div className="avatar-small">{initial}</div>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  )
}
