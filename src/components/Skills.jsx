import Reveal from './Reveal.jsx'
import { skills } from '../data/resume.js'

export default function Skills() {
  return (
    <section className="section section--tight" id="skills">
      <div className="wrap">
        <div className="section__head">
          <span className="section__index">03</span>
          <h2 className="section__title">技能</h2>
          <span className="section__note">按项目倒推，不堆名词</span>
        </div>

        <div className="skills">
          {skills.map((group, i) => (
            <Reveal key={group.group} delay={i * 70}>
              <p className="skill__group">{group.group}</p>
              <ul className="skill__items">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
