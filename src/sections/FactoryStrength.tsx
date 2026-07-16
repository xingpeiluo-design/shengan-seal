const factoryData = [
  { num: '10万米/天', label: '日产能', icon: '🏭' },
  { num: '10万m²', label: '生产基地', icon: '📐' },
  { num: '200+', label: '合作工厂/门店', icon: '🤝' },
  { num: '15年+', label: '专业制造经验', icon: '🏅' },
]

const factoryImages = [
  { title: '现代化生产流水线', desc: '全自动挤出设备，精密控制产品截面', color: '#1a3a28', pattern: 'line' },
  { title: '原料仓储中心', desc: '进口PU原料，严格质量管控', color: '#0d2e1d', pattern: 'warehouse' },
  { title: '成品打包发货区', desc: '日均10万米发货，配套物流体系', color: '#162b1f', pattern: 'shipping' },
  { title: '研发检测实验室', desc: '自建检测室，全程质量追溯', color: '#1a2e22', pattern: 'lab' },
  { title: '厂区全景', desc: '10万平生产基地，规模化制造', color: '#122518', pattern: 'overview' },
  { title: '样品展示间', desc: '全系列现货展示，支持现场采样', color: '#0f2014', pattern: 'showroom' },
]

const services = [
  { icon: '📦', title: '拼多多一件代发', desc: '无起订量，现货充足，48小时发货，全国包邮' },
  { icon: '🔨', title: '来样开模定制', desc: '提供图纸/样品，7-15天开模，专属定制规格' },
  { icon: '🏷️', title: 'OEM贴牌加工', desc: '支持品牌定制，包装印刷，独家供货' },
  { icon: '🚛', title: '工程大批量配套', desc: '门窗厂·阳光房·地产精装，专属报价体系' },
  { icon: '📄', title: '含税对公开票', desc: '专票·普票均可，支持对公汇款，合规采购' },
  { icon: '🤝', title: '长期经销合作', desc: '区域经销授权，阶梯返利，专属客服支持' },
]

export default function FactoryStrength() {
  return (
    <section id="factory" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-0.5 bg-[#0F6637]"/>
            <span className="text-[#0F6637] text-sm font-semibold tracking-widest uppercase">Factory Strength</span>
            <div className="w-8 h-0.5 bg-[#0F6637]"/>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#333]">工厂实力</h2>
          <p className="text-gray-500 mt-2">源头工厂直供，无中间商，品质稳定，价格透明</p>
        </div>

        {/* 核心数据 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {factoryData.map(item => (
            <div key={item.label} className="bg-gradient-to-br from-[#0F6637] to-[#1a7a42] rounded-xl p-5 text-center text-white">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="text-2xl md:text-3xl font-black">{item.num}</div>
              <div className="text-green-200 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        {/* 工厂实景图集 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {factoryImages.map(img => (
            <div key={img.title} className="relative rounded-xl overflow-hidden aspect-video group cursor-pointer">
              {/* 工业风格SVG背景 */}
              <div className="w-full h-full" style={{ backgroundColor: img.color }}>
                <svg className="w-full h-full opacity-40" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
                  {img.pattern === 'line' && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <rect key={i} x={i * 40} y="20" width="30" height="140" fill="white" opacity="0.1"/>
                      ))}
                      {[...Array(5)].map((_, i) => (
                        <rect key={i} x="0" y={30 + i * 30} width="320" height="8" fill="white" opacity="0.08"/>
                      ))}
                      <circle cx="160" cy="90" r="40" fill="none" stroke="white" strokeWidth="3" opacity="0.2"/>
                    </>
                  )}
                  {img.pattern === 'warehouse' && (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <g key={i}>
                          <rect x={20 + i * 75} y="40" width="60" height="100" fill="white" opacity="0.08"/>
                          <rect x={20 + i * 75} y="50" width="60" height="20" fill="white" opacity="0.1"/>
                          <rect x={20 + i * 75} y="80" width="60" height="20" fill="white" opacity="0.1"/>
                          <rect x={20 + i * 75} y="110" width="60" height="20" fill="white" opacity="0.1"/>
                        </g>
                      ))}
                    </>
                  )}
                  {img.pattern === 'shipping' && (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <rect key={i} x={10 + i * 52} y={30 + (i % 2) * 30} width="45" height="60" fill="white" opacity="0.1"/>
                      ))}
                      <rect x="0" y="140" width="320" height="3" fill="white" opacity="0.3"/>
                    </>
                  )}
                  {img.pattern === 'lab' && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <circle key={i} cx={20 + i * 40} cy={60 + (i % 3) * 30} r="15" fill="none" stroke="white" strokeWidth="2" opacity="0.2"/>
                      ))}
                      <path d="M40 80 L60 120 L80 80 M100 60 L120 130 L140 60" stroke="white" strokeWidth="2" fill="none" opacity="0.2"/>
                    </>
                  )}
                  {img.pattern === 'overview' && (
                    <>
                      <rect x="0" y="120" width="320" height="60" fill="white" opacity="0.05"/>
                      {[...Array(5)].map((_, i) => (
                        <rect key={i} x={10 + i * 60} y={40 + (i % 2) * 20} width="50" height="80" fill="white" opacity="0.08"/>
                      ))}
                    </>
                  )}
                  {img.pattern === 'showroom' && (
                    <>
                      {[...Array(4)].map((_, i) => (
                        <rect key={i} x={20 + i * 75} y="30" width="55" height="120" rx="4" fill="white" opacity="0.08"/>
                      ))}
                    </>
                  )}
                </svg>
              </div>
              {/* 文字遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"/>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-white font-semibold text-sm">{img.title}</div>
                <div className="text-green-300 text-xs mt-0.5">{img.desc}</div>
              </div>
              {/* hover放大效果 */}
              <div className="absolute inset-0 bg-[#0F6637]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-3xl">🔍</span>
              </div>
            </div>
          ))}
        </div>

        {/* 配套服务 */}
        <div>
          <h3 className="text-lg font-bold text-[#333] mb-5 flex items-center gap-2">
            <span className="w-1 h-6 bg-[#0F6637] rounded-full inline-block"/>
            配套服务体系
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services.map(svc => (
              <div key={svc.title} className="tech-card bg-[#F8F8F5] rounded-xl p-5 border border-gray-100">
                <div className="text-2xl mb-2">{svc.icon}</div>
                <h4 className="font-bold text-[#333] text-sm mb-1">{svc.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
