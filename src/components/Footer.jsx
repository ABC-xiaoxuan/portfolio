import { profile } from '../data/resume.js'

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="wrap">
        <p className="footer__title">
          有后端 / AI Agent 相关的机会，
          <br />
          欢迎直接找我聊。
        </p>

        <div className="footer__links">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={`tel:${profile.phone}`}>{profile.phone}</a>
          {profile.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>

        <div className="footer__base">
          <span>
            {profile.name} · {profile.role} · {profile.location}
          </span>
          <span>本站用自研 skill「award-level-web-design」做渲染自检</span>
        </div>
      </div>
    </footer>
  )
}
