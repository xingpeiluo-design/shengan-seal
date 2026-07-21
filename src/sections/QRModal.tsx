import { useEffect, useState } from 'react'
import { api } from '../api'

interface QRModalProps {
  type: 'wechat' | 'douyin'
  onClose: () => void
}

export default function QRModal({ type, onClose }: QRModalProps) {
  const isWechat = type === 'wechat'
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    let alive = true
    api.qrCodes.list()
      .then((list: any[]) => {
        if (!alive) return
        const hit = Array.isArray(list) ? list.find((q: any) => q.type === type) : null
        if (hit && hit.image_url) setImageUrl(hit.image_url)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [type])

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-72 overflow-hidden">
        <div
          className="px-5 py-4 text-white text-center"
          style={{ backgroundColor: isWechat ? '#0F6637' : '#333' }}
        >
          <div className="text-lg font-bold">
            {isWechat ? '💬 微信客服' : '📱 抖音视频号'}
          </div>
          <div className="text-xs mt-0.5 opacity-80">
            {isWechat ? '定制报价 · 工程合作 · 批量采购咨询' : '工厂实拍 · 产品性能测试 · 安装教程'}
          </div>
        </div>

        <div className="p-6 text-center">
          {/* 二维码 */}
          <div className="w-48 h-48 mx-auto bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-3 mb-4">
            {imageUrl ? (
              <img src={imageUrl} alt={isWechat ? '微信二维码' : '抖音二维码'} className="w-full h-full object-contain" />
            ) : (
              <svg viewBox="0 0 160 160" className="w-full h-full">
                <rect width="160" height="160" fill="white"/>
                {/* 定位图案-左上 */}
                <rect x="8" y="8" width="50" height="50" fill="none" stroke="#333" strokeWidth="5"/>
                <rect x="18" y="18" width="30" height="30" fill="#333"/>
                {/* 定位图案-右上 */}
                <rect x="102" y="8" width="50" height="50" fill="none" stroke="#333" strokeWidth="5"/>
                <rect x="112" y="18" width="30" height="30" fill="#333"/>
                {/* 定位图案-左下 */}
                <rect x="8" y="102" width="50" height="50" fill="none" stroke="#333" strokeWidth="5"/>
                <rect x="18" y="112" width="30" height="30" fill="#333"/>
                {/* 数据区域 */}
                {(isWechat ? [1,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1,0,1,0,1,1,0] : [0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,1,0,0,1,0,1,0,0,1]).map((v, i) => (
                  v ? <rect key={i} x={70 + (i % 6) * 14} y={8 + Math.floor(i / 6) * 14} width="11" height="11" fill="#333"/> : null
                ))}
                {[1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1,0,1].map((v, i) => (
                  v ? <rect key={i} x={70 + (i % 6) * 14} y={92 + Math.floor(i / 6) * 14} width="11" height="11" fill="#333"/> : null
                ))}
                {/* 中心logo */}
                <rect x="68" y="68" width="24" height="24" rx="4" fill={isWechat ? '#0F6637' : '#333'}/>
                <text x="80" y="84" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
                  {isWechat ? 'W' : 'D'}
                </text>
              </svg>
            )}
          </div>

          <div className="text-sm font-semibold text-gray-700 mb-1">
            {isWechat ? '长按识别 · 添加企业微信' : '长按识别 · 关注视频号'}
          </div>
          <div className="text-xs text-gray-400 mb-4">
            {isWechat
              ? '工作时间 8:00-18:00，快速响应'
              : '实拍视频 · 安装演示 · 工厂参观'}
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-colors"
            style={{ backgroundColor: isWechat ? '#0F6637' : '#333' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
