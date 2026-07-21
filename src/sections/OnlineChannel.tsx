import { useEffect, useState } from 'react'
import { useSettings } from '../lib/settings'
import { api } from '../api'

interface OnlineChannelProps {
  onSampleClick: () => void
}

const purchasePolicies = [
  { icon: '🎁', title: '新客免费寄样', desc: '首次合作，免费提供样品，亲测品质再下单，零风险采购' },
  { icon: '📉', title: '阶梯批量底价', desc: '100米/500米/1000米/5000米以上，每档均有专属底价折扣' },
  { icon: '🏷️', title: '长期经销折扣', desc: '认证经销商享受专属折扣+返利，区域独家保护' },
  { icon: '📦', title: '无起订量拿货', desc: '1米起拍，无最低要求，适合个人散客和小门店试销' },
]

const afterSaleServices = [
  { icon: '⏰', title: '7×16小时客服在线', desc: '工作日全天在线，周末部分时段值班，快速响应采购需求' },
  { icon: '📡', title: '发货实时追踪', desc: '下单后48小时内发货，物流单号实时同步，全程可追踪' },
  { icon: '🔄', title: '质量问题包退换', desc: '收货验货，如有质量问题7天内无条件退换，全程兜底' },
]

const channelComplement = [
  { icon: '💬', title: '微信定制报价', desc: '扫码添加微信，专属报价，工程定制方案快速出具' },
  { icon: '🤝', title: '工程合作洽谈', desc: '对公采购，签订合作协议，含税开票，专项服务' },
  { icon: '📱', title: '抖音查看实测', desc: '视频号实拍工厂+产品性能测试，看到真实效果再下单' },
]

