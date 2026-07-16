const advantages = [
  {
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="#0F6637" strokeWidth="2"/>
        <path d="M12 20 L18 26 L28 14" stroke="#0F6637" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 8 L20 12 M32 20 L28 20 M20 32 L20 28 M8 20 L12 20" stroke="#0F6637" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: '四层复合一体结构',
    subtitle: '稳固耐用不塌陷',
    desc: 'PE膜+PU内芯+PP骨架+TPU鱼刺倒钩四层精密复合，各层功能协同，安装一次，长期稳固，彻底解决普通胶条塌陷、脱落、变形问题',
    data: '抗压强度提升 3x',
  },
  {
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
        <path d="M20 4 C28 10 34 16 34 24 C34 31 27.7 36 20 36 C12.3 36 6 31 6 24 C6 16 12 10 20 4Z" stroke="#0F6637" strokeWidth="2"/>
        <path d="M14 24 Q20 18 26 24" stroke="#0F6637" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="3" fill="#0F6637"/>
      </svg>
    ),
    title: '耐候耐用抗老化',
    subtitle: '寿命远超普通PVC',
    desc: '高性能PU材质经特殊处理，耐紫外线、耐臭氧、抗疲劳，无论严寒酷暑，不龟裂、不变脆、不变形，使用寿命比普通PVC胶条延长3倍以上',
    data: '使用寿命 10年+',
  },
  {
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="6" width="28" height="28" rx="4" stroke="#0F6637" strokeWidth="2"/>
        <path d="M6 20 L34 20" stroke="#0F6637" strokeWidth="1.5" strokeDasharray="3 2"/>
        <path d="M10 12 L30 12 M10 28 L30 28" stroke="#0F6637" strokeWidth="1" opacity="0.5"/>
        <circle cx="20" cy="20" r="4" fill="none" stroke="#0F6637" strokeWidth="2"/>
        <path d="M20 4 L20 8 M20 32 L20 36" stroke="#0F6637" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: '超低隔热K值',
    subtitle: '有效节能降耗',
    desc: '密封条隔断冷热桥传导，大幅降低门窗整体热传导系数，减少空调暖气损耗，经测算可降低建筑能耗30%以上，适配绿色建筑标准',
    data: '节能降耗 30%+',
  },
  {
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
        <path d="M6 28 C6 28 10 12 20 12 C30 12 34 28 34 28" stroke="#0F6637" strokeWidth="2"/>
        <path d="M4 28 L36 28" stroke="#0F6637" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 22 Q15 18 20 22 Q25 26 30 22" stroke="#0F6637" strokeWidth="1.5" strokeLinecap="round"/>
        {/* 雨滴 */}
        <circle cx="14" cy="8" r="2" fill="#0F6637" opacity="0.5"/>
        <circle cx="20" cy="6" r="2" fill="#0F6637" opacity="0.7"/>
        <circle cx="26" cy="8" r="2" fill="#0F6637" opacity="0.5"/>
      </svg>
    ),
    title: '强效防水防渗',
    subtitle: '雨天杜绝渗水',
    desc: '高密度PU芯+紧密贴合结构，形成完整物理防水屏障，台风暴雨天气实测零渗漏，彻底解决门窗漏水、窗台积水、墙体受潮等困扰',
    data: '防水等级 IPX5+',
  },
  {
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
        <ellipse cx="20" cy="20" rx="14" ry="14" stroke="#0F6637" strokeWidth="2"/>
        {/* 声波 */}
        <path d="M10 20 Q13 15 16 20 Q19 25 22 20 Q25 15 28 20 Q31 25 34 20" stroke="#0F6637" strokeWidth="1.5" fill="none"/>
        <line x1="20" y1="8" x2="20" y2="32" stroke="#0F6637" strokeWidth="1" strokeDasharray="2 2" opacity="0.4"/>
      </svg>
    ),
    title: '高效隔音降噪',
    subtitle: '强效隔绝户外噪音',
    desc: '多层密封结构形成声音衰减通道，配合高密度PU内芯吸音特性，有效阻隔交通噪音、工地噪音、邻居噪音，实测降噪20-35dB',
    data: '降噪 20-35dB',
  },
  {
    icon: (
      <svg className="w-10 h-10" viewBox="0 0 40 40" fill="none">
        <path d="M20 4 L23 14 L34 14 L25 20 L28 32 L20 25 L12 32 L15 20 L6 14 L17 14 Z" stroke="#0F6637" strokeWidth="2" fill="none"/>
        <circle cx="20" cy="20" r="5" fill="#0F6637" opacity="0.3"/>
      </svg>
    ),
    title: '母婴级安全环保',
    subtitle: '无毒无味，健康认证',
    desc: '全程不含塑化剂、重金属、有害挥发物，通过第三方SGS环保检测，符合国家室内装饰材料有害物质限量标准，适合孕妇婴儿家庭使用',
    data: '通过SGS环保认证',
  },
]

export default function TechAdvantages() {
  return (
    <section id="tech" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-0.5 bg-[#0F6637]"/>
            <span className="text-[#0F6637] text-sm font-semibold tracking-widest uppercase">Core Technology</span>
            <div className="w-8 h-0.5 bg-[#0F6637]"/>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#333]">六大核心技术优势</h2>
          <p className="text-gray-500 mt-2">痛点解决 + 客户收益双维度，全面超越普通密封条</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {advantages.map((adv, i) => (
            <div
              key={i}
              className="tech-card bg-[#F8F8F5] rounded-xl p-6 border border-gray-100 hover:border-[#7ecfa0]"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-[#e8f5ec] rounded-xl flex items-center justify-center">
                  {adv.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#333] text-base">{adv.title}</h3>
                  <p className="text-[#0F6637] text-xs font-semibold mt-0.5">{adv.subtitle}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-4 leading-relaxed">{adv.desc}</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-0.5 flex-1 bg-[#e8f5ec]"/>
                <span className="text-xs font-bold text-[#0F6637] bg-[#e8f5ec] px-2 py-0.5 rounded-full">
                  {adv.data}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
