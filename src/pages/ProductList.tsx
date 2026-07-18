import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Header from '../sections/Header'
import ContactFooter from '../sections/ContactFooter'
import FloatSidebar from '../sections/FloatSidebar'
import SampleModal from '../sections/SampleModal'
import QRModal from '../sections/QRModal'

interface Product {
  id: number
  name: string
  short_name: string
  category: string
  badge: string
  badge_color: string
  highlights: string[]
  description: string
  bg_color: string
  border_color: string
  price: string
  image_url: string
  gallery_images: string[]
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showSample, setShowSample] = useState(false)
  const [showQR, setShowQR] = useState<'wechat' | 'douyin' | null>(null)

  useEffect(() => {
    api.products.list().then(data => {
      setProducts(data)
      setLoading(false)
      // SEO: 动态 title
      document.title = `产品中心 - 共 ${data.length} 款产品 - 盛安密封`
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F5]">
      <Header onSampleClick={() => setShowSample(true)} />

      {/* 面包屑 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0F6637]">首页</Link>
          <span>/</span>
          <span className="text-gray-800">产品中心</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-1 h-8 bg-[#0F6637] rounded-full" />
          <h1 className="text-3xl font-bold text-[#333]">产品中心</h1>
          <span className="ml-3 text-sm text-gray-500">共 {products.length} 款产品</span>
        </div>

        {/* 产品网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(prod => {
            const thumb = prod.gallery_images?.[0] || prod.image_url
            return (
              <Link
                key={prod.id}
                to={`/products/${prod.id}`}
                className="group bg-white rounded-xl border-2 overflow-hidden hover:shadow-lg transition-all duration-300"
                style={{ borderColor: prod.border_color }}
              >
                {/* 顶部分类标识 */}
                <div className="px-4 py-2 flex items-center justify-between" style={{ backgroundColor: prod.bg_color }}>
                  <span className="text-xs text-gray-500 font-medium">{prod.category}</span>
                  <span
                    className="text-xs text-white px-2 py-0.5 rounded-full font-bold"
                    style={{ backgroundColor: prod.badge_color }}
                  >
                    {prod.badge}
                  </span>
                </div>

                {/* 产品图片 */}
                <div className="px-4 pt-3">
                  <div className="rounded-lg h-44 flex items-center justify-center overflow-hidden bg-gray-50 group-hover:scale-[1.02] transition-transform duration-300">
                    {thumb ? (
                      <img src={thumb} alt={prod.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="text-gray-300 text-sm">暂无图片</div>
                    )}
                  </div>
                </div>

                {/* 产品信息 */}
                <div className="p-4">
                  <h3 className="font-bold text-[#333] mb-1 line-clamp-1 group-hover:text-[#0F6637] transition-colors">
                    {prod.short_name || prod.name}
                  </h3>
                  {prod.short_name && prod.short_name !== prod.name && (
                    <p className="text-xs text-gray-400 mb-2 line-clamp-1">{prod.name}</p>
                  )}

                  {/* 亮点标签 */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {prod.highlights?.slice(0, 2).map((h, i) => (
                      <span key={i} className="bg-[#e8f5ec] text-[#0F6637] text-xs px-2 py-0.5 rounded font-medium">
                        {h}
                      </span>
                    ))}
                  </div>

                  <p className="text-gray-500 text-xs mb-3 line-clamp-2">{prod.description}</p>

                  {/* 价格 */}
                  {prod.price && (
                    <div className="text-[#e4323c] font-bold text-sm">{prod.price}</div>
                  )}

                  {/* 查看详情按钮 */}
                  <div className="mt-3 text-center text-sm text-[#0F6637] font-medium group-hover:underline">
                    查看详情 →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <ContactFooter onSampleClick={() => setShowSample(true)} />
      <FloatSidebar
        onSampleClick={() => setShowSample(true)}
        onWechatClick={() => setShowQR('wechat')}
        onDouyinClick={() => setShowQR('douyin')}
      />
      {showSample && <SampleModal onClose={() => setShowSample(false)} />}
      {showQR && <QRModal type={showQR} onClose={() => setShowQR(null)} />}
    </div>
  )
}
