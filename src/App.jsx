import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import CadScene from './components/CadScene.jsx'
import AmbientBackground from './components/AmbientBackground.jsx'

gsap.registerPlugin(ScrollTrigger)

const TOKENS = [['把'], ['大模型'], ['能力'], ['，'], null, ['落进'], ['真实', 1], ['业务', 1], ['里'], ['。']]
const SIZES = [16, 22, 28, 34]
const STATS = {
  before: { rate: '≈ 20%', rebuild: '74 次', good: false, hit: 0.2, rest: 'miss' },
  after: { rate: '50–60%', rebuild: '≈ 20 次', good: true, hit: 0.56, rest: 'new' },
}

const projects = [
  {
    date: '2026.08 – 至今', label: '全栈 · 三端', title: '水贝钻石', subtitle: '珠宝 3D 素材管理与展示平台',
    points: [['后端', 'Spring Boot 分层 REST API，用户 / 素材 / 收藏 / 轮播 / 两级标签数据模型。'], ['管理后台', '基于 Soybean Admin（Vue 3）二次开发，角色权限与统一错误处理。'], ['移动端', 'Flutter 按 Service / Repository / ViewModel 分层。'], ['3D', 'OBJ / STL 存 RustFS，Three.js 按包围盒居中、沿最薄轴设初始视角。']],
    stack: 'Spring Boot · JPA · Vue 3 · Pinia · Flutter · Three.js · RustFS',
  },
  {
    date: '2026.02 – 2026.10', label: '已上线', title: 'getnurbs.com', subtitle: 'image-to-CAD 在线平台 · 独立开发', link: true,
    points: [['后端', '图像解析、NURBS 曲面生成与 CAD 文件导出接口。'], ['前端', '上传、预览、参数配置与结果下载，优化大图渲染。'], ['开源', <>沉淀出 Agent Skill <a href="https://github.com/ABC-xiaoxuan/award-level-web-design" target="_blank" rel="noopener">award-level-web-design ↗</a>，支持 Claude Code / Codex / Cursor 等 30+ 工具。</>]],
    stack: 'Python · Flask · React · TypeScript', live: true,
  },
  {
    date: '2025.03 – 2025.08', label: '项目负责人', title: '安费诺信息化项目', subtitle: '产线设备数据采集',
    points: [['采集', 'Modbus RTU（RS-232）读取设备数据，解析入库 PostgreSQL。'], ['重构', '原采集链路频繁故障，重构后连续稳定运行一年无故障。']],
    stack: 'Python · 繁易 SCADA · Modbus RTU · PostgreSQL',
  },
  {
    date: '2025.03 – 2025.07', label: '软件开发', title: 'AI 数据标注与训练平台', subtitle: '桌面端 + 在线服务',
    points: [['桌面端', 'PyQt5 图像标注，框标注、标签管理与批量处理。'], ['服务端', '在线标注与多用户协作，Celery 异步支撑训练与推理。']],
    stack: 'PyQt5 · FastAPI · Celery · MySQL · YOLO · OpenCV',
  },
]

const skills = [
  ['AI 工程', ['Context Engineering', 'Prompt Engineering', 'RAG 知识库', 'MCP', '多模态', 'OpenAI SDK', 'LiteLLM', 'Claude Code', 'Codex']],
  ['后端', ['Python', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'Spring Cloud', 'MyBatis', 'RESTful', '微服务']],
  ['前端', ['React', 'Vue 3', 'TypeScript', 'JavaScript', 'Flutter', 'Three.js']],
  ['数据 / 工程', ['MySQL', 'PostgreSQL', 'Redis', 'MongoDB', 'RabbitMQ', 'Linux', 'Shell', 'Docker', 'Nginx', 'Git']],
]

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return undefined
    const update = () => setReduce(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])
  return reduce
}

