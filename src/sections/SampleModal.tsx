import { useState } from 'react'
import { api } from '../api'

interface SampleModalProps {
  onClose: () => void
}

export default function SampleModal({ onClose }: SampleModalProps) {
  const [form, setForm] = useState({ name: '', phone: '', company: '', address: '', product: '', note: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.samples.submit(form)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="bg-[#0F6637] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">申请免费寄样</h3>
            <p className="text-green-200 text-xs mt-0.5">新客专属 · 免费包邮 · 先试后买</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h4 className="text-xl font-bold text-[#0F6637] mb-2">申请提交成功！</h4>
            <p className="text-gray-600 text-sm mb-1">我们将在<strong>1个工作日内</strong>审核并发货</p>
            <p className="text-gray-600 text-sm mb-4">发货后将短信通知您快递单号</p>
            <div className="bg-[#e8f5ec] rounded-xl p-4 text-left text-sm">
              <div className="font-semibold text-[#0F6637] mb-2">温馨提示：</div>
              <ul className="space-y-1 text-gray-600 text-xs">
                <li>• 样品为工厂标准规格，可充分体现产品品质</li>
                <li>• 如需特定规格样品，请添加微信备注</li>
                <li>• 批量采购可享受进一步折扣，欢迎咨询</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-[#0F6637] text-white py-3 rounded-lg font-bold hover:bg-[#1a7a42] transition-colors"
            >
              知道了
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="您的姓名"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">手机号 *</label>
                <input
                  type="tel"
                  required
                  placeholder="联系手机号"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">公司/店铺名称</label>
              <input
                type="text"
                placeholder="门窗厂/装修公司/个人（可选）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">收货地址 *</label>
              <input
                type="text"
                required
                placeholder="省市区 + 详细地址"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">意向产品</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
                value={form.product}
                onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
              >
                <option value="">全系产品各取一段（默认）</option>
                <option>自贴式包覆密封条</option>
                <option>卡槽式包覆密封条</option>
                <option>断桥铝门窗密封条</option>
                <option>阳光房专用密封条</option>
                <option>木门隔音密封条</option>
                <option>推拉门密封胶条</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">备注（规格/颜色需求）</label>
              <textarea
                rows={2}
                placeholder="如有特殊规格、颜色要求请填写（可选）"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637] resize-none"
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              />
            </div>

            {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}

            <div className="bg-[#f5faf7] rounded-lg p-3 text-xs text-gray-500 flex gap-2">
              <span>💡</span>
              <span>样品免费包邮寄出，无需任何费用。对品质满意后再考虑批量合作，没有任何购买压力。</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0F6637] text-white py-3.5 rounded-xl font-black text-base hover:bg-[#1a7a42] transition-colors disabled:opacity-50"
            >
              {submitting ? '提交中...' : '立即申请免费寄样'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
