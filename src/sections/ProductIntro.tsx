export default function ProductIntro() {
  return (
    <section id="intro" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-1 h-8 bg-[#0F6637] rounded-full"/>
          <h2 className="text-2xl md:text-3xl font-bold text-[#333]">品牌产品介绍</h2>
          <span className="ml-3 text-sm text-gray-500 font-normal">高端包覆式密封条，源头制造品质保障</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* 左侧文字 */}
          <div>
            <h3 className="text-xl font-bold text-[#0F6637] mb-4">包覆式密封条 — 四层复合一体结构</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              包覆式密封条是由四种质地优良的材料复合而成，其外层包裹PE膜，为密封条提供了基本的质量保障，而且美观大方。
            </p>
            <p className="text-gray-600 mb-6 leading-relaxed">
              热固性芯的主要成分为PU，也就是包覆式密封条的主要材料，具有超强的可塑性。内部的PP骨架以及塑料与橡胶完美结合的TPU鱼刺倒钩设计和德国进口的双面胶带的分类应用进一步完善了包覆式密封条。
            </p>

            {/* 四层结构说明 */}
            <div className="space-y-3 mb-6">
              {[
                { color: '#e8f5ec', border: '#7ecfa0', num: '①', title: 'PE外层保护膜', desc: '美观耐刮，耐老化，表面光滑，视觉质感高端' },
                { color: '#c8e6d4', border: '#4caf80', num: '②', title: 'PU热固性内芯（主体）', desc: '可塑性强，高回弹不塌陷，抗压抗疲劳，使用寿命远超普通PVC' },
                { color: '#9ecfb0', border: '#2e8b57', num: '③', title: 'PP支撑骨架', desc: '内部刚性支撑，不易变形，保持长期截面稳定性' },
                { color: '#7ecfa0', border: '#0F6637', num: '', title: 'TPU鱼刺倒钩 + 德国进口双面胶带', desc: '塑料与橡胶完美结合的TPU鱼刺倒钩设计，配合德国进口双面胶带分类应用，紧固卡槽不脱落' },
              ].map(item => (
                <div key={item.num} className="flex gap-3 p-3 rounded-lg border" style={{ backgroundColor: item.color, borderColor: item.border }}>
                  <span className="font-black text-[#0F6637] text-lg w-6 flex-shrink-0">{item.num}</span>
                  <div>
                    <div className="font-semibold text-[#0a3d1f] text-sm">{item.title}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 产品分类说明 */}
            <div className="border border-[#0F6637]/20 rounded-lg p-4 bg-[#f5faf7] mb-4">
              <div className="text-sm font-semibold text-[#0F6637] mb-2">■ 产品分类</div>
              <p className="text-gray-600 text-sm leading-relaxed">
                包覆式密封条分为<strong>自贴式</strong>和<strong>卡槽式</strong>，可用于不同门窗，在操作安装上较为便捷。
              </p>
            </div>

            {/* 性能测试结果 */}
            <div className="border border-[#0F6637]/20 rounded-lg p-4 bg-[#f5faf7] mb-4">
              <div className="text-sm font-semibold text-[#0F6637] mb-2">■ 性能检测优秀结果</div>
              <div className="flex flex-wrap gap-2">
                {['耐老化', '耐疲劳', '压缩变形测试', '压缩力测试', '热传导K值测试', '水侵性', '水渗透性'].map(tag => (
                  <span key={tag} className="bg-white border border-[#0F6637]/30 text-[#0F6637] text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">均取得超越所有传统产品的优秀结果</p>
            </div>

            {/* 产品优势 */}
            <div className="border border-[#0F6637]/20 rounded-lg p-4 bg-[#f5faf7]">
              <div className="text-sm font-semibold text-[#0F6637] mb-2">■ 产品优势</div>
              <div className="flex flex-wrap gap-2">
                {['节能环保', '隔音降噪', '抗强紫外线', '无毒', '不与油漆/清洁剂发生反应', '绿色健康'].map(tag => (
                  <span key={tag} className="bg-white border border-[#0F6637]/30 text-[#0F6637] text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2">符合人们对绿色健康的需求</p>
            </div>
          </div>

          {/* 右侧截面图示 */}
          <div className="flex flex-col gap-4">
            {/* 大截面图 */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-6 relative overflow-hidden">
              <div className="text-white text-sm font-semibold mb-4 text-center opacity-80">包覆式密封条剖面结构图（示意）</div>
              <svg viewBox="0 0 380 220" className="w-full">
                {/* 背景网格 */}
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.3" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="380" height="220" fill="url(#grid)"/>
                
                {/* 密封条截面 */}
                {/* PE外层 */}
                <rect x="30" y="20" width="320" height="32" rx="16" fill="#e8f5ec" stroke="#7ecfa0" strokeWidth="2"/>
                <text x="190" y="41" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0a3d1f">PE 外层保护膜</text>
                
                {/* PU内芯 */}
                <rect x="30" y="56" width="320" height="48" rx="6" fill="#b3d9c4" stroke="#4caf80" strokeWidth="2"/>
                <text x="190" y="85" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0a3d1f">PU 热固性内芯（高密度主体）</text>
                
                {/* PP骨架 */}
                <rect x="55" y="108" width="270" height="22" rx="4" fill="#7ecfa0" stroke="#2e8b57" strokeWidth="1.5"/>
                <text x="190" y="123" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0a3d1f">PP 支撑骨架</text>
                
                {/* TPU鱼刺 */}
                {[...Array(10)].map((_, i) => (
                  <g key={i}>
                    <polygon 
                      points={`${45 + i * 30},134 ${55 + i * 30},170 ${35 + i * 30},170`} 
                      fill="#0F6637" 
                      stroke="#7ecfa0" 
                      strokeWidth="1"
                      opacity="0.85"
                    />
                  </g>
                ))}
                <text x="190" y="190" textAnchor="middle" fontSize="10" fill="white" opacity="0.8">TPU 鱼刺倒钩（卡紧不脱落）</text>

                {/* 标注箭头 */}
                <line x1="355" y1="36" x2="375" y2="36" stroke="#7ecfa0" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                <line x1="355" y1="80" x2="375" y2="80" stroke="#4caf80" strokeWidth="1.5"/>
                <line x1="355" y1="119" x2="375" y2="119" stroke="#2e8b57" strokeWidth="1.5"/>
                <line x1="355" y1="155" x2="375" y2="155" stroke="#7ecfa0" strokeWidth="1.5"/>
              </svg>
              <div className="text-center text-xs text-gray-400 mt-2">黑白两款均有现货 · 可来样定制颜色 · 德国进口双面胶带</div>
            </div>

            {/* 快速特性标签 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🔇', title: '强效隔音', desc: '隔绝户外噪音 20-35dB' },
                { icon: '🌡️', title: '隔热节能', desc: '超低传热K值，节能30%+' },
                { icon: '💧', title: '防水防渗', desc: '雨天零渗漏保障' },
                { icon: '⏳', title: '耐老化', desc: '寿命远超普通PVC 3倍+' },
              ].map(item => (
                <div key={item.title} className="bg-[#f5faf7] border border-[#e0ead5] rounded-lg p-3 flex gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-[#0F6637]">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