function Reveal({ children, className = '', as: Element = 'div' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  useGSAP(() => {
    const node = ref.current
    if (!node) return
    if (reduce) {
      gsap.set(node, { clearProps: 'all' })
      return
    }
    gsap.fromTo(node, { autoAlpha: 0, y: 16 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 92%', once: true },
    })
  }, { scope: ref, dependencies: [reduce] })
  return <Element ref={ref} className={className}>{children}</Element>
}

function Hero() {
  const reduce = useReducedMotion()
  const scope = useRef(null)
  const [shown, setShown] = useState(0)
  const [elapsed, setElapsed] = useState('0 ms')
  const total = TOKENS.filter(Boolean).length

  useGSAP(() => {
    const nodes = [...scope.current.querySelectorAll('.t')].filter((node) => !node.classList.contains('br'))
    if (reduce) {
      nodes.forEach((node) => node.classList.add('on', 'settled'))
      gsap.set(nodes, { opacity: 1, y: 0 })
      setShown(total)
      setElapsed('—')
      return
    }
    const started = performance.now()
    const timeline = gsap.timeline()
    nodes.forEach((node, index) => {
      timeline.to(node, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power3.out',
        onStart: () => {
          node.classList.add('on')
          setShown(index + 1)
          setElapsed(`${Math.round(performance.now() - started)} ms`)
        },
        onComplete: () => {
          if (index === nodes.length - 1) nodes.forEach((item) => item.classList.add('settled'))
        },
      }, 0.35 + index * 0.12)
    })
  }, { scope, dependencies: [reduce, total] })

  let tokenIndex = 0
  return <section ref={scope} className="hero wrap">
    <p className="status"><span className="pulse" aria-hidden="true" />开放机会 · 深圳 / 可异地</p>
    <h1 className="headline" aria-label="把大模型能力，落进真实业务里。">
      <span className="toks" aria-hidden="true">
        {TOKENS.map((token, index) => {
          if (!token) return <span className="t br" key={index} />
          tokenIndex += 1
          const content = <span className={`t${token[1] ? ' hit' : ''}`} key={index}>{token[0]}</span>
          return index >= TOKENS.length - 2 ? <span className="nw" key={`nw-${index}`}>{content}{index === TOKENS.length - 1 && <span className="caret" />}</span> : content
        })}
      </span>
    </h1>
    <div className="hero-meta">
      <CadScene />
      <div className="meter" aria-hidden="true">
        <span className="meter-row"><span className="meter-k">tokens</span><span className="meter-v">{shown}</span></span>
        <span className="meter-row"><span className="meter-k">elapsed</span><span className="meter-v hit">{elapsed}</span></span>
        <span className="meter-bar"><i style={{ transform: `scaleX(${shown / total})` }} /></span>
      </div>
      <div className="intro">
        <p className="who"><strong>戴玮轩</strong><span>AI 全栈工程师</span></p>
        <p className="lede">两年全栈经验。参与研发企业级 CAD AI Agent，负责模型缓存优化，把命中率从 20% 提到 50–60%。日常用 Claude Code / Codex 做项目级开发，一个人交付过 Web、App 和后台三端。</p>
        <div className="actions">
          <a className="btn btn-primary" href="mailto:17625708403@163.com">写邮件给我</a>
          <a className="btn" href="https://github.com/ABC-xiaoxuan" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>
          <a className="btn" href="https://www.getnurbs.com" target="_blank" rel="noopener">getnurbs.com <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </div>
  </section>
}

function CountUp({ to }) {
  const reduce = useReducedMotion()
  const ref = useRef(null)
  const [value, setValue] = useState(to)
  useGSAP(() => {
    if (reduce) {
      setValue(to)
      return
    }
    const state = { value: 0 }
    gsap.to(state, {
      value: to,
      duration: 1.1,
      ease: 'power3.out',
      snap: { value: 1 },
      scrollTrigger: { trigger: ref.current, start: 'top 78%', once: true },
      onUpdate: () => setValue(state.value),
    })
  }, { scope: ref, dependencies: [reduce, to] })
  return <span ref={ref}>{value}</span>
}

function Numbers() {
  return <section className="numbers wrap" aria-label="关键数字">
    <Reveal className="num"><p className="n"><span className="from">20%</span><span className="arr" aria-hidden="true">→</span>50–60%</p><p className="cap">CAD Agent 模型缓存命中率</p></Reveal>
    <Reveal className="num"><p className="n"><span className="from">74</span><span className="arr" aria-hidden="true">→</span><CountUp to={20} /></p><p className="cap">上下文重建次数</p></Reveal>
    <Reveal className="num"><p className="n"><CountUp to={12} /><small>个月</small></p><p className="cap">重构后采集链路零故障</p></Reveal>
    <Reveal className="num"><p className="n"><CountUp to={30} />+</p><p className="cap">开源 Skill 支持的 AI 工具</p></Reveal>
  </section>
}

