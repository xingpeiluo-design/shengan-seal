import { useState, useEffect } from 'react'

interface BannerCarouselProps {
  onSampleClick: () => void
}

const slides = [
  {
    id: 1,
    bg: 'from-[#0a3d1f] to-[#0F6637]',
    pattern: 'factory',
    title: '盛安密封 | 高端包覆式密封条源头制造商',
    subtitles: [
      '四层复合一体结构，性能全面超越传统门窗胶条',
      '精准解决：门窗漏风 · 漏雨 · 噪音大 · 胶条老化开裂',
      '源头工厂直供，无中间商，品质稳定可控',
      '工程配套 · OEM贴牌 · 来样开模 · 批量定制',
    ],
    cta1: '查看产品',
    cta2: '拼多多进店采购',
    href1: '#products',
    href2: 'https://mobile.yangkeduo.com',
  },
  {
    id: 2,
    bg: 'from-[#1a4d2e] to-[#2d7a4f]',
    pattern: 'window',
    title: '隔音降噪 · 隔热节能 · 抗紫外线',
    subtitles: [
      '母婴级无毒环保，耐老化不变形',
      '适配家装、工程全场景使用',
      '通过多项权威第三方检测认证',
      '雨天零渗漏，冬暖夏凉全季候密封',
    ],
    cta1: '性能检测报告',
    cta2: '免费申请寄样',
    href1: '#performance',
    href2: null,
  },
  {
    id: 3,
    bg: 'from-[#0d2e16] to-[#0F6637]',
    pattern: 'delivery',
    title: '日产10万米现货，工厂直营无中间商',
    subtitles: [
      '拼多多现货速发，大小批量均可接单',
      '支持一件代发 · 工程大单配套',
      '门窗厂 · 阳光房工程 · 地产精装全覆盖',
      '含税报价 · 对公签约 · 长期经销授权',
    ],
    cta1: '工厂实力',
    cta2: '洽谈合作',
    href1: '#factory',
    href2: '#contact',
  },
]

interface BannerCarouselProps {
  onSampleClick: () => void
}

