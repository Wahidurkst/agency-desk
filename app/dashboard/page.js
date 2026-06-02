'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, FolderKanban, Layers3, Plus, Search, TrendingUp, UsersRound } from 'lucide-react'
import AppShell from '@/components/AppShell'
import ProjectCard from '@/components/ProjectCard'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [workspaces, setWorkspaces] = useState([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  useEffect(function () {
    init()
  }, [])

  useEffect(function () {
    if (selectedWorkspaceId) {
      fetchProjects(selectedWorkspaceId)
      fetchTasks(selectedWorkspaceId)
    }
  }, [selectedWorkspaceId])

  async function init() {
    var sessionResult = await supabase.auth.getSession()
    var session = sessionResult.data.session

    if (!session) {
      router.replace('/login')
      return
    }

    setUser(session.user)
    await ensureProfile(session.user)
    await fetchWorkspaces(session.user.id)
    setLoading(false)
  }

  async function ensureProfile(currentUser) {
    await supabase.from('profiles').upsert({
      id: currentUser.id,
      email: currentUser.email,
      full_name: currentUser.user_metadata && currentUser.user_metadata.full_name ? currentUser.user_metadata.full_name : ''
    })
  }

  async function fetchWorkspaces(userId) {
    var result = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    var workspaceList = result.data || []

    if (workspaceList.length === 0) {
      var created = await supabase
        .from('workspaces')
        .insert({ name: 'My Workspace', owner_id: userId })
        .select()
        .single()

      if (created.error) {
        setMessage(created.error.message)
        return
      }

      await supabase.from('workspace_members').insert({
        workspace_id: created.data.id,
        user_id: userId,
        role: 'owner'
      })

      workspaceList = [created.data]
    }

    setWorkspaces(workspaceList)
    setSelectedWorkspaceId(workspaceList[0].id)
  }

  async function fetchProjects(workspaceId) {
    var result = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    setProjects(result.data || [])
  }

  async function fetchTasks(workspaceId) {
    var result = await supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (result.error) {
      setTasks([])
      return
    }

    setTasks(result.data || [])
  }

  async function createProject(event) {
    event.preventDefault()
    setMessage('')

    if (!projectName.trim() || !selectedWorkspaceId || !user) {
      setMessage('Please add a project name first.')
      return
    }

    var result = await supabase
      .from('projects')
      .insert({
        workspace_id: selectedWorkspaceId,
        name: projectName.trim(),
        description: projectDescription.trim(),
        created_by: user.id,
        status: 'active'
      })
      .select()
      .single()

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    setProjectName('')
    setProjectDescription('')
    await fetchProjects(selectedWorkspaceId)
  }

  async function createWorkspace(event) {
    event.preventDefault()
    setMessage('')

    if (!workspaceName.trim() || !user) {
      setMessage('Please add a workspace name first.')
      return
    }

    var created = await supabase
      .from('workspaces')
      .insert({ name: workspaceName.trim(), owner_id: user.id })
      .select()
      .single()

    if (created.error) {
      setMessage(created.error.message)
      return
    }

    await supabase.from('workspace_members').insert({
      workspace_id: created.data.id,
      user_id: user.id,
      role: 'owner'
    })

    setWorkspaceName('')
    await fetchWorkspaces(user.id)
    setSelectedWorkspaceId(created.data.id)
  }

  function countTasksForProject(projectId) {
    return tasks.filter(function (task) {
      return task.project_id === projectId
    }).length
  }

  var selectedWorkspace = workspaces.find(function (workspace) {
    return workspace.id === selectedWorkspaceId
  })

  var filteredProjects = useMemo(function () {
    if (!query.trim()) {
      return projects
    }

    return projects.filter(function (project) {
      var text = (project.name + ' ' + (project.description || '')).toLowerCase()
      return text.indexOf(query.toLowerCase()) !== -1
    })
  }, [projects, query])

  var activeProjects = projects.filter(function (project) { return project.status === 'active' }).length
  var doneTasks = tasks.filter(function (task) { return task.status === 'done' }).length
  var openTasks = tasks.length - doneTasks

  if (loading) {
    return <div className="center-screen">Loading workspace...</div>
  }

  return (
    <AppShell user={user} active="dashboard">
      <div className="page-header asana-hero">
        <div>
          <div className="breadcrumb-line">Home / {selectedWorkspace ? selectedWorkspace.name : 'Workspace'}</div>
          <h1>Project Dashboard</h1>
          <p>Manage projects, priorities, tasks and client work from one Asana-style workspace.</p>
        </div>
        <div className="header-actions">
          <select value={selectedWorkspaceId} onChange={function (event) { setSelectedWorkspaceId(event.target.value) }}>
            {workspaces.map(function (workspace) {
              return <option key={workspace.id} value={workspace.id}>{workspace.name}</option>
            })}
          </select>
          <a className="primary-link-btn" href="#create-project"><Plus size={16} /> New project</a>
        </div>
      </div>

      {message ? <div className="message error-message">{message}</div> : null}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FolderKanban size={20} /></div>
          <span>Total projects</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={20} /></div>
          <span>Active projects</span>
          <strong>{activeProjects}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Layers3 size={20} /></div>
          <span>Open tasks</span>
          <strong>{openTasks}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><UsersRound size={20} /></div>
          <span>Workspace</span>
          <strong>{workspaces.length}</strong>
        </div>
      </section>

      <div className="dashboard-grid pro-dashboard-grid">
        <section className="panel projects-panel-pro">
          <div className="panel-head">
            <div>
              <h2>Projects</h2>
              <p>Portfolio overview for the selected workspace.</p>
            </div>
            <div className="inline-search">
              <Search size={16} />
              <input value={query} onChange={function (event) { setQuery(event.target.value) }} placeholder="Search projects" />
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="empty-state-pro">
              <div className="empty-illustration"><CalendarDays size={28} /></div>
              <h3>No projects yet</h3>
              <p>Create your first project to start adding list and board tasks.</p>
            </div>
          ) : (
            <div className="project-grid-pro">
              {filteredProjects.map(function (project) {
                return <ProjectCard project={project} key={project.id} taskCount={countTasksForProject(project.id)} />
              })}
            </div>
          )}
        </section>

        <aside className="panel create-panel-pro" id="create-project">
          <form onSubmit={createProject}>
            <div className="form-title-row">
              <h2>Create Project</h2>
              <span>Active</span>
            </div>
            <p>Add a client, campaign, website build or internal project.</p>
            <label>Project name</label>
            <input value={projectName} onChange={function (event) { setProjectName(event.target.value) }} placeholder="Example: Client Website Tracking" />
            <label>Description</label>
            <textarea value={projectDescription} onChange={function (event) { setProjectDescription(event.target.value) }} placeholder="Project goal, scope, client notes" rows="4" />
            <button className="primary-btn" type="submit">Create Project</button>
          </form>

          <div className="divider"></div>

          <form onSubmit={createWorkspace}>
            <h2>Create Workspace</h2>
            <p>Useful for separate client brands, teams or businesses.</p>
            <label>Workspace name</label>
            <input value={workspaceName} onChange={function (event) { setWorkspaceName(event.target.value) }} placeholder="Example: Cleaners Growth" />
            <button className="secondary-btn" type="submit">Create Workspace</button>
          </form>
        </aside>
      </div>
    </AppShell>
  )
}
