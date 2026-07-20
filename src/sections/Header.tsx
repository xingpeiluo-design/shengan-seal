import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSettings } from '../lib/settings'

interface HeaderProps {
  onSampleClick: () => void
}

export default function Header({ onSampleClick }: HeaderProps) {
  const settings = useSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  const navItems = [
    { label: '首页', href: '/', isRoute: true },
    { label: '产品中心', href: '/products', isRoute: true },
    { label: '核心技术', href: '#tech', isRoute: false },
    { label: '性能检测', href: '#performance', isRoute: false },
    { label: '工厂实力', href: '#factory', isRoute: false },
    { label: '工程案例', href: '#cases', isRoute: false },
    { label: '线上采购', href: '#channel', isRoute: false },
    { label: '行业资讯', href: '#news', isRoute: false },
    { label: '联系我们', href: '#contact', isRoute: false },
  ]

  const renderNavLink = (item: any, onClick?: () => void, isMobile = false) => {
    const baseClass = isMobile
      ? 'block px-4 py-2 text-white text-sm hover:bg-[#1a7a42] rounded transition-colors whitespace-nowrap'
      : 'px-2.5 py-2 text-white text-[13px] hover:bg-[#1a7a42] rounded transition-colors whitespace-nowrap font-medium'
    if (item.isRoute) {
      return (
        <Link
          key={item.label}
          to={item.href}
          onClick={onClick}
          className={baseClass}
        >
          {item.label}
        </Link>
      )
    }
    // 锚点链接：如果不在首页，先跳回首页再滚动
    const handleAnchorClick = (e: React.MouseEvent) => {
      if (!isHome) {
        window.location.hash = '#/'
        setTimeout(() => {
          const el = document.querySelector(item.href)
          el?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        e.preventDefault()
      } else {
        e.preventDefault()
        const el = document.querySelector(item.href)
        el?.scrollIntoView({ behavior: 'smooth' })
      }
      onClick?.()
    }
    return (
      <a
        key={item.label}
        href={item.href}
        onClick={handleAnchorClick}
        className={baseClass}
      >
        {item.label}
      </a>
    )
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0F6637] shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo区 */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-white/10">
              <img src="/images/store_logo.webp" alt="盛安密封" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-white text-xl font-bold tracking-wider">盛安密封</div>
              <div className="text-green-200 text-[9px] md:text-[10px] tracking-widest uppercase hidden sm:block leading-tight">Manufacturer of high-end wrap-around sealing strips</div>
            </div>
          </Link>

          {/* PC导航菜单 */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => renderNavLink(item))}
          </nav>

          {/* 右上角快捷按钮 */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={settings.pdd_link || 'https://mobile.yangkeduo.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-[#e4323c] text-white text-sm px-3 py-2 rounded font-semibold hover:bg-[#c8282f] transition-colors"
            >
              <span>🛒</span> 拼多多进店
            </a>
            <button
              onClick={onSampleClick}
              className="flex items-center gap-1 bg-white text-[#0F6637] text-sm px-3 py-2 rounded font-semibold hover:bg-green-50 transition-colors"
            >
              <span>📦</span> 免费寄样
            </button>
          </div>

          {/* 汉堡菜单 */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* 移动端菜单 */}
        {mobileOpen && (
          <div className="lg:hidden bg-[#0a5029] py-3 px-2 border-t border-green-700">
            {navItems.map(item => renderNavLink(item, () => setMobileOpen(false), true))}
            <div className="flex gap-2 mt-3 px-2">
              <a
                href={settings.pdd_link || 'https://mobile.yangkeduo.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-[#e4323c] text-white text-sm px-3 py-2 rounded font-semibold"
              >
                🛒 拼多多进店
              </a>
              <button
                onClick={() => { setMobileOpen(false); onSampleClick() }}
                className="flex-1 text-center bg-white text-[#0F6637] text-sm px-3 py-2 rounded font-semibold"
              >
                📦 免费寄样
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
