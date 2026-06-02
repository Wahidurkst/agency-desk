import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Filter,
  FolderKanban,
  GanttChartSquare,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  PanelRightOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
  X,
} from 'lucide-react'
import './App.css'
import {
  initialCustomFields,
  initialCustomFieldValues,
  initialTasks,
  projects,
  statuses,
  teammates,
} from './data'

const STORAGE_KEY = 'agency-desk-state-v1'

const viewTabs = [
  { id: 'board', label: 'Board', icon: LayoutDashboard },
  { id: 'list', label: 'List', icon: ListChecks },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'workload', label: 'Workload', icon: BarChart3 },
]

const priorityOrder = {
  High: 0,
  Medium: 1,
  Low: 2,
}

const priorityClass = {
  High: 'danger',
  Medium: 'warning',
  Low: 'success',
}

function normalizeTasks(taskList) {
  return taskList.map((task) => ({
    ...task,
    fields: {
      ...(initialCustomFieldValues[task.id] ?? {}),
      ...(task.fields ?? {}),
    },
  }))
}

function normalizeCustomFields(fieldList = initialCustomFields) {
  const savedFieldIds = new Set(fieldList.map((field) => field.id))
  return [
    ...fieldList,
    ...initialCustomFields.filter((field) => !savedFieldIds.has(field.id)),
  ]
}

function loadSavedState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      return {
        tasks: normalizeTasks(initialTasks),
        customFields: initialCustomFields,
      }
    }

    const parsed = JSON.parse(saved)
    return {
      tasks: normalizeTasks(Array.isArray(parsed.tasks) ? parsed.tasks : initialTasks),
      customFields: normalizeCustomFields(
        Array.isArray(parsed.customFields) ? parsed.customFields : initialCustomFields,
      ),
    }
  } catch {
    return {
      tasks: normalizeTasks(initialTasks),
      customFields: initialCustomFields,
    }
  }
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return 'No date'

  return new Intl.DateTimeFormat('en', options).format(new Date(`${value}T12:00:00`))
}

function daysBetween(start, end) {
  const startDate = new Date(`${start}T12:00:00`)
  const endDate = new Date(`${end}T12:00:00`)
  return Math.max(1, Math.round((endDate - startDate) / 86400000) + 1)
}

function getAvatar(memberId) {
  return teammates.find((member) => member.id === memberId) ?? teammates[0]
}

