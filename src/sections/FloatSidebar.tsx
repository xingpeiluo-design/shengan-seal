import { useState, useEffect } from 'react'

interface FloatSidebarProps {
  onSampleClick: () => void
  onWechatClick: () => void
  onDouyinClick: () => void
}

export default function FloatSidebar({ onSampleClick, onWechatClick, onDouyinClick }: FloatSidebarProps) {
  const [showBackTop, setShowBackTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      {/* PC端右侧悬浮侧边栏 */}
      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 flex-col gap-1">
        {/* 微信二维码 */}
        <button
          onClick={onWechatClick}
          className="group w-12 bg-[#0F6637] hover:w-40 text-white flex items-center gap-2 px-2 py-3 rounded-l-xl transition-all duration-300 shadow-lg overflow-hidden"
          title="微信客服"
        >
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#0F6637"/>
            <path d="M10 13c0-3.3 2.7-6 6-6s6 2.7 6 6c0 2.2-1.2 4.2-3 5.3l.5 2.2-2.5-1.3c-.3.1-.7.1-1 .1-3.3 0-6-2.7-6-6z" fill="white"/>
            <circle cx="13" cy="13" r="1.2" fill="#0F6637"/>
            <circle cx="19" cy="13" r="1.2" fill="#0F6637"/>
          </svg>
          <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">微信客服咨询</span>
        </button>

        {/* 抖音视频号 */}
        <button
          onClick={onDouyinClick}
          className="group w-12 bg-[#333] hover:w-40 text-white flex items-center gap-2 px-2 py-3 rounded-l-xl transition-all duration-300 shadow-lg overflow-hidden"
          title="抖音视频号"
        >
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#333"/>
            <path d="M20 10c.5 1.5 2 2.5 3.5 2.5v2.5c-1 0-2-.3-2.8-.8V20c0 2.8-2.2 5-5 5s-5-2.2-5-5 2.2-5 5-5c.2 0 .4 0 .5.1v2.6c-.2 0-.3-.1-.5-.1-1.4 0-2.5 1.1-2.5 2.5s1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5V10H20z" fill="white"/>
          </svg>
          <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">抖音视频号</span>
        </button>

        {/* 拼多多入口 */}
        <a
          href="https://mobile.yangkeduo.com"
          target="_blank"
          rel="noopener noreferrer"
          data-pdd-btn="sidebar"
          className="group w-12 bg-[#e4323c] hover:w-48 text-white flex items-center gap-2 px-2 py-3 rounded-l-xl transition-all duration-300 shadow-lg overflow-hidden"
          title="拼多多进店"
        >
          <span className="text-xl flex-shrink-0">🛒</span>
          <span className="text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">拼多多工厂店 立即进店</span>
        </a>

        {/* 在线咨询 */}
        <button
          className="group w-12 bg-[#1a7a42] hover:w-40 text-white flex items-center gap-2 px-2 py-3 rounded-l-xl transition-all duration-300 shadow-lg overflow-hidden"
          title="在线咨询"
        >
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" fill="#1a7a42"/>
            <path d="M8 11a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-2l-3 3-3-3H10a2 2 0 01-2-2V11z" fill="white"/>
            <circle cx="12" cy="14" r="1" fill="#1a7a42"/>
            <circle cx="16" cy="14" r="1" fill="#1a7a42"/>
            <circle cx="20" cy="14" r="1" fill="#1a7a42"/>
          </svg>
          <span className="text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">在线咨询客服</span>
        </button>

        {/* 免费寄样 */}
        <button
          onClick={onSampleClick}
          className="group w-12 bg-amber-500 hover:w-40 text-white flex items-center gap-2 px-2 py-3 rounded-l-xl transition-all duration-300 shadow-lg overflow-hidden"
          title="免费寄样"
        >
          <span className="text-xl flex-shrink-0">📦</span>
          <span className="text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">申请免费寄样</span>
        </button>

        {/* 回顶部 */}
        {showBackTop && (
          <button
            onClick={scrollTop}
            className="w-12 bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center py-3 rounded-l-xl transition-colors shadow-lg"
            title="回到顶部"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>

      {/* 移动端底部固定栏 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-stretch">
          {/* 拼多多置顶核心入口 */}
          <a
            href="https://mobile.yangkeduo.com"
            target="_blank"
            rel="noopener noreferrer"
            data-pdd-btn="mobile-bottom"
            className="flex-1 bg-[#e4323c] text-white flex flex-col items-center justify-center py-2.5 text-center"
          >
            <span className="text-base">🛒</span>
            <span className="text-[10px] font-bold mt-0.5">拼多多进店</span>
          </a>
          <button
            onClick={onWechatClick}
            className="flex-1 bg-[#0F6637] text-white flex flex-col items-center justify-center py-2.5"
          >
            <span className="text-base">💬</span>
            <span className="text-[10px] font-bold mt-0.5">微信咨询</span>
          </button>
          <button
            onClick={onSampleClick}
            className="flex-1 bg-amber-500 text-white flex flex-col items-center justify-center py-2.5"
          >
            <span className="text-base">📦</span>
            <span className="text-[10px] font-bold mt-0.5">免费寄样</span>
          </button>
          <a
            href="tel:4008888SEAL"
            className="flex-1 bg-[#1a7a42] text-white flex flex-col items-center justify-center py-2.5"
          >
            <span className="text-base">📞</span>
            <span className="text-[10px] font-bold mt-0.5">电话咨询</span>
          </a>
        </div>
        {/* 底部安全区域 */}
        <div className="h-safe-area-inset-bottom bg-white"/>
      </div>
    </>
  )
}
