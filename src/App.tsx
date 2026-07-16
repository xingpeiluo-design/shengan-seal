import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
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
      <a
        href="#/admin"
        className="fixed bottom-0 left-0 w-3 h-3 opacity-0 cursor-default"
        style={{ zIndex: 999 }}
        onDoubleClick={() => { window.location.hash = '#/admin' }}
        title=""
      />
    </div>
  )
}

// 管理后台（独立路由）
function AdminRoute() {
  return <AdminPanel onBack={() => { window.location.hash = '#/' }} />
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Routes>
    </HashRouter>
  )
}

export default App
