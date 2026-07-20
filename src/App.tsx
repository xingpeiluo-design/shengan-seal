import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useSettings } from './lib/settings'
import Header from './sections/Header'
import TopBanner from './sections/TopBanner'
import BannerCarousel from './sections/BannerCarousel'
import ProductIntro from './sections/ProductIntro'
import ProductCenter from './sections/ProductCenter'
import TechAdvantages from './sections/TechAdvantages'
import PerformanceComparison from './sections/PerformanceComparison'
import FactoryStrength from './sections/FactoryStrength'
import EngineeringCases from './sections/EngineeringCases'
import OnlineChannel from './sections/OnlineChannel'
import NewsSection from './sections/NewsSection'
import ContactFooter from './sections/ContactFooter'
import FloatSidebar from './sections/FloatSidebar'
import SampleModal from './sections/SampleModal'
import QRModal from './sections/QRModal'
import AdminPanel from './sections/AdminPanel'
import ProductList from './pages/ProductList'
import ProductDetail from './sections/ProductDetail'

// 首页组件
function HomePage() {
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState<'wechat' | 'douyin' | null>(null)
  const settings = useSettings()

  // SEO 元数据随后台「热线」动态生成：源码不写死电话，避免与后台不一致
  useEffect(() => {
    const tel = settings?.hotline
    if (!tel) return
    const desc = `盛安密封是湖南长沙专业的包覆式密封条源头厂家，主营隐形门密封条、推拉门隔音胶条、防盗门密封条、自粘门窗胶条、铝合金密封条等产品。8年密封条生产经验，支持OEM定制，全国发货，工厂直供价格优势。热线：${tel}`
    document
      .querySelectorAll('meta[name="description"]')
      .forEach((m) => m.setAttribute('content', desc))
    document
      .querySelectorAll('meta[property="og:description"]')
      .forEach((m) => m.setAttribute('content', desc))
    document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach((s) => {
        try {
          const data = JSON.parse(s.textContent || '{}')
          data.telephone = '+86-' + tel
          s.textContent = JSON.stringify(data)
        } catch {
          /* 忽略非 JSON-LD 脚本 */
        }
      })
  }, [settings])

  return (
    <div className="min-h-screen bg-[#F8F8F5]">
      <TopBanner />
      <Header onSampleClick={() => setShowSampleModal(true)} />
      <BannerCarousel onSampleClick={() => setShowSampleModal(true)} />
      <ProductIntro />
      <ProductCenter onSampleClick={() => setShowSampleModal(true)} />
      <TechAdvantages />
      <PerformanceComparison />
      <FactoryStrength />
      <EngineeringCases />
      <OnlineChannel onSampleClick={() => setShowSampleModal(true)} />
      <NewsSection />
      <ContactFooter onSampleClick={() => setShowSampleModal(true)} />
      <FloatSidebar
        onSampleClick={() => setShowSampleModal(true)}
        onWechatClick={() => setShowQRModal('wechat')}
        onDouyinClick={() => setShowQRModal('douyin')}
      />
      {showSampleModal && <SampleModal onClose={() => setShowSampleModal(false)} />}
      {showQRModal && <QRModal type={showQRModal} onClose={() => setShowQRModal(null)} />}
      {/* 管理入口：仅双击左下角触发，平时完全不可见 */}
      <AdminEntry />
    </div>
  )
}

// 管理入口入口点（仅双击左下角触发）
function AdminEntry() {
  const navigate = useNavigate()
  return (
    <a
      href="/admin"
      onClick={(e) => { e.preventDefault(); navigate('/admin') }}
      onDoubleClick={(e) => { e.preventDefault(); navigate('/admin') }}
      className="fixed bottom-0 left-0 w-3 h-3 opacity-0 cursor-default"
      style={{ zIndex: 999 }}
      title=""
    />
  )
}

// 管理后台（独立路由）
function AdminRoute() {
  const navigate = useNavigate()
  return <AdminPanel onBack={() => navigate('/')} />
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