function CacheDemo() {
  const reduce = useReducedMotion()
  const demoRef = useRef(null)
  const touched = useRef(false)
  const [mode, setMode] = useState('before')
  const stat = STATS[mode]
  const rows = useMemo(() => SIZES.flatMap((size, row) => {
    const hit = row === 0 ? 0 : Math.round(size * stat.hit)
    return Array.from({ length: size }, (_, index) => ({ row, index, type: index < hit ? 'hit' : row === 0 ? 'new' : stat.rest }))
  }), [stat])

  useGSAP(() => {
    const chips = demoRef.current?.querySelectorAll('.c')
    if (!chips) return
    if (reduce) {
      chips.forEach((chip) => chip.classList.add('on'))
      gsap.set(chips, { opacity: 1, scale: 1 })
      return
    }
    gsap.fromTo(chips, { opacity: 0, scale: 0.4 }, {
      opacity: 1,
      scale: 1,
      duration: 0.35,
      ease: 'power3.out',
      stagger: 0.009,
      onStart: () => chips.forEach((chip) => chip.classList.add('on')),
    })
    if (mode === 'before' && !touched.current) {
      gsap.delayedCall(2.6, () => { if (!touched.current) setMode('after') })
    }
  }, { scope: demoRef, dependencies: [mode, reduce, rows.length] })

  return <div className="demo" id="demo" ref={demoRef}>
    <div className="demo-head">
      <span className="demo-title">每轮发给模型的上下文</span>
      <div className="seg-ctl" role="radiogroup" aria-label="切换优化前后">
        {['before', 'after'].map((name) => <button type="button" role="radio" aria-checked={mode === name} data-mode={name} key={name} onClick={() => { touched.current = true; setMode(name) }}>{name === 'before' ? '优化前' : '优化后'}</button>)}
      </div>
    </div>
    <div className="demo-body" aria-live="polite">
      {SIZES.map((size, row) => <div className="turn" key={row}><span className="turn-k">T{row + 1}</span><span className="chips">{rows.filter((chip) => chip.row === row).map((chip, index) => <i className={`c ${chip.type}`} style={{ width: `${8 + (row * 13 + index * 7) % 15}px` }} key={index} />)}</span></div>)}
    </div>
    <div className="demo-foot">
      <div className="demo-stat"><span className="k">缓存命中率</span><span className={`v${stat.good ? ' good' : ''}`}>{stat.rate}</span></div>
      <div className="demo-stat"><span className="k">上下文重建</span><span className={`v${stat.good ? ' good' : ''}`}>{stat.rebuild}</span></div>
      <div className="legend"><span><i className="lg lg-hit" />命中缓存</span><span><i className="lg lg-new" />本轮新增</span><span><i className="lg lg-miss" />重新计算</span></div>
    </div>
  </div>
}

function Points({ points }) {
  return <ul className="pts">{points.map(([label, text], index) => <li key={index}><b>{label}</b>{text}</li>)}</ul>
}

function ProjectCard({ project }) {
  return <>
    <p className="tag-row"><span className="tag">{project.date}</span><span className={`tag${project.live ? ' tag-live' : ''}`}>{project.label}</span></p>
    <h3>{project.link ? <a href="https://www.getnurbs.com" target="_blank" rel="noopener">{project.title} <span aria-hidden="true">↗</span></a> : project.title}<span>{project.subtitle}</span></h3>
    <Points points={project.points} />
    <p className="stack">{project.stack}</p>
  </>
}

function Work() {
  return <section id="work" className="section wrap">
    <Reveal as="header" className="sec-head"><h2>项目</h2><p className="sec-note">按时间倒序。每一项都写清了哪部分是我做的。</p></Reveal>
    <Reveal as="article" className="feature"><div className="feature-text">
      <p className="tag-row"><span className="tag tag-accent">重点</span><span className="tag">2026.07 – 至今</span><span className="tag">团队协作</span></p>
      <h3>Epeius<span>企业级 CAD AI Agent</span></h3>
      <p className="sum">团队自研的 CAD 专用 Agent，编排框架覆盖 Agent Runtime、Tool Calling、Context 与 Memory。我负责其中的<mark>模型缓存率提升模块</mark>。</p>
      <Points points={[["稳定请求前缀", '上下文分段复用，身份不变时复用消息前缀，只追加增量。'], ['状态快照增量', '状态 diff（顶层补丁 + 路径更新），切换候选版本时明确替代旧证据。'], ['图片与历史压缩', '同源图片严格去重，压缩旧评估证据，按完整工具组裁剪历史。'], ['缓存可观测性', '对 wire 请求做指纹，区分本地前缀变化与上游行为。']]} />
      <p className="stack">Python · asyncio · HTTPX · OpenAI SDK · LiteLLM · PyVista / VTK · trimesh</p>
    </div><CacheDemo /></Reveal>
    <div className="cards">{projects.map((project) => <Reveal as="article" className="card" key={project.title}><ProjectCard project={project} /></Reveal>)}</div>
  </section>
}

