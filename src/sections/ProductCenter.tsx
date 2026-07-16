import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

interface ProductCenterProps {
  onSampleClick: () => void
}

interface Product {
  id: number
  name: string
  short_name: string
  category: string
  badge: string
  badge_color: string
  highlights: string[]
  description: string
  specs: { label: string; value: string }[]
  use_cases: string[]
  bg_color: string
  border_color: string
  pdd_link: string
  image_url: string
}

interface SubProduct {
  id: number
  name: string
  icon: string
  description: string
}

export default function ProductCenter({ onSampleClick }: ProductCenterProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [subProducts, setSubProducts] = useState<SubProduct[]>([])
  const [pddLink, setPddLink] = useState('https://mobile.yangkeduo.com')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.products.list(),
      api.products.subProducts(),
      api.settings.list(),
    ]).then(([prods, subs, settings]) => {
      setProducts(prods)
      setSubProducts(subs)
      if (settings.pdd_link) setPddLink(settings.pdd_link)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section id="products" className="py-16 bg-[#F8F8F5]">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 py-20">加载产品数据...</div>
      </section>
    )
  }

  return (
    <section id="products" className="py-16 bg-[#F8F8F5]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-1 h-8 bg-[#0F6637] rounded-full"/>
          <h2 className="text-2xl md:text-3xl font-bold text-[#333]">产品中心</h2>
          <span className="ml-3 text-sm text-gray-500">拼多多电商 + B端工程 双核心产品线</span>
        </div>

        {/* 主产品双卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {products.map(prod => (
            <div
              key={prod.id}
              className="product-card bg-white rounded-xl border-2 overflow-hidden"
              style={{ borderColor: prod.border_color }}
            >
              {/* 顶部分类标识 */}
              <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: prod.bg_color }}>
                <span className="text-xs text-gray-500 font-medium">{prod.category}</span>
                <span
                  className="text-xs text-white px-2 py-1 rounded-full font-bold"
                  style={{ backgroundColor: prod.badge_color }}
                >
                  {prod.badge}
                </span>
              </div>

              {/* 产品图示区 */}
              <div className="px-5 pt-4">
                <div className="rounded-lg h-48 flex items-center justify-center relative overflow-hidden bg-gray-100">
                  {prod.image_url ? (
                    <img
                      src={prod.image_url}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <svg viewBox="0 0 300 150" className="w-full h-full">
                      <rect width="300" height="150" fill="#1a2a1a"/>
                      <rect x="30" y="30" width="240" height="28" rx="14" fill="#e8f5ec" opacity="0.9"/>
                      <rect x="30" y="62" width="240" height="36" rx="4" fill="#b3d9c4" opacity="0.85"/>
                      <rect x="45" y="102" width="210" height="16" rx="3" fill="#7ecfa0" opacity="0.8"/>
                      <rect x="30" y="120" width="240" height="12" rx="2" fill="#ffeb9c" opacity="0.9"/>
                      <text x="150" y="52" textAnchor="middle" fontSize="11" fill="#0a3d1f" fontWeight="bold">PE保护膜</text>
                      <text x="150" y="84" textAnchor="middle" fontSize="11" fill="#0a3d1f" fontWeight="bold">PU热固性内芯</text>
                      <text x="150" y="114" textAnchor="middle" fontSize="10" fill="#0a3d1f">PP骨架层</text>
                      <text x="150" y="131" textAnchor="middle" fontSize="9" fill="#8b6914">包覆式密封条结构</text>
                    </svg>
                  )}
                </div>
              </div>

              {/* 产品信息 */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-[#333] mb-1">{prod.short_name || prod.name}</h3>
                {prod.short_name && prod.short_name !== prod.name && (
                  <p className="text-xs text-gray-400 mb-2 truncate">{prod.name}</p>
                )}

                {/* 亮点标签 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Array.isArray(prod.highlights) ? prod.highlights.map((h: string) => (
                    <span key={h} className="bg-[#e8f5ec] text-[#0F6637] text-xs px-2 py-0.5 rounded font-medium">{h}</span>
                  )) : null}
                </div>

                <p className="text-gray-600 text-sm mb-4 leading-relaxed">{prod.description}</p>

                {/* 规格参数 */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Array.isArray(prod.specs) ? prod.specs.map((spec: { label: string; value: string }) => (
                    <div key={spec.label} className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">{spec.label}</div>
                      <div className="text-xs font-semibold text-gray-700 mt-0.5">{spec.value}</div>
                    </div>
                  )) : null}
                </div>

                {/* 使用场景 */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {Array.isArray(prod.use_cases) ? prod.use_cases.map((uc: string) => (
                    <span key={uc} className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded">
                      {uc}
                    </span>
                  )) : null}
                </div>

                {/* 按钮 */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={onSampleClick}
                    className="flex-1 border border-[#0F6637] text-[#0F6637] text-sm py-2 rounded font-semibold hover:bg-[#e8f5ec] transition-colors"
                  >
                    免费寄样
                  </button>
                  <a
                    href={prod.pdd_link || pddLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-pdd-btn={`product-${prod.id}`}
                    className="flex-1 bg-[#e4323c] text-white text-sm py-2 rounded font-bold text-center hover:bg-[#c8282f] transition-colors"
                  >
                    拼多多进店
                  </a>
                </div>
                <Link
                  to={`/products/${prod.id}`}
                  className="block text-center text-sm text-[#0F6637] font-medium hover:underline"
                >
                  查看详情 →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 细分品类展示 */}
        <div>
          <h3 className="text-lg font-bold text-[#333] mb-4">细分产品系列</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subProducts.map(sub => (
              <div key={sub.id} className="product-card bg-white rounded-xl p-5 border border-gray-100 text-center">
                <div className="text-3xl mb-3">{sub.icon}</div>
                <h4 className="font-bold text-sm text-[#333] mb-2">{sub.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{sub.description}</p>
                <button
                  onClick={onSampleClick}
                  className="mt-3 text-xs text-[#0F6637] border border-[#0F6637] px-3 py-1 rounded hover:bg-[#e8f5ec] transition-colors"
                >
                  申请寄样
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
