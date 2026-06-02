import Link from 'next/link'

export default function ProjectCard({ project }) {
  return (
    <Link href={'/projects/' + project.id} className="project-card">
      <h3>{project.name}</h3>
      <p>{project.description || 'No description added yet.'}</p>
      <div className="badge-row">
        <span className="badge">{project.status || 'active'}</span>
        <span className="badge">Open Project</span>
      </div>
    </Link>
  )
}
