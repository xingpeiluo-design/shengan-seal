import { useSettings } from '../lib/settings'

const cases = [
  {
    type: '门窗厂配套',
    icon: '🏗️',
    title: '某大型断桥铝门窗厂 · 年度配套合作',
    location: '浙江 · 温州',
    volume: '月用量 50万米+',
    desc: '为某断桥铝门窗厂提供卡槽式包覆密封条长期配套服务，实现门窗厂自有品牌包装贴牌，一年内采购量增长300%，密封投诉率下降至0。',
    tags: ['卡槽式', 'OEM贴牌', '长期合同'],
    color: '#e8f5ec',
  },
  {
    type: '家装改造',
    icon: '🏠',
    title: '全屋门窗密封改造 · 家装项目案例',
    location: '上海 · 徐汇区',
    volume: '改造门窗 48套',
    desc: '某精装小区业主全屋门窗密封翻新，使用自贴式系列，安装简便，隔音效果提升显著，施工周期缩短60%，业主满意度100%。',
    tags: ['自贴式', '旧改项目', '隔音降噪'],
    color: '#f0f4ff',
  },
  {
    type: '阳光房工程',
    icon: '🌤️',
    title: '连栋阳光房工程 · 密封整体配套',
    location: '广东 · 佛山',
    volume: '工程总量 20万米',
    desc: '某连锁别墅区阳光房工程项目，采用阳光房专用密封条配套方案，耐候性强，通过项目验收，获得施工单位长期合作邀约。',
    tags: ['阳光房专用', '工程配套', '耐候抗UV'],
    color: '#fff8e8',
  },
  {
    type: '地产精装',
    icon: '🏢',
    title: '地产精装楼盘 · 批量定制供货',
    location: '江苏 · 南京',
    volume: '精装房 800套',
    desc: '某知名地产项目精装修批量采购，对应甲方绿色建筑认证要求，提供含税报价、对公签约，顺利通过验收并纳入甲方优选供应商名录。',
    tags: ['精装配套', '绿色认证', '含税对公'],
    color: '#f5f0ff',
  },
]

export default function EngineeringCases() {
  const settings = useSettings()
  return (
    <section id="cases" className="py-16 bg-[#F8F8F5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-[#0F6637] rounded-full"/>
            <h2 className="text-2xl md:text-3xl font-bold text-[#333]">工程合作案例</h2>
          </div>
          <button className="text-sm text-[#0F6637] border border-[#0F6637] px-4 py-2 rounded hover:bg-[#e8f5ec] transition-colors">
            查看更多案例 →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cases.map(c => (
            <div key={c.title} className="product-card bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              {/* 顶部图示区 */}
              <div
                className="h-36 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: c.color }}
              >
                <span className="text-6xl opacity-30">{c.icon}</span>
                {/* 装饰线条 */}
                <div className="absolute inset-0">
                  <svg className="w-full h-full opacity-20" viewBox="0 0 400 144" preserveAspectRatio="xMidYMid slice">
                    {[...Array(5)].map((_, i) => (
                      <line key={i} x1="0" y1={20 + i * 26} x2="400" y2={20 + i * 26} stroke="#0F6637" strokeWidth="1" strokeDasharray="8 6"/>
                    ))}
                  </svg>
                </div>
                {/* 案例类型标签 */}
                <div className="absolute top-3 left-3 bg-[#0F6637] text-white text-xs px-2 py-1 rounded-full font-semibold">
                  {c.type}
                </div>
                {/* 数量标注 */}
                <div className="absolute top-3 right-3 bg-white/80 text-[#0F6637] text-xs px-2 py-1 rounded-full font-bold">
                  {c.volume}
                </div>
              </div>

              {/* 内容区 */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-[#333] text-sm leading-snug">{c.title}</h3>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                  <span>📍</span>
                  <span>{c.location}</span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{c.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map(tag => (
                    <span key={tag} className="bg-[#e8f5ec] text-[#0F6637] text-xs px-2 py-0.5 rounded font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部引导 */}
        <div className="mt-8 bg-[#0F6637] rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">您的项目需要密封条配套方案？</h3>
          <p className="text-green-200 mb-4 text-sm">专属工程顾问，免费出具配套方案，含税报价，快速回复</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#contact"
              className="bg-white text-[#0F6637] px-6 py-2.5 rounded font-bold text-sm hover:bg-green-50 transition-colors"
            >
              立即咨询工程合作
            </a>
            <a
              href={settings.pdd_link || 'https://mobile.yangkeduo.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#e4323c] text-white px-6 py-2.5 rounded font-bold text-sm hover:bg-[#c8282f] transition-colors"
            >
              🛒 拼多多小批量采购
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