export default function BannerCarousel({ onSampleClick }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <section id="home" className={`relative bg-gradient-to-br ${slide.bg} min-h-[520px] md:min-h-[600px] flex items-center overflow-hidden transition-all duration-700`}>
      {/* 背景几何装饰 */}
      <div className="absolute inset-0 opacity-10">
        {slide.pattern === 'factory' && (
          <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            <rect x="0" y="400" width="1200" height="200" fill="white"/>
            <rect x="100" y="300" width="200" height="300" fill="white" opacity="0.5"/>
            <rect x="350" y="250" width="300" height="350" fill="white" opacity="0.4"/>
            <rect x="700" y="280" width="250" height="320" fill="white" opacity="0.3"/>
            <rect x="1000" y="320" width="180" height="280" fill="white" opacity="0.5"/>
            {[...Array(12)].map((_, i) => (
              <rect key={i} x={80 + i * 95} y={270 + (i % 3) * 20} width={60} height={8} fill="white" opacity="0.6"/>
            ))}
          </svg>
        )}
        {slide.pattern === 'window' && (
          <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            {[...Array(5)].map((_, i) => (
              <g key={i}>
                <rect x={50 + i * 230} y="50" width="180" height="500" rx="8" stroke="white" strokeWidth="8" fill="none"/>
                <line x1={140 + i * 230} y1="50" x2={140 + i * 230} y2="550" stroke="white" strokeWidth="6"/>
                <line x1={50 + i * 230} y1="300" x2={230 + i * 230} y2="300" stroke="white" strokeWidth="6"/>
              </g>
            ))}
          </svg>
        )}
        {slide.pattern === 'delivery' && (
          <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            {[...Array(8)].map((_, i) => (
              <g key={i}>
                <rect x={50 + i * 145} y={100 + (i % 2) * 50} width="120" height="80" rx="4" fill="white" opacity="0.4"/>
                <line x1={50 + i * 145} y1={140 + (i % 2) * 50} x2={170 + i * 145} y2={140 + (i % 2) * 50} stroke="white" strokeWidth="2"/>
              </g>
            ))}
            <rect x="0" y="450" width="1200" height="4" fill="white"/>
            {[...Array(6)].map((_, i) => (
              <circle key={i} cx={100 + i * 200} cy="450" r="20" fill="white" opacity="0.5"/>
            ))}
          </svg>
        )}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="max-w-3xl">
          {/* 标签 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-[#e4323c] text-white text-xs font-bold px-3 py-1 rounded-full">源头制造商</span>
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">拼多多工厂直营</span>
            <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">B端定制合作</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {slide.title}
          </h1>

          {/* 副标题列表 */}
          <ul className="mb-8 space-y-2">
            {slide.subtitles.map((sub, i) => (
              <li key={i} className="flex items-center gap-2 text-green-100 text-sm md:text-base">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 flex-shrink-0"/>
                {sub}
              </li>
            ))}
          </ul>

          {/* CTA按钮 */}
          <div className="flex flex-wrap gap-3">
            <a
              href={slide.href1}
              className="btn-outline border-white text-white hover:bg-white hover:text-[#0F6637] px-8 py-3 rounded font-bold text-base"
            >
              {slide.cta1}
            </a>
            {slide.href2 ? (
              <a
                href={slide.href2}
                target={slide.href2.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="btn-pdd px-8 py-3 rounded font-bold text-base"
                data-pdd-btn="banner"
              >
                🛒 {slide.cta2}
              </a>
            ) : (
              <button
                onClick={onSampleClick}
                className="btn-primary px-8 py-3 rounded font-bold text-base bg-amber-500 hover:bg-amber-600"
              >
                📦 {slide.cta2}
              </button>
            )}
          </div>
        </div>

        {/* 右侧产品截面示意 */}
        <div className="hidden lg:block absolute right-16 top-1/2 -translate-y-1/2">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-64">
            <div className="text-white text-sm font-semibold mb-4 text-center">包覆式密封条截面结构</div>
            {/* 简化的截面示意图 */}
            <svg viewBox="0 0 220 160" className="w-full">
              <rect x="10" y="10" width="200" height="30" rx="15" fill="#e8f5ec"/>
              <text x="110" y="30" textAnchor="middle" fontSize="11" fill="#0F6637" fontWeight="bold">PE外层保护膜</text>
              <rect x="10" y="48" width="200" height="36" rx="4" fill="#c8e6d4"/>
              <text x="110" y="70" textAnchor="middle" fontSize="11" fill="#0a5029" fontWeight="bold">PU热固性内芯（主体）</text>
              <rect x="25" y="92" width="170" height="20" rx="4" fill="#9ecfb0"/>
              <text x="110" y="106" textAnchor="middle" fontSize="10" fill="#0a5029">PP支撑骨架</text>
              {/* TPU鱼刺倒钩 */}
              {[...Array(7)].map((_, i) => (
                <g key={i}>
                  <polygon points={`${30 + i * 25},120 ${38 + i * 25},140 ${22 + i * 25},140`} fill="#7ecfa0" opacity="0.8"/>
                </g>
              ))}
              <text x="110" y="155" textAnchor="middle" fontSize="10" fill="white">TPU鱼刺倒钩（卡紧结构）</text>
            </svg>
            <div className="mt-3 text-xs text-green-200 text-center">四层复合 · 稳固耐用 · 不脱落</div>
          </div>
        </div>
      </div>

      {/* 轮播指示器 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
          />
        ))}
      </div>

      {/* 左右箭头 */}
      <button
        onClick={() => setCurrent(prev => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={() => setCurrent(prev => (prev + 1) % slides.length)}
        className="absolute right-16 md:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  )
}
