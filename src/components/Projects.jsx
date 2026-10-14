import CacheDemo from './CacheDemo.jsx'
import Reveal from './Reveal.jsx'
import { projects } from '../data/resume.js'

export default function Projects() {
  return (
    <section className="section" id="work">
      <div className="wrap">
        <div className="section__head">
          <span className="section__index">01</span>
          <h2 className="section__title">项目</h2>
          <span className="section__note">
            {projects.length} 个 · 2025 – 至今
          </span>
        </div>

        <div className="projects">
          {projects.map((project, i) => (
            <Reveal as="article" className="card" key={project.id} delay={i * 70}>
              <div className="card__head">
                <h3 className="card__title">{project.name}</h3>
                <span className="card__meta">
                  {project.kind} · {project.period}
                </span>
              </div>

              <p className="card__summary">{project.summary}</p>

              <ul className="card__points">
                {project.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              {project.demo === 'cache' && <CacheDemo />}

              <div className="chip-list card__stack">
                {project.stack.map((item) => (
                  <span className="tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>

              {project.href && (
                <a className="card__link" href={project.href} target="_blank" rel="noreferrer">
                  {project.href.replace(/^https?:\/\//, '')}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
