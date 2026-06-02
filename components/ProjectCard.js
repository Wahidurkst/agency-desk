import Link from 'next/link'
import { CalendarDays, MoreHorizontal, UsersRound } from 'lucide-react'

export default function ProjectCard({ project, taskCount }) {
  var description = project.description || 'No description added yet.'
  var createdDate = project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Recently'

  return (
    <Link href={'/projects/' + project.id} className="project-tile">
      <div className="project-tile-top">
        <div className="project-icon-gradient">{project.name.charAt(0).toUpperCase()}</div>
        <button className="ghost-icon" type="button"><MoreHorizontal size={18} /></button>
      </div>
      <h3>{project.name}</h3>
      <p>{description}</p>
      <div className="project-progress-wrap">
        <div className="project-progress-bar"><span style={{ width: taskCount > 0 ? '35%' : '8%' }} /></div>
      </div>
      <div className="project-meta-row">
        <span><UsersRound size={14} /> {taskCount || 0} tasks</span>
        <span><CalendarDays size={14} /> {createdDate}</span>
      </div>
    </Link>
  )
}
