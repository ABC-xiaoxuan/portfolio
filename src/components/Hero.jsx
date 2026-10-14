import { useCountUp, useInView } from '../hooks/useReveal.js'
import { heroTranscript, profile } from '../data/resume.js'

/**
 * Signature moment #1 — the hero *is* a context window.
 * A transcript states who this person is, with a live token meter that fills
 * once the panel scrolls into view.
 */
export default function Hero() {
  const [ref, inView] = useInView()
  const tokens = useCountUp(12847, inView, 1700)

  return (
    <header className="hero">
      <div className="wrap">
        <div className="hero__top">
          <span className="hero__status">
            <span className="pulse" />
            <span className="eyebrow">开放机会 · {profile.location}</span>
          </span>
          <span className="eyebrow hero__role">{profile.role}</span>
        </div>

        <h1 className="hero__name">
          <small>{profile.latin}</small>
          {profile.name}
        </h1>

        <p className="hero__tagline">
          <strong>{profile.tagline}</strong> —— 从工业 IoT 数据采集，到企业级 CAD AI Agent，再到珠宝 3D 素材平台。
        </p>

        <div className="window" ref={ref}>
          <div className="window__bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="window__path">daweixuan / context</span>
            <span className="window__meter">
              <span className="meter" aria-hidden="true">
                <i className="meter__fill" style={{ '--scale': inView ? 0.62 : 0 }} />
              </span>
              <span className="window__tokens">{tokens.toLocaleString('en-US')} / 200,000 tokens</span>
            </span>
          </div>

          <div className="window__body">
            <div className="transcript">
              {heroTranscript.map((line, i) => (
                <div
                  className="line"
                  key={line.role + i}
                  style={{ '--line-delay': `${180 + i * 170}ms` }}
                >
                  <span className="line__no">{String(i + 1).padStart(3, '0')}</span>
                  <span className={`line__role line__role--${line.role}`}>{line.role}</span>
                  <span className="line__text">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <nav className="hero__meta" aria-label="作品与联系方式">
          {profile.links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
              <span className="arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
          <a href={`mailto:${profile.email}`}>
            {profile.email}
            <span className="arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        </nav>
      </div>
    </header>
  )
}
