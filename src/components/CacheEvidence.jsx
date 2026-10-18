const runs = [
  ['优化前 · 10:22', '320k / 16', '4', '55.51%', '$1.20'],
  ['中间版本 · 17:33', '320k / 16', '5', '72.4%', '$1.80'],
  ['最新 · 20:25', '480k / 24', '2', '73.0%', '$1.42'],
]

const measurements = [
  ['缓存前缀回退', '40,000–50,000 → 7,040 token', '回退后仅剩 system prompt 与工具定义；context_budget 触发，tool_schema_changed 始终为 false。'],
  ['单次重建额外开销', '40,000–50,000 未缓存 token；约 $0.33–0.50', '每次重建的额外未缓存输入与费用，不是整轮费用。'],
  ['完整循环增长', '135k–155k 字符 / 循环', 'prepare + experiment；320k 上限扣除重建基线后只容纳约 1 个循环。'],
  ['重建填充比例', '0.5 → 0.35', 'context_rebuild_fill；降低重建后的填充，给追加留空间。'],
  ['experiment 结果', '约 30k → 7k 字符 / 份', '追加与重建两条路径使用字节一致的精简版。'],
  ['prepare_design 结果', '9.9k–20.7k → 0.6k–1.7k 字符 / 份', '只保留回执。'],
  ['validation receipt', '约 22k → 17k 字符 / 份', '去掉重复内容。'],
  ['快照引用复用', '约省 46k 字符 / session', '快照仅位置变化时，用引用替代整块重发。'],
  ['每轮合计精简', '约 15k–25k 字符 / 轮', '仅靠精简仍不足以实现每 2 轮评估才重建 1 次。'],
  ['加密 reasoning', '57k–68k 字符 / 轮', '保持不动；当前 prepare_intent / decision_basis、工具 schema 与 prompt 主体也完整保留。'],
  ['默认上下文上限', '320k 字符 / 16 张图 → 480k 字符 / 24 张图', 'UI 同步使用新默认值；最新样本未再出现图片触发的重建。'],
  ['平均单请求费用', '约 $0.30 / 请求', '同样配置下请求数仍在 12–24 次之间；工具调用次数影响总费用。'],
  ['重建后的基线', '约 170k → 230k 字符', '上限增大后单次重建更贵，不能只看重建次数。'],
  ['每轮评估新增', '约 110k 字符 / 轮', '首次发送必为未缓存内容，限制缓存率进一步提升。'],
]

export default function CacheEvidence({ onToggle }) {
  return <details className="cache-evidence" open onToggle={onToggle}>
    <summary>完整实验数据 <span>2026-10-16 · 数值、单位与对照条件</span></summary>
    <div className="evidence-content">
      <p className="evidence-intro">同一输入，每次运行 4 轮评估，每种配置仅 1 个运行样本。缓存率统计主 Agent，不与 Reviewer 混合；结果稳定性待复测。下表保留优化前、中间版本和最新版本，不仅展示有利指标。</p>
      <div className="evidence-scroll" role="region" aria-label="三次运行对照表，可横向滚动" tabIndex={0}>
        <table>
          <caption>三次运行 · 上限单位：字符 / 图片张数；费用单位：美元 / 轮评估</caption>
          <thead><tr><th scope="col">运行时间</th><th scope="col">上下文上限</th><th scope="col">重建次数</th><th scope="col">主 Agent 缓存率</th><th scope="col">单轮费用</th></tr></thead>
          <tbody>{runs.map((row) => <tr key={row[0]}>{row.map((value, index) => index === 0 ? <th scope="row" key={index}>{value}</th> : <td key={index} data-label={['运行时间', '上限 · 字符 / 图', '重建次数', '主 Agent 缓存率', '美元 / 轮'][index]}>{value}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <p className="evidence-intro"><strong>对照边界：</strong>优化前 → 最新：缓存率 55.51% → 73.0%，重建 4 → 2 次，但单轮费用 $1.20 → $1.42；同代码不同上限：缓存率 72.4% → 73.0%，重建 5 → 2 次，单轮费用 $1.80 → $1.42，约降 21%。21% 不是相对最初版本降本，也不能全部归因于缓存。</p>
      <h4>问题、改动与剩余开销</h4>
      <p className="evidence-intro">以下 k 均为千字符，只有明确写 token 的数值使用 token 单位；字符预算不是模型 token 窗口。</p>
      <dl className="evidence-measurements">{measurements.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd><strong>{value}</strong><p>{note}</p></dd></div>)}</dl>
      <h4>下一步候选 · 未实施，非实测成果</h4>
      <ul className="evidence-next">
        <li>用 480k 字符 / 24 张图再跑 1 次，确认 $1.42 / 轮是否稳定。</li>
        <li>尝试 context-rebuild-fill = 0.2，目标为 4 轮评估仅重建 1 次；尚未验证。</li>
        <li>construction skills 快照仅在内容变化时发送。</li>
        <li>仅在重建时丢弃旧轮加密 reasoning，单独 A/B 验证推理连续性。</li>
      </ul>
      <p className="evidence-source">来源：《Epeius 上下文缓存优化总结（2026-10-16）》；本页保留原文约数与单样本限制。</p>
    </div>
  </details>
}
