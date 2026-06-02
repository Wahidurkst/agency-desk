'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import EmptyState from '@/components/EmptyState'
import ProjectCard from '@/components/ProjectCard'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [workspace, setWorkspace] = useState(null)
  const [workspaces, setWorkspaces] = useState([])
  const [projects, setProjects] = useState([])
  const [workspaceName, setWorkspaceName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(function () {
    initialize()
  }, [])

  async function initialize() {
    setLoading(true)
    setError('')

    var authResult = await supabase.auth.getUser()

    if (!authResult.data || !authResult.data.user) {
      router.replace('/login')
      return
    }

    setUser(authResult.data.user)
    await loadWorkspaces(authResult.data.user)
    setLoading(false)
  }

  async function loadWorkspaces(currentUser) {
    var memberResult = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', currentUser.id)

    if (memberResult.error) {
      setError(memberResult.error.message)
      return
    }

    if (!memberResult.data || memberResult.data.length === 0) {
      await createDefaultWorkspace(currentUser)
      return
    }

    var ids = memberResult.data.map(function (item) {
      return item.workspace_id
    })

    var workspaceResult = await supabase
      .from('workspaces')
      .select('*')
      .in('id', ids)
      .order('created_at', { ascending: true })

    if (workspaceResult.error) {
      setError(workspaceResult.error.message)
      return
    }

    setWorkspaces(workspaceResult.data || [])
    var selectedWorkspace = workspaceResult.data && workspaceResult.data[0] ? workspaceResult.data[0] : null
    setWorkspace(selectedWorkspace)

    if (selectedWorkspace) {
      await loadProjects(selectedWorkspace.id)
    }
  }

  async function createDefaultWorkspace(currentUser) {
    var workspaceResult = await supabase
      .from('workspaces')
      .insert({
        name: 'My Workspace',
        owner_id: currentUser.id
      })
      .select('*')
      .single()

    if (workspaceResult.error) {
      setError(workspaceResult.error.message)
      return
    }

    var memberResult = await supabase.from('workspace_members').insert({
      workspace_id: workspaceResult.data.id,
      user_id: currentUser.id,
      role: 'owner'
    })

    if (memberResult.error) {
      setError(memberResult.error.message)
      return
    }

    setWorkspace(workspaceResult.data)
    setWorkspaces([workspaceResult.data])
    setProjects([])
  }

  async function loadProjects(workspaceId) {
    var projectResult = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (projectResult.error) {
      setError(projectResult.error.message)
      return
    }

    setProjects(projectResult.data || [])
  }

  async function handleCreateWorkspace(event) {
    event.preventDefault()

    if (!workspaceName.trim() || !user) {
      return
    }

    setSaving(true)
    setError('')

    var workspaceResult = await supabase
      .from('workspaces')
      .insert({
        name: workspaceName.trim(),
        owner_id: user.id
      })
      .select('*')
      .single()

    if (workspaceResult.error) {
      setError(workspaceResult.error.message)
      setSaving(false)
      return
    }

    var memberResult = await supabase.from('workspace_members').insert({
      workspace_id: workspaceResult.data.id,
      user_id: user.id,
      role: 'owner'
    })

    if (memberResult.error) {
      setError(memberResult.error.message)
      setSaving(false)
      return
    }

    setWorkspaceName('')
    setWorkspace(workspaceResult.data)
    setWorkspaces([workspaceResult.data].concat(workspaces))
    setProjects([])
    setSaving(false)
  }

  async function handleCreateProject(event) {
    event.preventDefault()

    if (!workspace || !projectName.trim() || !user) {
      return
    }

    setSaving(true)
    setError('')

    var projectResult = await supabase
      .from('projects')
      .insert({
        workspace_id: workspace.id,
        name: projectName.trim(),
        description: projectDescription.trim(),
        created_by: user.id
      })
      .select('*')
      .single()

    if (projectResult.error) {
      setError(projectResult.error.message)
      setSaving(false)
      return
    }

    setProjectName('')
    setProjectDescription('')
    setProjects([projectResult.data].concat(projects))
    setSaving(false)
  }

  async function handleWorkspaceChange(event) {
    var selectedId = event.target.value
    var selected = workspaces.find(function (item) {
      return item.id === selectedId
    })

    setWorkspace(selected)
    if (selected) {
      await loadProjects(selected.id)
    }
  }

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>
  }

  return (
    <AppShell user={user}>
      <div className="topbar">
        <div>
          <h1>Project Dashboard</h1>
          <p>Manage your agency projects, tasks, and daily work from one place.</p>
        </div>

        {workspaces.length > 0 ? (
          <select value={workspace ? workspace.id : ''} onChange={handleWorkspaceChange} style={{ maxWidth: 260 }}>
            {workspaces.map(function (item) {
              return (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              )
            })}
          </select>
        ) : null}
      </div>

      {error ? <div className="error-box" style={{ marginBottom: 18 }}>{error}</div> : null}

      <div className="grid-two">
        <section className="card">
          <div className="card-header">
            <h2>Projects</h2>
            {workspace ? <span className="badge">{workspace.name}</span> : null}
          </div>

          {projects.length === 0 ? (
            <EmptyState title="No projects yet" text="Create your first project to start adding tasks." />
          ) : (
            <div className="project-grid">
              {projects.map(function (project) {
                return <ProjectCard key={project.id} project={project} />
              })}
            </div>
          )}
        </section>

        <aside className="card">
          <h2>Create Project</h2>
          <p className="muted">Add a new project under the selected workspace.</p>

          <form className="inline-form" onSubmit={handleCreateProject}>
            <label>
              Project name
              <input
                value={projectName}
                onChange={function (event) {
                  setProjectName(event.target.value)
                }}
                placeholder="Example: Client Website Tracking"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={projectDescription}
                onChange={function (event) {
                  setProjectDescription(event.target.value)
                }}
                placeholder="Short project details"
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={saving || !workspace}>
              {saving ? 'Saving...' : 'Create Project'}
            </button>
          </form>

          <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />

          <h2>Create Workspace</h2>
          <p className="muted">Useful if you want separate workspace for different business or team.</p>

          <form className="inline-form" onSubmit={handleCreateWorkspace}>
            <label>
              Workspace name
              <input
                value={workspaceName}
                onChange={function (event) {
                  setWorkspaceName(event.target.value)
                }}
                placeholder="Example: Cleaners Growth"
                required
              />
            </label>

            <button className="btn btn-secondary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Workspace'}
            </button>
          </form>
        </aside>
      </div>
    </AppShell>
  )
}