export default function OnlineChannel({ onSampleClick }: OnlineChannelProps) {
  const settings = useSettings()
  const [pddQr, setPddQr] = useState('')
  useEffect(() => {
    let alive = true
    api.qrCodes.list()
      .then((list: any[]) => {
        if (!alive) return
        const hit = Array.isArray(list) ? list.find((q: any) => q.type === 'pdd') : null
        if (hit && hit.image_url) setPddQr(hit.image_url)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <section id="channel" className="py-16 bg-[#0a3d1f]">
      <div className="max-w-7xl mx-auto px-6">
        {/* 标题区 */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-0.5 bg-[#7ecfa0]"/>
            <span className="text-[#7ecfa0] text-sm font-semibold tracking-widest uppercase">Online Channel</span>
            <div className="w-8 h-0.5 bg-[#7ecfa0]"/>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            线上采购通道｜拼多多工厂直营店
          </h2>
          <p className="text-green-300 mt-2 text-sm">源头直供 · 无中间商 · 最低出厂价 · 可一件代发</p>
        </div>

        {/* 拼多多大入口 */}
        <div className="bg-gradient-to-r from-[#e4323c] to-[#c8282f] rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="90" fill="white"/>
              <circle cx="100" cy="100" r="60" fill="none" stroke="white" strokeWidth="5"/>
              <path d="M60 100 Q80 70 100 100 Q120 130 140 100" stroke="white" strokeWidth="5" fill="none"/>
            </svg>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">🛒</span>
                <div>
                  <div className="text-white text-xl font-black">拼多多工厂直营旗舰店</div>
                  <div className="text-red-200 text-sm">盛安密封 · 源头工厂 · 无中间商</div>
                </div>
              </div>
              <ul className="space-y-1.5 mb-5">
                {[
                  '现货充足，48小时内发货，全国包邮',
                  '1米起拍，无最低起订量，适合散户散件采购',
                  '工厂直营价，比经销商低20-40%',
                  '7天无理由退换，质量有保障',
                  '支持一件代发，微商/电商可长期合作',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-white text-sm">
                    <span className="text-red-300">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={settings.pdd_link || 'https://mobile.yangkeduo.com'}
                target="_blank"
                rel="noopener noreferrer"
                data-pdd-btn="channel-main"
                className="inline-flex items-center gap-2 bg-white text-[#e4323c] px-8 py-3 rounded-lg font-black text-base hover:bg-red-50 transition-colors shadow-lg"
              >
                🛒 立即进入拼多多工厂店
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            {/* 拼多多二维码模拟 */}
            <div className="flex-shrink-0 bg-white rounded-xl p-4 text-center shadow-xl">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2 relative overflow-hidden">
                {pddQr ? (
                  <img src={pddQr} alt="拼多多店铺二维码" className="w-full h-full object-contain" />
                ) : (
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  {/* 二维码模拟 */}
                  <rect width="120" height="120" fill="white"/>
                  {/* 三个定位图案 */}
                  <rect x="5" y="5" width="35" height="35" fill="none" stroke="#333" strokeWidth="4"/>
                  <rect x="12" y="12" width="21" height="21" fill="#333"/>
                  <rect x="80" y="5" width="35" height="35" fill="none" stroke="#333" strokeWidth="4"/>
                  <rect x="87" y="12" width="21" height="21" fill="#333"/>
                  <rect x="5" y="80" width="35" height="35" fill="none" stroke="#333" strokeWidth="4"/>
                  <rect x="12" y="87" width="21" height="21" fill="#333"/>
                  {/* 数据模块 */}
                  {[...Array(20)].map((_, i) => (
                    <rect
                      key={i}
                      x={47 + (i % 5) * 11}
                      y={5 + Math.floor(i / 5) * 11}
                      width="8" height="8"
                      fill={Math.random() > 0.5 ? '#333' : 'transparent'}
                    />
                  ))}
                  {[...Array(15)].map((_, i) => (
                    <rect
                      key={i}
                      x={47 + (i % 3) * 12}
                      y={80 + Math.floor(i / 3) * 11}
                      width="9" height="9"
                      fill={[1,0,1,0,1,1,0,1,0,1,1,0,1,0,1][i] ? '#333' : 'transparent'}
                    />
                  ))}
                </svg>
                )}
              </div>
              <div className="text-xs text-gray-600 font-semibold">扫码进店</div>
              <div className="text-xs text-gray-400 mt-0.5">拼多多工厂直营店</div>
            </div>
          </div>
        </div>

        {/* 采购政策 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#7ecfa0] rounded-full inline-block"/>
              线上采购政策
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {purchasePolicies.map(p => (
                <div key={p.title} className="bg-white/10 rounded-xl p-4 flex gap-3 hover:bg-white/15 transition-colors">
                  <span className="text-2xl flex-shrink-0">{p.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{p.title}</div>
                    <div className="text-green-300 text-xs mt-0.5 leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#7ecfa0] rounded-full inline-block"/>
              线上售后保障
            </h3>
            <div className="grid grid-cols-1 gap-3 mb-4">
              {afterSaleServices.map(s => (
                <div key={s.title} className="bg-white/10 rounded-xl p-4 flex gap-3 hover:bg-white/15 transition-colors">
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{s.title}</div>
                    <div className="text-green-300 text-xs mt-0.5 leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#7ecfa0] rounded-full inline-block"/>
              渠道互补服务
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {channelComplement.map(c => (
                <div key={c.title} className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/15 transition-colors cursor-pointer">
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-white font-semibold text-xs">{c.title}</div>
                  <div className="text-green-400 text-[10px] mt-0.5 leading-tight">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部免费寄样 */}
        <div className="bg-[#7ecfa0]/20 border border-[#7ecfa0]/40 rounded-xl p-6 text-center">
          <h3 className="text-white text-xl font-bold mb-2">📦 新客专属·免费寄样试用</h3>
          <p className="text-green-300 text-sm mb-4">
            首次合作，无需任何费用，直接寄送样品，亲测效果满意再批量采购，零风险尝试
          </p>
          <button
            onClick={onSampleClick}
            className="bg-[#7ecfa0] text-[#0a3d1f] px-8 py-3 rounded-lg font-black text-base hover:bg-green-300 transition-colors"
          >
            立即申请免费寄样
          </button>
        </div>
      </div>
    </section>
  )
}
