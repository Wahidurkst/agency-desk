'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, Columns3, ListChecks, Plus, Search, SlidersHorizontal, Sparkles, Trash2, X } from 'lucide-react'
import AppShell from '@/components/AppShell'
import TaskBoard from '@/components/TaskBoard'
import { priorities, taskStatuses } from '@/lib/constants'
import { supabase } from '@/lib/supabaseClient'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId
  const [user, setUser] = useState(null)
  const [project, setProject] = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('board')
  const [query, setQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [message, setMessage] = useState('')
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: ''
  })

  useEffect(function () {
    init()
  }, [projectId])

  async function init() {
    var sessionResult = await supabase.auth.getSession()
    var session = sessionResult.data.session

    if (!session) {
      router.replace('/login')
      return
    }

    setUser(session.user)
    await fetchProject()
    setLoading(false)
  }

  async function fetchProject() {
    var projectResult = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectResult.error) {
      setMessage(projectResult.error.message)
      return
    }

    setProject(projectResult.data)

    var workspaceResult = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', projectResult.data.workspace_id)
      .single()

    if (!workspaceResult.error) {
      setWorkspace(workspaceResult.data)
    }

    await fetchTasks(projectResult.data.workspace_id)
  }

  async function fetchTasks(workspaceId) {
    var result = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    setTasks(result.data || [])
  }

  function handleFieldChange(field, value) {
    setTaskForm(function (previous) {
      return Object.assign({}, previous, { [field]: value })
    })
  }

  async function createTask(event) {
    event.preventDefault()
    setMessage('')

    if (!taskForm.title.trim() || !project || !user) {
      setMessage('Please add a task title first.')
      return
    }

    var result = await supabase
      .from('tasks')
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        status: taskForm.status,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        created_by: user.id
      })
      .select()
      .single()

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' })
    await fetchTasks(project.workspace_id)
  }

  async function moveTask(taskId, status) {
    if (!project) {
      return
    }

    var result = await supabase
      .from('tasks')
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq('id', taskId)

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    await fetchTasks(project.workspace_id)
  }

  async function deleteTask(taskId) {
    if (!project) {
      return
    }

    var result = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (result.error) {
      setMessage(result.error.message)
      return
    }

    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask(null)
    }

    await fetchTasks(project.workspace_id)
  }

  function getStatusLabel(key) {
    var item = taskStatuses.find(function (status) { return status.key === key })
    return item ? item.label : key
  }

  function getPriorityLabel(key) {
    var item = priorities.find(function (priority) { return priority.key === key })
    return item ? item.label : key
  }

  var filteredTasks = useMemo(function () {
    if (!query.trim()) {
      return tasks
    }

    return tasks.filter(function (task) {
      var text = (task.title + ' ' + (task.description || '')).toLowerCase()
      return text.indexOf(query.toLowerCase()) !== -1
    })
  }, [tasks, query])

  var completedTasks = tasks.filter(function (task) { return task.status === 'done' }).length
  var progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  if (loading) {
    return <div className="center-screen">Loading project...</div>
  }

  if (!project) {
    return <div className="center-screen">Project not found.</div>
  }

  return (
    <AppShell user={user} active="projects">
      <div className="project-page-shell">
        <div className="project-hero">
          <div>
            <Link className="back-link" href="/dashboard"><ArrowLeft size={16} /> Back to dashboard</Link>
            <div className="project-title-row">
              <div className="project-avatar-large">{project.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="breadcrumb-line">{workspace ? workspace.name : 'Workspace'} / Project</div>
                <h1>{project.name}</h1>
                <p>{project.description || 'Plan, assign, track and complete this project.'}</p>
              </div>
            </div>
          </div>
          <div className="project-health-card">
            <span>Progress</span>
            <strong>{progress}%</strong>
            <div className="project-progress-bar"><span style={{ width: progress + '%' }} /></div>
            <p>{completedTasks} of {tasks.length} tasks complete</p>
          </div>
        </div>

        {message ? <div className="message error-message">{message}</div> : null}

        <div className="project-tabs">
          <button className={viewMode === 'board' ? 'tab-btn active' : 'tab-btn'} onClick={function () { setViewMode('board') }} type="button">
            <Columns3 size={16} /> Board
          </button>
          <button className={viewMode === 'list' ? 'tab-btn active' : 'tab-btn'} onClick={function () { setViewMode('list') }} type="button">
            <ListChecks size={16} /> List
          </button>
          <button className="tab-btn disabled" type="button"><CalendarDays size={16} /> Calendar</button>
          <button className="tab-btn disabled" type="button"><Sparkles size={16} /> Timeline</button>
        </div>

        <div className="project-toolbar">
          <div className="inline-search wide">
            <Search size={16} />
            <input value={query} onChange={function (event) { setQuery(event.target.value) }} placeholder="Search tasks" />
          </div>
          <button className="filter-btn" type="button"><SlidersHorizontal size={16} /> Filter</button>
          <a href="#new-task" className="primary-link-btn"><Plus size={16} /> Add task</a>
        </div>

        <div className="project-workspace-grid">
          <section className="panel task-view-panel">
            {viewMode === 'board' ? (
              <TaskBoard tasks={filteredTasks} onMoveTask={moveTask} onDeleteTask={deleteTask} onSelectTask={setSelectedTask} />
            ) : (
              <div className="task-list-view">
                <div className="task-list-header">
                  <span>Task</span>
                  <span>Status</span>
                  <span>Priority</span>
                  <span>Due date</span>
                  <span></span>
                </div>
                {filteredTasks.map(function (task) {
                  return (
                    <div className="task-list-row" key={task.id} onClick={function () { setSelectedTask(task) }}>
                      <div>
                        <strong>{task.title}</strong>
                        <p>{task.description || 'No description'}</p>
                      </div>
                      <span className={'status-pill status-' + task.status}>{getStatusLabel(task.status)}</span>
                      <span className={'priority priority-' + task.priority}>{getPriorityLabel(task.priority)}</span>
                      <span>{task.due_date || 'No date'}</span>
                      <button className="delete-btn" onClick={function (event) { event.stopPropagation(); deleteTask(task.id) }} type="button"><Trash2 size={15} /></button>
                    </div>
                  )
                })}
                {filteredTasks.length === 0 ? <div className="empty-state-pro compact"><h3>No tasks found</h3><p>Create a task or change your search.</p></div> : null}
              </div>
            )}
          </section>

          <aside className="panel task-form-panel" id="new-task">
            <form onSubmit={createTask}>
              <h2>Add Task</h2>
              <p>Create clear action items with status, priority and deadline.</p>
              <label>Task title</label>
              <input value={taskForm.title} onChange={function (event) { handleFieldChange('title', event.target.value) }} placeholder="Example: Setup GA4 conversion tracking" />
              <label>Description</label>
              <textarea value={taskForm.description} onChange={function (event) { handleFieldChange('description', event.target.value) }} placeholder="Task notes, scope, checklist" rows="4" />
              <div className="two-col-form">
                <div>
                  <label>Status</label>
                  <select value={taskForm.status} onChange={function (event) { handleFieldChange('status', event.target.value) }}>
                    {taskStatuses.map(function (item) {
                      return <option value={item.key} key={item.key}>{item.label}</option>
                    })}
                  </select>
                </div>
                <div>
                  <label>Priority</label>
                  <select value={taskForm.priority} onChange={function (event) { handleFieldChange('priority', event.target.value) }}>
                    {priorities.map(function (item) {
                      return <option value={item.key} key={item.key}>{item.label}</option>
                    })}
                  </select>
                </div>
              </div>
              <label>Due date</label>
              <input type="date" value={taskForm.due_date} onChange={function (event) { handleFieldChange('due_date', event.target.value) }} />
              <button className="primary-btn" type="submit">Add Task</button>
            </form>
          </aside>
        </div>
      </div>

      {selectedTask ? (
        <div className="task-drawer-overlay" onClick={function () { setSelectedTask(null) }}>
          <aside className="task-drawer" onClick={function (event) { event.stopPropagation() }}>
            <button className="drawer-close" onClick={function () { setSelectedTask(null) }} type="button"><X size={18} /></button>
            <div className="drawer-status"><CheckCircle2 size={18} /> {getStatusLabel(selectedTask.status)}</div>
            <h2>{selectedTask.title}</h2>
            <p>{selectedTask.description || 'No description added.'}</p>
            <div className="drawer-meta-grid">
              <div><span>Priority</span><strong>{getPriorityLabel(selectedTask.priority)}</strong></div>
              <div><span>Due date</span><strong>{selectedTask.due_date || 'No date'}</strong></div>
              <div><span>Project</span><strong>{project.name}</strong></div>
              <div><span>Workspace</span><strong>{workspace ? workspace.name : 'Workspace'}</strong></div>
            </div>
          </aside>
        </div>
      ) : null}
    </AppShell>
  )
}
