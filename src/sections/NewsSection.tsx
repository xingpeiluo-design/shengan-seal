import { useState, useEffect } from 'react'
import { api } from '../api'

interface NewsItem {
  id: number
  title: string
  category: string
  summary: string
  tags: string[]
  read_time: string
  created_at: string
  views: number
}

export default function NewsSection() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [loading, setLoading] = useState(true)

  const categories = ['全部', '安装教程', '行业科普', '工厂资讯', '建材标准', '改造知识', 'SEO专题']

  useEffect(() => {
    api.news.list(activeCategory === '全部' ? undefined : activeCategory).then(data => {
      setNews(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [activeCategory])

  if (loading) {
    return (
      <section id="news" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-400 py-20">加载资讯数据...</div>
      </section>
    )
  }

  return (
    <section id="news" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-8 bg-[#0F6637] rounded-full"/>
            <h2 className="text-2xl md:text-3xl font-bold text-[#333]">行业资讯</h2>
          </div>
          <button className="text-sm text-[#0F6637] border border-[#0F6637] px-4 py-2 rounded hover:bg-[#e8f5ec] transition-colors">
            查看全部 →
          </button>
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 flex-wrap mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-[#0F6637] text-white'
                  : 'border border-gray-200 text-gray-500 hover:border-[#0F6637] hover:text-[#0F6637]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 新闻卡片 */}
        {news.length === 0 ? (
          <div className="text-center text-gray-400 py-20">暂无资讯</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map((item) => (
              <div key={item.id} className="news-card bg-[#F8F8F5] rounded-xl overflow-hidden border border-gray-100 cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-[#e8f5ec] to-[#c8e6d4] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 320 160" className="w-full h-full">
                      {[...Array(4)].map((_, i) => (
                        <rect key={i} x={i * 80} y="0" width="78" height="160" fill="white" opacity="0.3"/>
                      ))}
                      <path d="M0 80 Q80 40 160 80 Q240 120 320 80" stroke="#0F6637" strokeWidth="3" fill="none" opacity="0.3"/>
                    </svg>
                  </div>
                  <div className="relative z-10 text-center">
                    <div className="text-4xl mb-1">
                      {item.category === '安装教程' ? '🔧' :
                       item.category === '行业科普' ? '📚' :
                       item.category === '工厂资讯' ? '🏭' :
                       item.category === '建材标准' ? '📋' :
                       item.category === '改造知识' ? '🏠' : '📰'}
                    </div>
                    <div className="bg-[#0F6637] text-white text-xs px-2 py-0.5 rounded-full">{item.category}</div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-2 text-xs text-gray-400">
                    <span>{item.created_at?.split(' ')[0] || ''}</span>
                    <span>阅读约{item.read_time} · {item.views}次浏览</span>
                  </div>
                  <h3 className="font-bold text-[#333] text-sm leading-snug mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">{item.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(item.tags) ? item.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">
                        #{tag}
                      </span>
                    )) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEO关键词锚点 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400 text-center">
            相关搜索：包覆式密封条 · 门窗密封条 · 断桥铝密封胶条 · 自贴式密封条 · 卡槽式密封条 · 门窗厂密封材料 ·
            门窗密封条更换 · 阳光房密封条 · 断桥铝加厚密封条 · 门窗隔音密封条工厂 · 本地门窗密封工程配套
          </p>
        </div>
      </div>
    </section>
  )
}
