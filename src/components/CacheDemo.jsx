import { useState } from 'react'
import { cacheMetrics, cacheRows } from '../data/resume.js'
import { useCountUp, useInView, useSteps } from '../hooks/useReveal.js'

const TIMINGS = [260, 1180]

function Stats({ active }) {
  const hit = useCountUp(cacheMetrics.hitAfter, active, 1250)
  const rebuild = useCountUp(cacheMetrics.rebuildAfter, active, 1250)

  return (
    <>
      <div className="stat">
        <p className="stat__label">缓存命中率</p>
        <p className="stat__value">
          <span className="stat__from">{cacheMetrics.hitBefore}%</span>
          <span className="stat__arrow" aria-hidden="true">
            →
          </span>
          <span className="stat__to">{hit}%</span>
        </p>
        <div className="stat__bar" aria-hidden="true">
          <i style={{ '--scale': active ? hit / 100 : 0 }} />
        </div>
      </div>

      <div className="stat">
        <p className="stat__label">上下文重建次数</p>
        <p className="stat__value">
          <span className="stat__from">{cacheMetrics.rebuildBefore}</span>
          <span className="stat__arrow" aria-hidden="true">
            →
          </span>
          <span className="stat__to stat__to--warn">{rebuild}</span>
        </p>
        <div className="stat__bar" aria-hidden="true">
          <i
            className="stat__bar--warn"
            style={{ '--scale': active ? rebuild / cacheMetrics.rebuildBefore : 0 }}
          />
        </div>
      </div>
    </>
  )
}

/**
 * Signature moment #2 — the caching work made visible.
 * A request's message list splits into a reusable prefix (locked, "cache hit")
 * and freshly appended items ("new"); the two counters then animate to the
 * measured after-values.
 */
export default function CacheDemo() {
  const [ref, inView] = useInView({ threshold: 0.28 })
  const [runKey, setRunKey] = useState(0)
  const step = useSteps(inView, TIMINGS, runKey)

  const prefixOn = step >= 1
  const newOn = step >= 2

  return (
    <div className="cache" ref={ref}>
      <div className="cache__head">
        <span className="cache__title">上下文复用 · 请求前缀</span>
        <span className="tag tag--accent">cache hit</span>
        <span className="tag tag--warn">new</span>
        <button
          type="button"
          className="cache__replay"
          onClick={() => setRunKey((k) => k + 1)}
          aria-label="重放缓存复用演示"
        >
          重放 ▸
        </button>
      </div>

      <div className="cache__body">
        <ol className="ctx" aria-label="请求中的消息列表：前六条为可复用前缀，后三条为新增">
          {cacheRows.map((row, i) => {
            const isPrefix = row.kind === 'prefix'
            const on = isPrefix ? prefixOn : newOn
            const state = on ? (isPrefix ? 'prefix' : 'new') : 'idle'

            return (
              <li className={`ctx__row ctx__row--${state}`} key={row.label}>
                <span className="ctx__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="ctx__label">{row.label}</span>
                <span className={`ctx__badge ctx__badge--${state === 'idle' ? 'idle' : isPrefix ? 'hit' : 'new'}`}>
                  {on ? (isPrefix ? 'cache hit ✓' : 'new') : '—'}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="cache__stats">
          <Stats key={runKey} active={newOn} />
        </div>
      </div>
    </div>
  )
}
