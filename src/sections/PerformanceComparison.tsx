const compareData = [
  { dimension: '使用寿命', shengan: '10年+（PU材质）', normal: '3-5年（PVC易老化）', better: true },
  { dimension: '隔热性能', shengan: 'K值 ≤1.2（高效隔热）', normal: 'K值 ≥2.8（差）', better: true },
  { dimension: '隔音效果', shengan: '降噪 20-35dB', normal: '降噪 5-10dB', better: true },
  { dimension: '抗老化能力', shengan: '耐UV·耐臭氧·不龟裂', normal: '2年内开始龟裂', better: true },
  { dimension: '环保等级', shengan: 'SGS认证·无毒无味', normal: '含塑化剂·有异味', better: true },
  { dimension: '长期采购成本', shengan: '更换频率低，综合更划算', normal: '频繁更换，隐性成本高', better: true },
]

const certs = [
  { title: '耐老化检测报告', icon: '🔬', agency: '第三方权威检测机构', result: '抗老化等级 A+' },
  { title: '压缩力学性能', icon: '⚖️', agency: 'ISO 国际标准测试', result: '回弹率 ≥98%' },
  { title: '热传导系数', icon: '🌡️', agency: '国家建材检测中心', result: 'K值 ≤1.2' },
  { title: '防水密封测试', icon: '💧', agency: '防水性能专项测试', result: 'IPX5级防水' },
  { title: '环保检测报告', icon: '🌱', agency: 'SGS 环保认证', result: '有害物质未检出' },
  { title: 'VOC挥发检测', icon: '🛡️', agency: '室内空气质量检测', result: '符合国标限量' },
]

export default function PerformanceComparison() {
  return (
    <section id="performance" className="py-16 bg-[#F8F8F5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-1 h-8 bg-[#0F6637] rounded-full"/>
          <h2 className="text-2xl md:text-3xl font-bold text-[#333]">性能检测对比</h2>
          <span className="ml-3 text-sm text-gray-500">第三方权威检测，真实数据对比，打消采购顾虑</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 左侧：检测报告展示 */}
          <div>
            <h3 className="font-bold text-[#333] mb-4">权威检测认证</h3>
            <div className="grid grid-cols-2 gap-3">
              {certs.map(cert => (
                <div key={cert.title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  {/* 模拟检测报告卡片 */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#e8f5ec] rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                      {cert.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#333] truncate">{cert.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{cert.agency}</div>
                      <div className="mt-1.5 bg-[#0F6637] text-white text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold">
                        {cert.result}
                      </div>
                    </div>
                  </div>
                  {/* 模拟报告页面装饰 */}
                  <div className="mt-3 bg-gray-50 rounded p-2 border border-gray-100">
                    <div className="space-y-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-1.5 bg-gray-200 rounded" style={{ width: `${70 + i * 10}%` }}/>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-[#0F6637] opacity-50"/>
                      <div className="text-[9px] text-gray-400">检测合格 · 盖章认证</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧：对比表格 */}
          <div>
            <h3 className="font-bold text-[#333] mb-4">盛安 VS 普通密封条 — 六维度对比</h3>
            <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
              <table className="w-full text-sm compare-table">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold">对比维度</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold bg-[#0F6637] text-white">
                      ✅ 盛安包覆密封条
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-semibold bg-gray-600 text-white">
                      ❌ 普通密封条
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {compareData.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f5faf7]'}>
                      <td className="px-4 py-3 font-semibold text-[#333] text-xs md:text-sm border-r border-gray-100">
                        {row.dimension}
                      </td>
                      <td className="px-4 py-3 text-center text-xs md:text-sm text-[#0a3d1f] font-medium border-r border-gray-100">
                        <span className="inline-flex items-center gap-1">
                          <span className="text-[#0F6637]">▲</span>
                          {row.shengan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs md:text-sm text-gray-500">
                        {row.normal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 底部信任背书 */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { num: '10年+', label: '平均使用寿命' },
                { num: '98%+', label: '回弹率保持' },
                { num: '0', label: '有害物质检出' },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-xl p-4 text-center border border-[#e8f5ec]">
                  <div className="text-2xl font-black text-[#0F6637]">{item.num}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-[#e8f5ec] rounded-xl p-4 border border-[#7ecfa0]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎁</span>
                <span className="font-bold text-[#0a3d1f] text-sm">免费寄样，亲测为准</span>
              </div>
              <p className="text-xs text-gray-600">
                不信对比文字？直接申请免费寄样，拿到实物对比，用效果说话。
                工程采购商、门窗厂批发商均可申请，新客专属政策。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
