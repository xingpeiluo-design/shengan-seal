import { useState, useEffect } from 'react'
import { api } from '../api'

interface ContactFooterProps {
  onSampleClick: () => void
}

interface FormData {
  name: string
  company: string
  need: string
  phone: string
  product: string
}

interface Settings {
  [key: string]: string
}

export default function ContactFooter({ onSampleClick }: ContactFooterProps) {
  const [form, setForm] = useState<FormData>({ name: '', company: '', need: '', phone: '', product: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState<Settings>({})

  useEffect(() => {
    api.settings.list().then(setSettings).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.messages.submit({
        ...form,
        source: 'contact',
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer id="contact" className="bg-[#0a3d1f]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white">联系我们</h2>
          <p className="text-green-300 mt-2 text-sm">专业团队待命，快速回复您的采购需求</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：公司信息 */}
          <div className="text-white">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#7ecfa0] rounded-full"/>
              公司信息
            </h3>
            <div className="space-y-3 text-sm text-green-200">
              <div className="flex gap-2">
                <span className="text-[#7ecfa0] flex-shrink-0">🏢</span>
                <div>
                  <div className="font-semibold text-white">{settings.company_name || '长沙盛安密封科技有限公司'}</div>
                  <div className="text-xs mt-0.5">（{settings.company_name_en || 'Changsha Shengan Sealing Technology Co., Ltd.'}）</div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-[#7ecfa0] flex-shrink-0">📍</span>
                <div>
                  <div>厂区地址：{settings.address || '湖南省长沙市长沙县'}</div>
                  <button className="text-xs text-[#7ecfa0] mt-1 hover:underline">
                    预约参观工厂 →
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-[#7ecfa0] flex-shrink-0">📞</span>
                <div>
                  <div className="font-semibold text-white">{settings.hotline || '13507402179'}（电话/微信·罗生）</div>
                  <div className="text-xs mt-0.5">{settings.factory_phone || '0731-86869145'}（座机）</div>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="text-[#7ecfa0] flex-shrink-0">⏰</span>
                <div>工作时间：{settings.work_hours || '周一至周六 8:00-18:00'}</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-white font-semibold text-sm mb-3">快速导航</h4>
              <div className="grid grid-cols-2 gap-1 text-xs text-green-300">
                {[
                  ['首页', '#home'], ['产品中心', '#products'],
                  ['核心技术', '#tech'], ['性能检测', '#performance'],
                  ['工厂实力', '#factory'], ['工程案例', '#cases'],
                  ['线上采购', '#channel'], ['行业资讯', '#news'],
                ].map(([label, href]) => (
                  <a key={label} href={href} className="hover:text-white transition-colors">
                    · {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 中间：快捷入口 */}
          <div className="text-white text-center">
            <h3 className="font-bold text-base mb-4 flex items-center gap-2 justify-center">
              <span className="w-1 h-5 bg-[#7ecfa0] rounded-full"/>
              快捷联系 / 进店
            </h3>

            {/* 拼多多入口 */}
            <a
              href={settings.pdd_link || 'https://mobile.yangkeduo.com'}
              target="_blank"
              rel="noopener noreferrer"
              data-pdd-btn="footer"
              className="block bg-[#e4323c] text-white py-3 px-6 rounded-xl font-bold hover:bg-[#c8282f] transition-colors"
            >
              🛒 拼多多工厂店 · 立即进店
            </a>
            <button
              onClick={onSampleClick}
              className="mt-3 block w-full bg-[#7ecfa0] text-[#0a3d1f] py-3 px-6 rounded-xl font-bold hover:bg-green-300 transition-colors"
            >
               申请免费寄样
            </button>
            <div className="mt-4 text-xs text-green-300 space-y-1">
              <div>微信客服：13507402179（罗生）</div>
              <div>座机：0731-86869145</div>
            </div>
          </div>

          {/* 右侧：在线留言 */}
          <div>
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#7ecfa0] rounded-full"/>
              在线留言
            </h3>
            {submitted ? (
              <div className="bg-[#0F6637]/50 border border-[#7ecfa0] rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">✅</div>
                <div className="text-white font-bold mb-2">留言提交成功！</div>
                <div className="text-green-300 text-sm">我们将在2小时内联系您，请保持电话畅通。</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="您的姓名 *"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-green-400 text-sm focus:outline-none focus:border-[#7ecfa0]"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="店铺/工厂/公司名称"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-green-400 text-sm focus:outline-none focus:border-[#7ecfa0]"
                  value={form.company}
                  onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                />
                <select
                  className="w-full bg-[#0a3d1f] border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#7ecfa0]"
                  value={form.product}
                  onChange={e => setForm(prev => ({ ...prev, product: e.target.value }))}
                >
                  <option value="">意向密封条款式（可选）</option>
                  <option>自贴式包覆密封条</option>
                  <option>卡槽式包覆密封条</option>
                  <option>断桥铝门窗密封条</option>
                  <option>阳光房专用密封条</option>
                  <option>木门隔音密封条</option>
                  <option>推拉门密封胶条</option>
                  <option>OEM/定制需求</option>
                </select>
                <textarea
                  placeholder="采购需求描述（用量、规格、用途等）"
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-green-400 text-sm focus:outline-none focus:border-[#7ecfa0] resize-none"
                  value={form.need}
                  onChange={e => setForm(prev => ({ ...prev, need: e.target.value }))}
                />
                <input
                  type="tel"
                  placeholder="联系电话 *"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-green-400 text-sm focus:outline-none focus:border-[#7ecfa0]"
                  value={form.phone}
                  onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                />
                {error && <div className="text-red-300 text-xs bg-red-900/30 p-2 rounded">{error}</div>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#7ecfa0] text-[#0a3d1f] py-3 rounded-lg font-black text-sm hover:bg-green-300 transition-colors disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交留言，等待快速回复'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 底部版权栏 */}
      <div className="border-t border-white/10 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-green-400">
          <div className="flex items-center gap-4">
            <span>{settings.copyright || '© 2024-2026 长沙盛安密封科技有限公司 版权所有'}</span>
            {settings.icp && settings.icp !== '浙ICP备XXXXXXXX号' && (
              <>
                <span className="hidden md:inline">|</span>
                <span className="text-green-500">备案号：{settings.icp}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-green-600">隐私政策</span>
            <span className="text-green-800">|</span>
            <span className="text-green-600">使用条款</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