function Experience() {
  const jobs = [
    ['2026.02 – 至今', '深圳市昊羽兴信息科技有限公司', '全栈开发工程师', '与技术主管协作研发企业级 CAD AI Agent（Epeius），负责模型缓存率提升。深度使用 Claude Code / Codex 完成前后端链路开发，独立负责多个 Web / App 项目上线。'],
    ['2024.10 – 2026.01', '江苏久众新视智能科技有限公司', '信息化工程师', 'Python 编写采集脚本，通过 OPC UA / MQTT / Modbus 对接产线设备。设计数据缓冲与重传机制，对接 InfluxDB / PostgreSQL 与 MES / ERP，构建设备监控与生产分析平台。'],
    ['2024.06 – 2024.09', '江苏慕沁智能科技有限公司', '实施运维工程师', '独立交付金融及 IoT 项目实施，负责 Linux 环境部署、服务器配置与运维（Docker / Nginx / Nacos）。'],
    ['2020.09 – 2024.07', '滁州学院', '软件工程 · 本科 · GPA 3.36 / 4.0', ''],
  ]
  return <section id="experience" className="section wrap"><Reveal as="header" className="sec-head"><h2>经历</h2><p className="sec-note">先在产线上学会让数据稳定流动，再到大模型里学会让上下文被复用。</p></Reveal><ol className="timeline">{jobs.map(([when, company, role, desc]) => <Reveal as="li" key={company}><p className="t-when">{when}</p><div><h3>{company}</h3><p className="t-role">{role}</p>{desc && <p className="t-desc">{desc}</p>}</div></Reveal>)}</ol></section>
}

function Skills() {
  return <section id="skills" className="section wrap"><Reveal as="header" className="sec-head"><h2>技能</h2><p className="sec-note">只列能在面试里讲清楚的。</p></Reveal><div className="skills">{skills.map(([name, items], index) => <Reveal className={`sk${index === 0 ? ' sk-ai' : ''}`} key={name}><h3>{name}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></Reveal>)}</div></section>
}

function Contact() {
  return <section id="contact" className="contact wrap"><Reveal className="contact-card"><p className="status"><span className="pulse" aria-hidden="true" />正在找 AI 全栈 / 全栈开发岗位</p><h2>聊聊怎么把模型<br />用进你的业务。</h2><a className="contact-mail" href="mailto:17625708403@163.com">17625708403@163.com <span aria-hidden="true">→</span></a><ul className="contact-list"><li><span>GitHub</span><a href="https://github.com/ABC-xiaoxuan" target="_blank" rel="noopener">ABC-xiaoxuan ↗</a></li><li><span>作品</span><a href="https://www.getnurbs.com" target="_blank" rel="noopener">getnurbs.com ↗</a></li><li><span>所在</span><span>深圳 · 可接受异地</span></li></ul></Reveal></section>
}

export default function App() {
  const [scrolled, setScrolled] = useState(false)
  const [pageTokens, setPageTokens] = useState('—')
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    const main = document.querySelector('main')
    if (main) {
      const text = main.textContent
      const cjk = (text.match(/[㐀-鿿]/g) || []).length
      const lat = (text.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length
      setPageTokens(`≈ ${(cjk + Math.round(lat * 1.3)).toLocaleString('en-US')}`)
    }
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return <>
    <AmbientBackground />
    <header className={`topbar${scrolled ? ' scrolled' : ''}`}><div className="topbar-in wrap"><a className="mark" href="#top" aria-label="回到顶部"><span className="mark-tok">戴</span><span className="mark-tok">玮轩</span></a><nav aria-label="主导航"><a href="#work">项目</a><a href="#experience">经历</a><a href="#skills">技能</a><a className="nav-cta" href="#contact">联系我</a></nav></div></header>
    <main id="top"><Hero /><Numbers /><Work /><Experience /><Skills /><Contact /></main>
    <footer className="foot wrap"><span>© 2026 戴玮轩</span><span className="foot-tok">本页 <b>{pageTokens}</b> tokens</span></footer>
  </>
}