function App() {
  const [tasks, setTasks] = useState(loadSavedTasks)
  const [activeSection, setActiveSection] = useState('projects')
  const [activeProjectId, setActiveProjectId] = useState(projects[0].id)
  const [activeView, setActiveView] = useState('board')
  const [selectedTaskId, setSelectedTaskId] = useState(initialTasks[1].id)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showCreateTask, setShowCreateTask] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks }))
  }, [tasks])

  const activeProject = projects.find((project) => project.id === activeProjectId)
  const projectTasks = tasks.filter((task) => task.projectId === activeProjectId)

  const filteredTasks = useMemo(() => {
    return projectTasks
      .filter((task) => {
        const searchable = [
          task.title,
          task.description,
          task.priority,
          task.status,
          getAvatar(task.assignee).name,
          ...task.tags,
        ]
          .join(' ')
          .toLowerCase()

        const matchesSearch = searchable.includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || task.status === statusFilter
        const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter

        return matchesSearch && matchesStatus && matchesPriority
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [projectTasks, searchTerm, statusFilter, priorityFilter])

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ??
    (activeSection === 'projects' ? filteredTasks[0] : null)
  const completedCount = projectTasks.filter((task) => task.status === 'done').length
  const progress = projectTasks.length ? Math.round((completedCount / projectTasks.length) * 100) : 0
  const overdueCount = projectTasks.filter(
    (task) => task.status !== 'done' && new Date(`${task.due}T12:00:00`) < new Date(),
  ).length

  function updateTask(taskId, patch) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
    )
  }

  function moveTask(taskId, status) {
    updateTask(taskId, {
      status,
      progress: status === 'done' ? 100 : status === 'doing' ? 55 : status === 'review' ? 78 : 15,
    })
  }

  function addTask(taskInput) {
    const newTask = {
      id: `task-${Date.now()}`,
      projectId: activeProjectId,
      title: taskInput.title,
      status: taskInput.status,
      priority: taskInput.priority,
      assignee: taskInput.assignee,
      collaborators: [],
      due: taskInput.due,
      start: taskInput.start,
      estimate: Number(taskInput.estimate),
      tags: taskInput.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      progress: taskInput.status === 'done' ? 100 : 0,
      description: taskInput.description,
      subtasks: [],
      comments: [],
    }

    setTasks((currentTasks) => [newTask, ...currentTasks])
    setSelectedTaskId(newTask.id)
    setShowCreateTask(false)
  }

  function addComment(taskId, text) {
    const comment = {
      id: `comment-${Date.now()}`,
      author: 'mira',
      text,
      time: 'Just now',
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, comments: [comment, ...task.comments] } : task,
      ),
    )
  }

  function toggleSubtask(taskId, subtaskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) return task

        const subtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
        )
        const doneCount = subtasks.filter((subtask) => subtask.done).length
        const progress = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : task.progress

        return { ...task, subtasks, progress }
      }),
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        activeProjectId={activeProjectId}
        progress={progress}
        tasks={tasks}
        onSectionChange={setActiveSection}
        onCreateTask={() => setShowCreateTask(true)}
        onProjectChange={(projectId) => {
          setActiveSection('projects')
          setActiveProjectId(projectId)
          setSelectedTaskId(tasks.find((task) => task.projectId === projectId)?.id)
        }}
      />

      <main className="workspace">
        <Topbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateTask={() => setShowCreateTask(true)}
        />

        {activeSection === 'projects' ? (
          <>
            <ProjectHeader
              activeProject={activeProject}
              completedCount={completedCount}
              overdueCount={overdueCount}
              progress={progress}
              taskCount={projectTasks.length}
              activeView={activeView}
              onViewChange={setActiveView}
            />

            <FilterBar
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              onStatusFilterChange={setStatusFilter}
              onPriorityFilterChange={setPriorityFilter}
              resultCount={filteredTasks.length}
            />

            {activeView === 'board' && (
              <BoardView
                tasks={filteredTasks}
                selectedTaskId={selectedTask?.id}
                onSelectTask={setSelectedTaskId}
                onMoveTask={moveTask}
              />
            )}

            {activeView === 'list' && (
              <ListView tasks={filteredTasks} onSelectTask={setSelectedTaskId} onUpdateTask={updateTask} />
            )}

            {activeView === 'timeline' && <TimelineView tasks={filteredTasks} onSelectTask={setSelectedTaskId} />}

            {activeView === 'calendar' && <CalendarView tasks={filteredTasks} onSelectTask={setSelectedTaskId} />}

            {activeView === 'workload' && <WorkloadView tasks={projectTasks} />}
          </>
        ) : (
          <WorkspaceSection
            activeSection={activeSection}
            searchTerm={searchTerm}
            tasks={tasks}
            onSelectTask={setSelectedTaskId}
            onUpdateTask={updateTask}
          />
        )}
      </main>

      <TaskDrawer
        key={selectedTask?.id ?? 'empty-task'}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onUpdateTask={updateTask}
        onAddComment={addComment}
        onToggleSubtask={toggleSubtask}
      />

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreateTask={addTask}
          defaultProject={activeProject}
        />
      )}
    </div>
  )
}

