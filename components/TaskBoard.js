'use client'

import { CalendarDays, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react'
import { priorities, taskStatuses } from '@/lib/constants'

export default function TaskBoard({ tasks, onMoveTask, onDeleteTask, onSelectTask }) {
  function getTasksByStatus(statusKey) {
    return tasks.filter(function (task) {
      return task.status === statusKey
    })
  }

  function getPriorityLabel(priorityKey) {
    var priority = priorities.find(function (item) {
      return item.key === priorityKey
    })
    return priority ? priority.label : priorityKey
  }

  return (
    <div className="asana-board">
      {taskStatuses.map(function (statusItem) {
        var columnTasks = getTasksByStatus(statusItem.key)

        return (
          <div className="board-column" key={statusItem.key}>
            <div className="board-column-header">
              <div>
                <span className={'status-dot status-' + statusItem.key}></span>
                {statusItem.label}
              </div>
              <span>{columnTasks.length}</span>
            </div>

            <div className="task-stack">
              {columnTasks.map(function (task) {
                return (
                  <article className="task-card" key={task.id} onClick={function () {
                    if (onSelectTask) {
                      onSelectTask(task)
                    }
                  }}>
                    <div className="task-card-top">
                      <GripVertical size={16} />
                      <button className="ghost-icon" type="button"><MoreHorizontal size={16} /></button>
                    </div>
                    <h4>{task.title}</h4>
                    {task.description ? <p>{task.description}</p> : null}
                    <div className="task-badges">
                      <span className={'priority priority-' + task.priority}>{getPriorityLabel(task.priority)}</span>
                      {task.due_date ? <span className="due-pill"><CalendarDays size={13} /> {task.due_date}</span> : null}
                    </div>
                    <div className="task-actions" onClick={function (event) { event.stopPropagation() }}>
                      <select
                        value={task.status}
                        onChange={function (event) {
                          onMoveTask(task.id, event.target.value)
                        }}
                      >
                        {taskStatuses.map(function (item) {
                          return <option key={item.key} value={item.key}>{item.label}</option>
                        })}
                      </select>
                      <button className="delete-btn" onClick={function () { onDeleteTask(task.id) }} type="button">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                )
              })}

              {columnTasks.length === 0 ? (
                <div className="empty-column">Drop tasks here</div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
