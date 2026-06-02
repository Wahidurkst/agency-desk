'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import EmptyState from '@/components/EmptyState'
import TaskBoard from '@/components/TaskBoard'
import { priorities, taskStatuses } from '@/lib/constants'
import { supabase } from '@/lib/supabaseClient'

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('todo')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  useEffect(function () {
    initialize()
  }, [projectId])

  async function initialize() {
    setLoading(true)
    setError('')

    var authResult = await supabase.auth.getUser()

    if (!authResult.data || !authResult.data.user) {
      router.replace('/login')
      return
    }

    setUser(authResult.data.user)
    await loadProject()
    setLoading(false)
  }

  async function loadProject() {
    var projectResult = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectResult.error) {
      setError(projectResult.error.message)
      return
    }

    setProject(projectResult.data)
    await loadTasks(projectResult.data.id)
  }

  async function loadTasks(currentProjectId) {
    var taskResult = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', currentProjectId)
      .order('created_at', { ascending: false })

    if (taskResult.error) {
      setError(taskResult.error.message)
      return
    }

    setTasks(taskResult.data || [])
  }

  async function handleCreateTask(event) {
    event.preventDefault()

    if (!project || !user || !title.trim()) {
      return
    }

    setSaving(true)
    setError('')

    var taskResult = await supabase
      .from('tasks')
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        title: title.trim(),
        description: description.trim(),
        status: status,
        priority: priority,
        due_date: dueDate || null,
        assignee_id: user.id,
        created_by: user.id
      })
      .select('*')
      .single()

    if (taskResult.error) {
      setError(taskResult.error.message)
      setSaving(false)
      return
    }

    setTasks([taskResult.data].concat(tasks))
    setTitle('')
    setDescription('')
    setStatus('todo')
    setPriority('medium')
    setDueDate('')
    setSaving(false)
  }

  async function handleMoveTask(taskId, nextStatus) {
    var updateResult = await supabase
      .from('tasks')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select('*')
      .single()

    if (updateResult.error) {
      setError(updateResult.error.message)
      return
    }

    setTasks(tasks.map(function (task) {
      if (task.id === taskId) {
        return updateResult.data
      }

      return task
    }))
  }

  async function handleDeleteTask(taskId) {
    var shouldDelete = window.confirm('Delete this task?')

    if (!shouldDelete) {
      return
    }

    var deleteResult = await supabase.from('tasks').delete().eq('id', taskId)

    if (deleteResult.error) {
      setError(deleteResult.error.message)
      return
    }

    setTasks(tasks.filter(function (task) {
      return task.id !== taskId
    }))
  }

  if (loading) {
    return <div className="loading-screen">Loading project...</div>
  }

  return (
    <AppShell user={user}>
      <div className="topbar">
        <div>
          <Link href="/dashboard" className="muted">Back to dashboard</Link>
          <h1>{project ? project.name : 'Project'}</h1>
          <p>{project && project.description ? project.description : 'Create and manage project tasks.'}</p>
        </div>
      </div>

      {error ? <div className="error-box" style={{ marginBottom: 18 }}>{error}</div> : null}

      <div className="grid-two" style={{ gridTemplateColumns: '0.75fr 1.25fr' }}>
        <aside className="card">
          <h2>Create Task</h2>
          <p className="muted">Add tasks, assign status, priority and due date.</p>

          <form className="inline-form" onSubmit={handleCreateTask}>
            <label>
              Task title
              <input
                value={title}
                onChange={function (event) {
                  setTitle(event.target.value)
                }}
                placeholder="Example: Setup GA4 conversion tracking"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={function (event) {
                  setDescription(event.target.value)
                }}
                placeholder="Task details"
              />
            </label>

            <div className="form-grid">
              <label>
                Status
                <select
                  value={status}
                  onChange={function (event) {
                    setStatus(event.target.value)
                  }}
                >
                  {taskStatuses.map(function (item) {
                    return <option key={item.key} value={item.key}>{item.label}</option>
                  })}
                </select>
              </label>

              <label>
                Priority
                <select
                  value={priority}
                  onChange={function (event) {
                    setPriority(event.target.value)
                  }}
                >
                  {priorities.map(function (item) {
                    return <option key={item.key} value={item.key}>{item.label}</option>
                  })}
                </select>
              </label>
            </div>

            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={function (event) {
                  setDueDate(event.target.value)
                }}
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Task'}
            </button>
          </form>
        </aside>

        <section className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <h2>Task Board</h2>
            <span className="badge">{tasks.length} tasks</span>
          </div>

          {tasks.length === 0 ? (
            <EmptyState title="No tasks yet" text="Create your first task and it will appear on the board." />
          ) : (
            <TaskBoard tasks={tasks} onMoveTask={handleMoveTask} onDeleteTask={handleDeleteTask} />
          )}
        </section>
      </div>
    </AppShell>
  )
}
