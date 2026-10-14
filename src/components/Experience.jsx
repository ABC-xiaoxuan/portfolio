import Reveal from './Reveal.jsx'
import { education, jobs } from '../data/resume.js'

export default function Experience() {
  return (
    <section className="section" id="experience">
      <div className="wrap">
        <div className="section__head">
          <span className="section__index">02</span>
          <h2 className="section__title">经历</h2>
          <span className="section__note">3 段 · 2024.06 – 至今</span>
        </div>

        <div className="timeline">
          {jobs.map((job, i) => (
            <Reveal as="article" className="job" key={job.company} delay={i * 70}>
              <p className="job__when">{job.period}</p>
              <div>
                <h3 className="job__company">{job.company}</h3>
                <p className="job__role">{job.role}</p>
                <ul className="job__points">
                  {job.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}

          <Reveal as="article" className="job" delay={210}>
            <p className="job__when">{education.period}</p>
            <div>
              <h3 className="job__company">{education.school}</h3>
              <p className="job__role">
                {education.major} · {education.gpa}
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
