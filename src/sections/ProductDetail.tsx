import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import Header from './Header'
import ContactFooter from './ContactFooter'
import FloatSidebar from './FloatSidebar'
import SampleModal from './SampleModal'
import QRModal from './QRModal'

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
  price: string
  stock: string
  pdd_link: string
  image_url: string
  gallery_images: string[]
  detail_images: string[]
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [showSample, setShowSample] = useState(false)
  const [showQR, setShowQR] = useState<'wechat' | 'douyin' | null>(null)

  useEffect(() => {
    if (id) {
      api.products.detail(parseInt(id)).then(data => {
        setProduct(data)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F8F5] flex flex-col items-center justify-center">
        <div className="text-gray-500 text-lg mb-4">产品不存在</div>
        <Link to="/products" className="text-[#0F6637] hover:underline">← 返回产品中心</Link>
      </div>
    )
  }

  const allImages = [...(product.gallery_images || []), ...(product.detail_images || [])]
  const gallery = product.gallery_images || []
  const details = product.detail_images || []

  return (
    <div className="min-h-screen bg-[#F8F8F5]">
      <Header onSampleClick={() => setShowSample(true)} />

      {/* 面包屑导航 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#0F6637]">首页</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#0F6637]">产品中心</Link>
          <span>/</span>
          <span className="text-gray-800 truncate">{product.short_name || product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 上部：图片 + 基础信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* 左侧：图片画廊 */}
          <div>
            {/* 主图 */}
            <div className="rounded-xl overflow-hidden bg-white border border-gray-100 mb-3">
              <div className="aspect-square flex items-center justify-center bg-gray-50">
                <img
                  src={allImages[activeImg] || product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            {/* 缩略图列表 */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-[#0F6637] shadow-md' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400">
              共 {allImages.length} 张图片（主图 {gallery.length} 张 + 详情 {details.length} 张）
            </div>
          </div>

          {/* 右侧：产品信息 */}
          <div>
            {/* 分类标签 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.category}</span>
              {product.badge && (
                <span
                  className="text-xs text-white px-2 py-1 rounded-full font-bold"
                  style={{ backgroundColor: product.badge_color }}
                >
                  {product.badge}
                </span>
              )}
            </div>

            {/* 产品名称 */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#333] mb-1 leading-tight">{product.short_name || product.name}</h1>
            {product.short_name && product.short_name !== product.name && (
              <p className="text-sm text-gray-400 mb-4">{product.name}</p>
            )}

            {/* 价格 */}
            {product.price && (
              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-500 mb-1">参考价格</div>
                <div className="text-2xl font-bold text-[#e4323c]">{product.price}</div>
              </div>
            )}

            {/* 库存状态 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">库存状态：</span>
              <span className="text-sm font-semibold text-[#0F6637]">{product.stock}</span>
            </div>

            {/* 核心卖点 */}
            {product.highlights?.length > 0 && (
              <div className="mb-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">核心卖点</div>
                <div className="flex flex-wrap gap-2">
                  {product.highlights.map((h, i) => (
                    <span key={i} className="bg-[#e8f5ec] text-[#0F6637] text-sm px-3 py-1 rounded-full font-medium">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 产品简介 */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-700 mb-2">产品简介</div>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowSample(true)}
                className="flex-1 min-w-[140px] border-2 border-[#0F6637] text-[#0F6637] py-3 rounded-lg font-bold hover:bg-[#e8f5ec] transition-colors"
              >
                免费寄样
              </button>
              <a
                href={product.pdd_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] bg-[#e4323c] text-white py-3 rounded-lg font-bold text-center hover:bg-[#c8282f] transition-colors"
              >
                拼多多进店
              </a>
            </div>
          </div>
        </div>

        {/* 规格参数表 */}
        {product.specs?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#333] mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#0F6637] rounded-full" />
              规格参数
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specs.map((spec, i) => (
                <div key={i} className="flex border-b border-gray-50 pb-3">
                  <span className="text-sm text-gray-500 w-24 flex-shrink-0">{spec.label}</span>
                  <span className="text-sm font-semibold text-gray-800">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详情图文 */}
        {details.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#333] mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#0F6637] rounded-full" />
              产品详情
            </h2>
            <div className="space-y-2">
              {details.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} 详情图 ${i + 1}`}
                  className="w-full rounded-lg"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* 适用场景 */}
        {product.use_cases?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-bold text-[#333] mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-[#0F6637] rounded-full" />
              适用场景
            </h2>
            <div className="flex flex-wrap gap-3">
              {product.use_cases.map((uc, i) => (
                <span key={i} className="bg-gray-50 text-gray-700 text-sm px-4 py-2 rounded-lg border border-gray-200">
                  {uc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 底部转化区 */}
        <div className="bg-gradient-to-r from-[#0F6637] to-[#1a7a42] rounded-xl p-8 text-center text-white mb-8">
          <h3 className="text-xl font-bold mb-2">需要采购或样品？</h3>
          <p className="text-green-100 text-sm mb-6">源头工厂直供 · 支持来样定制 · 工程批量优惠</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setShowSample(true)}
              className="bg-white text-[#0F6637] px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
            >
              免费申请寄样
            </button>
            <a
              href={product.pdd_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#e4323c] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#c8282f] transition-colors"
            >
              拼多多直接下单
            </a>
          </div>
        </div>

        {/* 返回产品中心 */}
        <div className="text-center mb-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-[#0F6637] hover:underline font-medium"
          >
            ← 返回产品中心，查看更多产品
          </Link>
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
