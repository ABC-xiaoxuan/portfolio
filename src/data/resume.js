/**
 * Single source of truth for everything rendered on the page.
 * The page is the resume, expanded — copy lives here, not in components.
 */

export const profile = {
  name: '戴玮轩',
  latin: 'DAI WEIXUAN',
  role: 'AI 全栈工程师',
  tagline: '让大模型真正跑进业务里',
  location: '深圳',
  phone: '17625708403',
  email: '17625708403@163.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/ABC-xiaoxuan', meta: 'ABC-xiaoxuan' },
    { label: 'getnurbs.com', href: 'https://www.getnurbs.com', meta: '已上线产品' },
    {
      label: 'award-level-web-design',
      href: 'https://github.com/ABC-xiaoxuan/award-level-web-design',
      meta: '开源 Agent Skill',
    },
  ],
}

/** First screen transcript — the hero reads as one context window. */
export const heroTranscript = [
  { role: 'system', text: '你是戴玮轩，AI 全栈工程师，在深圳。' },
  { role: 'system', text: '经历过工业 IoT 数据采集、企业级 CAD AI Agent、珠宝 3D 平台。' },
  { role: 'user', text: '你在 Epeius 里做了什么？' },
  {
    role: 'assistant',
    text: '负责模型缓存率提升：命中率 20% → 58%，上下文重建 74 次 → 20 次。',
  },
]

export const skills = [
  {
    group: 'AI 工程',
    items: ['Context / Prompt Engineering', 'RAG 知识库', 'MCP', '多模态', 'LLM 接入（OpenAI SDK / LiteLLM）'],
  },
  {
    group: '后端',
    items: ['Python（Flask / FastAPI）', 'Java（Spring Boot / Spring Cloud / MyBatis）', 'RESTful', '微服务'],
  },
  { group: '前端', items: ['React', 'Vue 3', 'TypeScript / JavaScript', 'Flutter'] },
  {
    group: '数据 / 工程',
    items: ['MySQL', 'PostgreSQL', 'Redis', 'MongoDB', 'RabbitMQ', 'Linux', 'Shell', 'Docker', 'Nginx', 'Git'],
  },
]

export const jobs = [
  {
    company: '深圳市昊羽兴信息科技有限公司',
    role: '全栈开发工程师',
    period: '2026.02 – 至今',
    points: [
      '与技术主管协作研发企业级 CAD AI Agent（Epeius），负责其中模型缓存率提升模块。',
      '设计上下文分段复用与快照增量机制，将缓存命中率从 20% 提升至 50%–60%，大幅降低 token 消耗。',
      '建设请求指纹与缓存可观测方案，量化上下文重建原因，为优化提供数据支撑。',
      '深度使用 Claude Code / Codex 完成前后端链路开发，独立负责多个 Web / App 项目上线。',
    ],
  },
  {
    company: '江苏久众新视智能科技有限公司',
    role: '信息化工程师',
    period: '2024.10 – 2026.01',
    points: [
      'Python 编写采集脚本，通过 OPC UA / MQTT / Modbus 对接产线设备，实现实时数据抓取。',
      '设计数据缓冲与重传机制，保障采集稳定性与数据完整性。',
      '对接 InfluxDB / PostgreSQL 与 MES / ERP 系统，构建设备监控与生产分析平台。',
    ],
  },
  {
    company: '江苏慕沁智能科技有限公司',
    role: '实施运维工程师',
    period: '2024.06 – 2024.09',
    points: [
      '独立交付金融及 IoT 项目实施，负责 Linux 环境部署、服务器配置与运维（Docker / Nginx / Nacos）。',
    ],
  },
]

