export default function ProductIntro() {
  const layers = [
    {
      num: '01',
      title: 'PE 外层保护膜',
      desc: '美观耐刮 · 耐老化 · 表面光滑 · 视觉质感高端',
      color: 'from-[#e8f5ec] to-[#c8e6d4]',
      border: '#7ecfa0',
      icon: '🛡️',
    },
    {
      num: '02',
      title: 'PU 热固性内芯（主体）',
      desc: '可塑性强 · 高回弹不塌陷 · 抗压抗疲劳 · 寿命远超普通 PVC',
      color: 'from-[#c8e6d4] to-[#9ecfb0]',
      border: '#4caf80',
      icon: '🧬',
    },
    {
      num: '03',
      title: 'PP 支撑骨架',
      desc: '内部刚性支撑 · 不易变形 · 长期保持截面稳定性',
      color: 'from-[#9ecfb0] to-[#7ecfa0]',
      border: '#2e8b57',
      icon: '🦴',
    },
    {
      num: '04',
      title: 'TPU 鱼刺倒钩 + 双面胶带',
      desc: 'TPU 鱼刺卡紧结构 + 德国进口双面胶带 · 紧固不脱落',
      color: 'from-[#7ecfa0] to-[#0F6637]',
      border: '#0F6637',
      icon: '🪝',
    },
  ]

  const advantages = [
    { icon: '🔇', title: '强效隔音', desc: '隔绝户外噪音', value: '20-35dB' },
    { icon: '🌡️', title: '隔热节能', desc: '超低传热 K 值', value: '节能30%+' },
    { icon: '💧', title: '防水防渗', desc: '雨天零渗漏保障', value: '100%' },
    { icon: '⏳', title: '耐老化', desc: '寿命远超普通 PVC', value: '3倍+' },
  ]

  const perfTags = ['耐老化', '耐疲劳', '压缩变形测试', '压缩力测试', '热传导K值测试', '水侵性', '水渗透性']
  const benefitTags = ['节能环保', '隔音降噪', '抗强紫外线', '无毒', '不与油漆/清洁剂反应', '绿色健康']

  return (
    <section id="intro" className="py-20 bg-gradient-to-b from-white to-[#F8F8F5]">
      <div className="max-w-7xl mx-auto px-6">
        {/* ========== 标题区 ========== */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-[2px] bg-[#0F6637]"/>
            <span className="text-sm text-[#0F6637] font-semibold tracking-widest uppercase">Brand Introduction</span>
            <div className="w-10 h-[2px] bg-[#0F6637]"/>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#333] mb-3">品牌产品介绍</h2>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            高端包覆式密封条 · 源头制造品质保障 · 四层复合一体结构性能全面超越传统门窗胶条
          </p>
        </div>

        {/* ========== 段落引言 ========== */}
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-[#0F6637] mb-5">
            包覆式密封条 — 四层复合一体结构
          </h3>
          <p className="text-gray-600 leading-loose mb-3">
            包覆式密封条由四种质地优良的材料复合而成，外层包裹 PE 膜为密封条提供质量保障与美观度，热固性芯以 PU 为主材具有超强可塑性。
          </p>
          <p className="text-gray-600 leading-loose">
            内部 PP 骨架 + 塑料与橡胶完美结合的 TPU 鱼刺倒钩设计 + 德国进口双面胶带分类应用，三者协同完善整个密封体系。
          </p>
        </div>

        {/* ========== 四大核心优势（大卡片网格） ========== */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[#333] flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0F6637] rounded-full"/>
              四大核心性能优势
            </h3>
            <span className="text-xs text-gray-400">权威检测 · 数据可查</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#0F6637] hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e8f5ec] to-transparent rounded-bl-[80px] rounded-tr-2xl opacity-60"/>
                <div className="relative">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <div className="text-base font-bold text-[#333] mb-1">{item.title}</div>
                  <div className="text-xs text-gray-500 mb-3">{item.desc}</div>
                  <div className="text-2xl font-black text-[#0F6637] leading-none">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========== 四层结构 + 大截面图（左右 5:7 分配） ========== */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10 mb-16 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-[#333] flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#0F6637] rounded-full"/>
              四层复合结构拆解
            </h3>
            <span className="text-xs text-gray-400">从外到内 · 由表及里</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* 左侧：四层编号列表（占 5/12） */}
            <div className="lg:col-span-5 space-y-3">
              {layers.map((layer) => (
                <div
                  key={layer.num}
                  className="relative flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-[#7ecfa0] transition-colors bg-gradient-to-r from-white to-[#fafffe]"
                >
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${layer.color} flex items-center justify-center text-xl shadow-sm`}
                  >
                    {layer.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-black text-white px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: layer.border }}
                      >
                        LAYER {layer.num}
                      </span>
                      <span className="text-sm font-bold text-[#333] truncate">{layer.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 右侧：大截面图（占 7/12） */}
            <div className="lg:col-span-7">
              <div className="bg-gradient-to-br from-[#0a3d1f] to-[#0F6637] rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-4 right-4 text-xs text-white/60 font-mono">CROSS-SECTION VIEW</div>
                <div className="text-white text-sm font-semibold mb-6 text-center">
                  包覆式密封条剖面结构图（示意）
                </div>
                <svg viewBox="0 0 380 240" className="w-full">
                  <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.3" opacity="0.15"/>
                    </pattern>
                  </defs>
                  <rect width="380" height="240" fill="url(#grid)"/>

                  {/* PE 外层 */}
                  <rect x="30" y="22" width="320" height="34" rx="17" fill="#e8f5ec" stroke="#7ecfa0" strokeWidth="2"/>
                  <text x="190" y="44" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0a3d1f">PE 外层保护膜</text>

                  {/* PU 内芯 */}
                  <rect x="30" y="60" width="320" height="52" rx="6" fill="#b3d9c4" stroke="#4caf80" strokeWidth="2"/>
                  <text x="190" y="91" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0a3d1f">PU 热固性内芯（高密度主体）</text>

                  {/* PP 骨架 */}
                  <rect x="55" y="116" width="270" height="24" rx="4" fill="#7ecfa0" stroke="#2e8b57" strokeWidth="1.5"/>
                  <text x="190" y="132" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0a3d1f">PP 支撑骨架</text>

                  {/* TPU 鱼刺 */}
                  {[...Array(10)].map((_, i) => (
                    <g key={i}>
                      <polygon
                        points={`${45 + i * 30},146 ${55 + i * 30},186 ${35 + i * 30},186`}
                        fill="#0F6637"
                        stroke="#7ecfa0"
                        strokeWidth="1"
                        opacity="0.9"
                      />
                    </g>
                  ))}
                  <text x="190" y="206" textAnchor="middle" fontSize="10" fill="white" opacity="0.85">TPU 鱼刺倒钩（卡紧不脱落）</text>

                  {/* 右侧标注线 */}
                  <line x1="355" y1="40" x2="375" y2="40" stroke="#7ecfa0" strokeWidth="1.5"/>
                  <line x1="355" y1="86" x2="375" y2="86" stroke="#4caf80" strokeWidth="1.5"/>
                  <line x1="355" y1="128" x2="375" y2="128" stroke="#2e8b57" strokeWidth="1.5"/>
                  <line x1="355" y1="170" x2="375" y2="170" stroke="#7ecfa0" strokeWidth="1.5"/>
                </svg>
                <div className="text-center text-xs text-green-200 mt-3">
                  黑白两款现货 · 支持来样定制颜色 · 德国进口双面胶带
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== 底部三栏：分类 / 性能检测 / 产品优势 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 产品分类 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] flex items-center justify-center text-base">📦</div>
              <h4 className="font-bold text-[#333] text-sm">产品分类</h4>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              包覆式密封条分为
              <strong className="text-[#0F6637] mx-1">自贴式</strong>
              和
              <strong className="text-[#0F6637] mx-1">卡槽式</strong>
              ，适用于不同门窗，安装便捷。
            </p>
            <div className="flex gap-1.5">
              <span className="text-[10px] bg-[#e8f5ec] text-[#0F6637] px-2 py-0.5 rounded-full font-medium">自贴式</span>
              <span className="text-[10px] bg-[#e8f5ec] text-[#0F6637] px-2 py-0.5 rounded-full font-medium">卡槽式</span>
            </div>
          </div>

          {/* 性能检测 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] flex items-center justify-center text-base">🔬</div>
              <h4 className="font-bold text-[#333] text-sm">性能检测</h4>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {perfTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400">均取得超越所有传统产品的优秀结果</p>
          </div>

          {/* 产品优势 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#e8f5ec] flex items-center justify-center text-base">✨</div>
              <h4 className="font-bold text-[#333] text-sm">产品优势</h4>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {benefitTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] bg-[#e8f5ec] text-[#0F6637] border border-[#0F6637]/20 px-1.5 py-0.5 rounded font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400">符合人们对绿色健康的需求</p>
          </div>
        </div>
      </div>
    </section>
  )
}