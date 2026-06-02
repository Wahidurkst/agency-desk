'use client'

import { taskStatuses } from '@/lib/constants'

function priorityClass(priority) {
  return 'badge priority-' + (priority || 'medium')
}

export default function TaskBoard({ tasks, onMoveTask, onDeleteTask }) {
  return (
    <div className="board">
      {taskStatuses.map(function (status) {
        var columnTasks = tasks.filter(function (task) {
          return task.status === status.key
        })

        return (
          <section className="board-column" key={status.key}>
            <h3>
              <span>{status.label}</span>
              <span>{columnTasks.length}</span>
            </h3>

            {columnTasks.map(function (task) {
              return (
                <article className="task-card" key={task.id}>
                  <h4>{task.title}</h4>
                  {task.description ? <p>{task.description}</p> : null}

                  <div className="badge-row" style={{ marginBottom: 12 }}>
                    <span className={priorityClass(task.priority)}>{task.priority}</span>
                    {task.due_date ? <span className="badge">Due {task.due_date}</span> : null}
                  </div>

                  <div className="task-actions">
                    {taskStatuses.map(function (nextStatus) {
                      if (nextStatus.key === task.status) {
                        return null
                      }

                      return (
                        <button
                          key={nextStatus.key}
                          type="button"
                          onClick={function () {
                            onMoveTask(task.id, nextStatus.key)
                          }}
                        >
                          {nextStatus.label}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={function () {
                        onDeleteTask(task.id)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )
      })}
    </div>
  )
}