export const projects = [
  {
    id: 'shuibei',
    name: '水贝钻石 · 珠宝 3D 素材管理与展示平台',
    kind: '全栈开发',
    period: '2026.08 – 至今',
    stack: ['Java', 'Spring Boot', 'JPA / Flyway', 'Vue 3 / TS / Pinia', 'Flutter / Dart', 'Three.js', 'RustFS'],
    summary:
      '打通 Vue 管理后台、Spring Boot API 与 Flutter App 的珠宝设计素材平台，支持素材上传发布、3D 预览、收藏与反馈。',
    points: [
      '后端：Spring Boot 构建分层 REST API，设计用户 / 素材 / 收藏 / 轮播 / 两级标签数据模型，以发布状态与关联约束保障目录一致性。',
      '管理后台：二次开发 Soybean Admin（Vue 3）实现素材 / 标签 / 轮播 / 用户 / 审计页面，接入管理员登录、角色权限与统一错误处理。',
      '移动端：Flutter 按 Service / Repository / ViewModel 分层，接通账号 / 目录 / 收藏 / 反馈接口，统一加载与错误状态。',
      '3D 与存储：RustFS 存储图片与 OBJ / STL 模型；Three.js / three_js 实现模型旋转缩放，按包围盒居中、沿最薄轴设初始视角。',
      '交付质量：三端联调完成，后端 11 项测试、Flutter 6 项测试、Dart 静态分析、类型检查与生产构建全部通过。',
    ],
  },
  {
    id: 'epeius',
    name: 'Epeius 企业级 CAD AI Agent',
    kind: '开发工程师',
    period: '2026.07 – 至今',
    stack: ['Python', 'asyncio / HTTPX', 'OpenAI SDK / LiteLLM', 'Claude Code / Codex', 'PyVista / VTK'],
    summary:
      '团队协作研发的 CAD 专用 AI Agent，自研编排框架覆盖 Agent Runtime / Tool Calling / Context / Memory。本人负责模型缓存率提升模块。',
    demo: 'cache',
    points: [
      '稳定请求前缀：设计上下文分段复用机制，身份不变时复用消息前缀，仅追加增量。',
      '状态快照增量：实现状态 diff（顶层补丁 + 路径更新），候选版本切换时明确替代旧证据。',
      '图片与历史压缩：严格去重同源图片、压缩旧评估证据，按完整工具组裁剪历史并保留预算余量。',
      '缓存可观测性：对 wire 请求（messages / tools / settings）做指纹，区分本地前缀变化与上游行为。',
      '优化效果：缓存命中率 20% → 50–60%，上下文重建次数 74 次 → 20 次左右。',
    ],
  },
  {
    id: 'getnurbs',
    name: 'image-to-CAD 在线平台',
    kind: '全栈开发',
    period: '2026.02 – 2026.10',
    stack: ['Python / Flask', 'React', 'TypeScript', 'RESTful API', 'NURBS / CAD'],
    href: 'https://www.getnurbs.com',
    summary: '从图片生成可编辑 CAD 模型的在线平台，已正式上线运行。',
    points: [
      '后端实现图像解析、NURBS 曲面生成与 CAD 文件导出等核心接口。',
      '前端实现上传、预览、参数配置与结果下载，优化大图渲染体验。',
      '开发过程中沉淀并开源 Agent Skill「award-level-web-design」，支持 Claude Code / Codex / Cursor 等 30+ 工具。',
    ],
  },
  {
    id: 'amphenol',
    name: '安费诺信息化项目',
    kind: '开发工程师 / 项目负责人',
    period: '2025.03 – 2025.08',
    stack: ['Python', '繁易 SCADA / FPAD', 'Modbus RTU（RS-232）', 'PostgreSQL'],
    summary: '工厂设备数据采集与现场可视化，替换原频繁故障的采集方式。',
    points: [
      '独立承担全部开发，覆盖方案设计、采集、存储、展示与稳定性优化。',
      '通过 Modbus RTU（RS-232）读取设备数据并解析入库。',
      '重构原频繁故障的采集链路，系统连续稳定运行一年无故障。',
    ],
  },
  {
    id: 'yolo',
    name: 'AI 数据标注与模型训练平台',
    kind: '软件开发者',
    period: '2025.03 – 2025.07',
    stack: ['Python', 'PyQt5', 'FastAPI', 'Celery', 'MySQL', 'YOLO', 'OpenCV'],
    summary: '面向模型训练的标注与训练工具链，桌面端与 Web 端共用一套数据格式。',
    points: [
      '开发图像标注桌面端，支持框标注、标签管理与批量处理。',
      '实现在线标注服务与多用户协作，Celery 异步支撑模型训练与推理。',
    ],
  },
]

export const education = {
  school: '滁州学院',
  major: '软件工程 · 本科',
  period: '2020.09 – 2024.07',
  gpa: 'GPA 3.36 / 4.0',
}

/** Numbers behind the signature cache visualisation. Measured, not estimated. */
export const cacheMetrics = {
  hitBefore: 20,
  hitAfter: 58,
  rebuildBefore: 74,
  rebuildAfter: 20,
}

/** Rows of the cache demo — the first N are the reusable prefix. */
export const cacheRows = [
  { label: 'system · 项目规范 / 工具说明', kind: 'prefix' },
  { label: 'system · CAD 场景与安全约束', kind: 'prefix' },
  { label: 'tools · 阶段工具 schema 指纹', kind: 'prefix' },
  { label: 'state · 当前候选版本快照', kind: 'prefix' },
  { label: 'round 12 · 工具调用与返回', kind: 'prefix' },
  { label: 'round 13 · 渲染证据与评审', kind: 'prefix' },
  { label: 'state · 增量状态补丁（diff）', kind: 'new' },
  { label: 'image · 新候选渲染图（去重后）', kind: 'new' },
  { label: 'round 14 · 待执行工具调用', kind: 'new' },
]