function Sidebar({
  activeSection,
  activeProjectId,
  progress,
  tasks,
  onSectionChange,
  onCreateTask,
  onProjectChange,
}) {
  const inboxCount = tasks.reduce((total, task) => total + task.comments.length, 0)
  const myTaskCount = tasks.filter((task) => task.assignee === 'mira' && task.status !== 'done').length

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <FolderKanban size={21} />
        </div>
        <div>
          <strong>Agency Desk</strong>
          <span>Client operations</span>
        </div>
      </div>

      <nav className="nav-group" aria-label="Workspace">
        <button
          className={`nav-item ${activeSection === 'inbox' ? 'active' : ''}`}
          type="button"
          onClick={() => onSectionChange('inbox')}
        >
          <Inbox size={18} />
          Inbox
          <span className="nav-count">{inboxCount}</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'my-tasks' ? 'active' : ''}`}
          type="button"
          onClick={() => onSectionChange('my-tasks')}
        >
          <Check size={18} />
          My tasks
          <span className="nav-count">{myTaskCount}</span>
        </button>
        <button
          className={`nav-item ${activeSection === 'goals' ? 'active' : ''}`}
          type="button"
          onClick={() => onSectionChange('goals')}
        >
          <Target size={18} />
          Goals
        </button>
        <button
          className={`nav-item ${activeSection === 'team' ? 'active' : ''}`}
          type="button"
          onClick={() => onSectionChange('team')}
        >
          <Users size={18} />
          Team
        </button>
      </nav>

      <div className="sidebar-section">
        <div className="section-label">
          <span>Projects</span>
          <button className="section-icon-button" aria-label="Create task" type="button" onClick={onCreateTask}>
            <Plus size={16} />
          </button>
        </div>
        <div className="project-list">
          {projects.map((project) => {
            const projectTaskCount = tasks.filter((task) => task.projectId === project.id).length

            return (
              <button
                className={`project-pill ${
                  activeSection === 'projects' && activeProjectId === project.id ? 'selected' : ''
                }`}
                key={project.id}
                type="button"
                onClick={() => onProjectChange(project.id)}
              >
                <span className="project-dot" style={{ backgroundColor: project.color }} />
                <span>
                  <strong>{project.name}</strong>
                  <small>{project.client}</small>
                </span>
                <em>{projectTaskCount}</em>
              </button>
            )
          })}
        </div>
      </div>

      <div className="smart-panel">
        <div className="spark-icon">
          <Sparkles size={17} />
        </div>
        <strong>{progress}% project velocity</strong>
        <span>Keep approvals moving before the client checkpoint.</span>
      </div>
    </aside>
  )
}

function WorkspaceSection({ activeSection, searchTerm, tasks, onSelectTask, onUpdateTask }) {
  const normalizedSearch = searchTerm.toLowerCase()
  const visibleTasks = tasks.filter((task) =>
    [task.title, task.description, task.priority, task.status, getAvatar(task.assignee).name, ...task.tags]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch),
  )
  const myTasks = visibleTasks.filter((task) => task.assignee === 'mira')
  const reviewTasks = visibleTasks.filter((task) => task.status === 'review')
  const activeTasks = tasks.filter((task) => task.status !== 'done')
  const comments = tasks.flatMap((task) =>
    task.comments.map((comment) => ({
      ...comment,
      taskId: task.id,
      taskTitle: task.title,
      project: projects.find((project) => project.id === task.projectId),
    })),
  )
  const doneTasks = tasks.filter((task) => task.status === 'done').length
  const allProgress = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0

  if (activeSection === 'my-tasks') {
    return (
      <section className="section-page">
        <SectionHero
          icon={Check}
          kicker="Personal queue"
          title="My tasks"
          description="Everything assigned to Mira, grouped into one focused action list."
        />
        <div className="section-metrics">
          <Metric label="Assigned" value={myTasks.length} />
          <Metric label="In review" value={reviewTasks.filter((task) => task.assignee === 'mira').length} />
          <Metric label="Active" value={myTasks.filter((task) => task.status !== 'done').length} tone="success" />
        </div>
        <ListView tasks={myTasks} onSelectTask={onSelectTask} onUpdateTask={onUpdateTask} />
      </section>
    )
  }

  if (activeSection === 'inbox') {
    return (
      <section className="section-page">
        <SectionHero
          icon={Inbox}
          kicker="Notifications"
          title="Inbox"
          description="Recent comments, review requests, and due-date signals from all agency projects."
        />
        <div className="activity-feed">
          {comments.map((comment) => {
            const author = getAvatar(comment.author)

            return (
              <button className="activity-card" key={comment.id} type="button" onClick={() => onSelectTask(comment.taskId)}>
                <Avatar member={author} />
                <span>
                  <strong>{author.name}</strong> commented on <strong>{comment.taskTitle}</strong>
                  <small>
                    {comment.project?.name} · {comment.time}
                  </small>
                </span>
                <em>{comment.text}</em>
              </button>
            )
          })}
          {reviewTasks.map((task) => (
            <button className="activity-card" key={`review-${task.id}`} type="button" onClick={() => onSelectTask(task.id)}>
              <span className="activity-icon">
                <Check size={17} />
              </span>
              <span>
                <strong>{task.title}</strong> is waiting for review
                <small>{projects.find((project) => project.id === task.projectId)?.name}</small>
              </span>
              <em>Due {formatDate(task.due)}</em>
            </button>
          ))}
        </div>
      </section>
    )
  }

  if (activeSection === 'goals') {
    return (
      <section className="section-page">
        <SectionHero
          icon={Target}
          kicker="Agency goals"
          title="Goals"
          description="Track delivery health, approval flow, and client-work velocity across every project."
        />
        <div className="goal-grid">
          <GoalCard label="Complete active delivery" value={allProgress} detail={`${doneTasks}/${tasks.length} tasks done`} />
          <GoalCard
            label="Keep review queue light"
            value={Math.max(0, 100 - reviewTasks.length * 18)}
            detail={`${reviewTasks.length} items in review`}
          />
          <GoalCard
            label="Protect team capacity"
            value={Math.max(0, 100 - activeTasks.length * 6)}
            detail={`${activeTasks.length} active assignments`}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="section-page">
      <SectionHero
        icon={Users}
        kicker="People"
        title="Team"
        description="See teammates, roles, current load, and the tasks each person is carrying."
      />
      <div className="team-grid">
        {teammates.map((member) => {
          const assigned = tasks.filter((task) => task.assignee === member.id && task.status !== 'done')

          return (
            <article className="team-card" key={member.id}>
              <Avatar member={member} />
              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
              <em>{assigned.length} active</em>
            </article>
          )
        })}
      </div>
      <WorkloadView tasks={tasks} />
    </section>
  )
}

function SectionHero({ icon: Icon, kicker, title, description }) {
  return (
    <section className="section-hero">
      <div className="section-hero-icon">
        <Icon size={22} />
      </div>
      <div>
        <span>{kicker}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}

function GoalCard({ label, value, detail }) {
  return (
    <article className="goal-card">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="progress-line">
        <span style={{ width: `${value}%` }} />
      </div>
      <p>{detail}</p>
    </article>
  )
}

function Topbar({ searchTerm, onSearchChange, onCreateTask }) {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={18} />
        <input
          aria-label="Search tasks"
          placeholder="Search tasks, tags, teammates..."
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="topbar-actions">
        <IconButton label="Notifications">
          <Bell size={18} />
        </IconButton>
        <button className="ghost-button" type="button">
          <Users size={18} />
          Invite
        </button>
        <button className="primary-button" type="button" onClick={onCreateTask}>
          <Plus size={18} />
          New task
        </button>
      </div>
    </header>
  )
}

function ProjectHeader({
  activeProject,
  completedCount,
  overdueCount,
  progress,
  taskCount,
  activeView,
  onViewChange,
}) {
  const owner = getAvatar(activeProject.owner)

  return (
    <section className="project-header">
      <div className="project-title-row">
        <div>
          <div className="eyebrow">
            <span className="project-dot" style={{ backgroundColor: activeProject.color }} />
            {activeProject.client}
          </div>
          <h1>{activeProject.name}</h1>
          <p>{activeProject.brief}</p>
        </div>

        <div className="project-actions">
          <div className="avatar-stack" aria-label="Project members">
            {teammates.slice(0, 4).map((member) => (
              <Avatar key={member.id} member={member} />
            ))}
          </div>
          <button className="ghost-button compact" type="button">
            Share
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <Metric label="Progress" value={`${progress}%`} tone="success" />
        <Metric label="Completed" value={`${completedCount}/${taskCount}`} />
        <Metric label="Owner" value={owner.name.split(' ')[0]} />
        <Metric label="Due" value={formatDate(activeProject.due)} tone={overdueCount > 0 ? 'danger' : 'neutral'} />
      </div>

      <div className="view-tabs" role="tablist" aria-label="Project views">
        {viewTabs.map((view) => {
          const Icon = view.icon

          return (
            <button
              aria-selected={activeView === view.id}
              className={activeView === view.id ? 'active' : ''}
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
            >
              <Icon size={17} />
              {view.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function FilterBar({
  statusFilter,
  priorityFilter,
  onStatusFilterChange,
  onPriorityFilterChange,
  resultCount,
}) {
  return (
    <section className="filter-bar">
      <div className="filter-summary">
        <Filter size={17} />
        <strong>{resultCount}</strong>
        <span>visible tasks</span>
      </div>

      <div className="filter-controls">
        <label>
          Status
          <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
            <option value="all">All</option>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select value={priorityFilter} onChange={(event) => onPriorityFilterChange(event.target.value)}>
            <option value="all">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
      </div>
    </section>
  )
}

function BoardView({ tasks, selectedTaskId, onSelectTask, onMoveTask }) {
  return (
    <section className="board" aria-label="Kanban board">
      {statuses.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status.id)

        return (
          <div
            className="board-column"
            key={status.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const taskId = event.dataTransfer.getData('text/plain')
              if (taskId) onMoveTask(taskId, status.id)
            }}
          >
            <div className="column-header">
              <div>
                <strong>{status.name}</strong>
                <span>{status.description}</span>
              </div>
              <em>{columnTasks.length}</em>
            </div>

            <div className="column-tasks">
              {columnTasks.map((task) => (
                <TaskCard
                  isSelected={selectedTaskId === task.id}
                  key={task.id}
                  task={task}
                  onSelectTask={onSelectTask}
                />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}

function TaskCard({ task, isSelected, onSelectTask }) {
  const assignee = getAvatar(task.assignee)
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.done).length

  return (
    <article
      className={`task-card ${isSelected ? 'selected' : ''}`}
      draggable
      onClick={() => onSelectTask(task.id)}
      onDragStart={(event) => event.dataTransfer.setData('text/plain', task.id)}
    >
      <div className="task-card-top">
        <span className={`priority-pill ${priorityClass[task.priority]}`}>{task.priority}</span>
        <MoreHorizontal size={18} />
      </div>

      <h3>{task.title}</h3>
      <p>{task.description}</p>

      <div className="tag-row">
        {task.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="progress-line">
        <span style={{ width: `${task.progress}%` }} />
      </div>

      <div className="task-card-footer">
        <Avatar member={assignee} />
        <span>
          <CalendarDays size={15} />
          {formatDate(task.due)}
        </span>
        <span>
          <Check size={15} />
          {completedSubtasks}/{task.subtasks.length}
        </span>
      </div>
    </article>
  )
}

function ListView({ tasks, onSelectTask, onUpdateTask }) {
  return (
    <section className="list-view">
      <div className="list-header">
        <span>Task</span>
        <span>Status</span>
        <span>Owner</span>
        <span>Due</span>
        <span>Priority</span>
      </div>

      {tasks.map((task) => (
        <button className="list-row" key={task.id} type="button" onClick={() => onSelectTask(task.id)}>
          <span className="list-task-name">
            <Circle size={16} />
            {task.title}
          </span>
          <span onClick={(event) => event.stopPropagation()}>
            <select value={task.status} onChange={(event) => onUpdateTask(task.id, { status: event.target.value })}>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </span>
          <span>
            <Avatar member={getAvatar(task.assignee)} />
            {getAvatar(task.assignee).name}
          </span>
          <span>{formatDate(task.due)}</span>
          <span className={`priority-pill ${priorityClass[task.priority]}`}>{task.priority}</span>
        </button>
      ))}
    </section>
  )
}

function TimelineView({ tasks, onSelectTask }) {
  const startDate = '2026-06-01'
  const days = Array.from({ length: 18 }, (_, index) => {
    const date = new Date(`${startDate}T12:00:00`)
    date.setDate(date.getDate() + index)
    return date.toISOString().slice(0, 10)
  })

  return (
    <section className="timeline-view">
      <div className="timeline-grid timeline-grid-head">
        <span>Task</span>
        {days.map((day) => (
          <span key={day}>{formatDate(day, { day: 'numeric' })}</span>
        ))}
      </div>

      {tasks.map((task) => {
        const offset = Math.max(0, daysBetween(startDate, task.start) - 1)
        const duration = daysBetween(task.start, task.due)

        return (
          <button className="timeline-grid timeline-row" key={task.id} type="button" onClick={() => onSelectTask(task.id)}>
            <span>{task.title}</span>
            <em
              className={`timeline-bar ${priorityClass[task.priority]}`}
              style={{
                gridColumn: `${offset + 2} / span ${duration}`,
              }}
            >
              {formatDate(task.due)}
            </em>
          </button>
        )
      })}
    </section>
  )
}

function CalendarView({ tasks, onSelectTask }) {
  const days = Array.from({ length: 21 }, (_, index) => {
    const date = new Date('2026-06-01T12:00:00')
    date.setDate(date.getDate() + index)
    const value = date.toISOString().slice(0, 10)
    return {
      value,
      label: formatDate(value, { weekday: 'short', day: 'numeric' }),
      tasks: tasks.filter((task) => task.due === value),
    }
  })

  return (
    <section className="calendar-view">
      {days.map((day) => (
        <div className="calendar-day" key={day.value}>
          <strong>{day.label}</strong>
          {day.tasks.map((task) => (
            <button key={task.id} type="button" onClick={() => onSelectTask(task.id)}>
              <span className={`priority-dot ${priorityClass[task.priority]}`} />
              {task.title}
            </button>
          ))}
        </div>
      ))}
    </section>
  )
}

function WorkloadView({ tasks }) {
  return (
    <section className="workload-view">
      {teammates.map((member) => {
        const assignedTasks = tasks.filter((task) => task.assignee === member.id && task.status !== 'done')
        const hours = assignedTasks.reduce((total, task) => total + task.estimate, 0)
        const load = Math.min(100, Math.round((hours / member.capacity) * 100))

        return (
          <article className="workload-card" key={member.id}>
            <div className="member-line">
              <Avatar member={member} />
              <div>
                <strong>{member.name}</strong>
                <span>{member.role}</span>
              </div>
            </div>
            <div className="workload-meter">
              <span style={{ width: `${load}%` }} />
            </div>
            <div className="workload-meta">
              <span>{hours}h planned</span>
              <span>{assignedTasks.length} active tasks</span>
            </div>
            <div className="mini-task-list">
              {assignedTasks.slice(0, 3).map((task) => (
                <span key={task.id}>{task.title}</span>
              ))}
              {assignedTasks.length === 0 && <span>Available for new work</span>}
            </div>
          </article>
        )
      })}
    </section>
  )
}

function TaskDrawer({ task, onClose, onUpdateTask, onAddComment, onToggleSubtask }) {
  const [comment, setComment] = useState('')

  if (!task) {
    return (
      <aside className="task-drawer empty-drawer">
        <PanelRightOpen size={24} />
        <strong>Select a task</strong>
        <span>Open a card to inspect details, approvals, and comments.</span>
      </aside>
    )
  }

  const assignee = getAvatar(task.assignee)
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.done).length

  return (
    <aside className="task-drawer">
      <div className="drawer-actions">
        <button className="icon-button" aria-label="Close task detail" type="button" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="drawer-heading">
        <span className={`priority-pill ${priorityClass[task.priority]}`}>{task.priority}</span>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
      </div>

      <div className="field-grid">
        <label>
          Status
          <select value={task.status} onChange={(event) => onUpdateTask(task.id, { status: event.target.value })}>
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Owner
          <select value={task.assignee} onChange={(event) => onUpdateTask(task.id, { assignee: event.target.value })}>
            {teammates.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input type="date" value={task.due} onChange={(event) => onUpdateTask(task.id, { due: event.target.value })} />
        </label>
        <label>
          Priority
          <select value={task.priority} onChange={(event) => onUpdateTask(task.id, { priority: event.target.value })}>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title">
          <strong>Subtasks</strong>
          <span>
            {completedSubtasks}/{task.subtasks.length}
          </span>
        </div>
        <div className="subtask-list">
          {task.subtasks.map((subtask) => (
            <button key={subtask.id} type="button" onClick={() => onToggleSubtask(task.id, subtask.id)}>
              <span className={subtask.done ? 'checked-box checked' : 'checked-box'}>
                {subtask.done && <Check size={13} />}
              </span>
              {subtask.label}
            </button>
          ))}
          {task.subtasks.length === 0 && <span className="muted">No subtasks yet.</span>}
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title">
          <strong>Context</strong>
          <span>{task.estimate}h estimate</span>
        </div>
        <div className="context-list">
          <span>
            <Avatar member={assignee} />
            {assignee.name}
          </span>
          <span>
            <Clock3 size={16} />
            {formatDate(task.start)} to {formatDate(task.due)}
          </span>
          <span>
            <Activity size={16} />
            {task.progress}% complete
          </span>
        </div>
      </div>

      <div className="drawer-section comments">
        <div className="drawer-section-title">
          <strong>Comments</strong>
          <span>{task.comments.length}</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!comment.trim()) return
            onAddComment(task.id, comment.trim())
            setComment('')
          }}
        >
          <input
            placeholder="Write an update..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <button className="primary-button compact" type="submit">
            Send
          </button>
        </form>
        <div className="comment-list">
          {task.comments.map((item) => {
            const author = getAvatar(item.author)

            return (
              <article key={item.id}>
                <Avatar member={author} />
                <div>
                  <strong>
                    {author.name}
                    <span>{item.time}</span>
                  </strong>
                  <p>{item.text}</p>
                </div>
              </article>
            )
          })}
          {task.comments.length === 0 && <span className="muted">No comments yet.</span>}
        </div>
      </div>
    </aside>
  )
}

function CreateTaskModal({ onClose, onCreateTask }) {
  const [taskInput, setTaskInput] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'Medium',
    assignee: teammates[0].id,
    start: '2026-06-03',
    due: '2026-06-12',
    estimate: 3,
    tags: 'Client, Delivery',
  })

  function updateField(field, value) {
    setTaskInput((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form
        className="create-modal"
        onSubmit={(event) => {
          event.preventDefault()
          if (!taskInput.title.trim()) return
          onCreateTask(taskInput)
        }}
      >
        <div className="modal-title">
          <div>
            <span>Quick add</span>
            <h2>Create a task</h2>
          </div>
          <button className="icon-button" aria-label="Close modal" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <label>
          Task name
          <input
            autoFocus
            required
            placeholder="Prepare campaign launch checklist"
            value={taskInput.title}
            onChange={(event) => updateField('title', event.target.value)}
          />
        </label>

        <label>
          Description
          <textarea
            placeholder="Add the work, expected output, and approval notes."
            value={taskInput.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </label>

        <div className="modal-grid">
          <label>
            Status
            <select value={taskInput.status} onChange={(event) => updateField('status', event.target.value)}>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select value={taskInput.priority} onChange={(event) => updateField('priority', event.target.value)}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label>
            Assignee
            <select value={taskInput.assignee} onChange={(event) => updateField('assignee', event.target.value)}>
              {teammates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estimate
            <input
              min="1"
              type="number"
              value={taskInput.estimate}
              onChange={(event) => updateField('estimate', event.target.value)}
            />
          </label>
          <label>
            Start
            <input type="date" value={taskInput.start} onChange={(event) => updateField('start', event.target.value)} />
          </label>
          <label>
            Due
            <input type="date" value={taskInput.due} onChange={(event) => updateField('due', event.target.value)} />
          </label>
        </div>

        <label>
          Tags
          <input value={taskInput.tags} onChange={(event) => updateField('tags', event.target.value)} />
        </label>

        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="submit">
            <Plus size={18} />
            Create task
          </button>
        </div>
      </form>
    </div>
  )
}

function Metric({ label, value, tone = 'neutral' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Avatar({ member }) {
  return (
    <span className="avatar" style={{ backgroundColor: member.color }} title={member.name}>
      {member.initials}
    </span>
  )
}

function IconButton({ label, children }) {
  return (
    <button className="icon-button" aria-label={label} title={label} type="button">
      {children}
    </button>
  )
}

export default App
