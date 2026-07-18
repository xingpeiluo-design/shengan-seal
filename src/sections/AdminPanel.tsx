import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api'

interface ToastMsg {
  id: number
  type: 'success' | 'error' | 'info'
  text: string
}

// ============ Toast 轻提示 ============
function ToastView({ msgs }: { msgs: ToastMsg[] }) {
  if (msgs.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {msgs.map(m => (
        <div
          key={m.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white animate-fade-in-down pointer-events-auto ${
            m.type === 'success' ? 'bg-green-600' : m.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {m.text}
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [msgs, setMsgs] = useState<ToastMsg[]>([])
  const idRef = useRef(0)
  const push = useCallback((type: ToastMsg['type'], text: string, ttl = 3500) => {
    idRef.current += 1
    const id = idRef.current
    setMsgs(prev => [...prev, { id, type, text }])
    setTimeout(() => setMsgs(prev => prev.filter(m => m.id !== id)), ttl)
  }, [])
  return { msgs, push, success: (t: string) => push('success', t), error: (t: string) => push('error', t), info: (t: string) => push('info', t) }
}

// 触发浏览器下载 blob
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// 导出按钮封装：支持 products / news / messages / samples
function ExportImportButtons({ type, onSuccess, toast }: {
  type: 'products' | 'news' | 'messages' | 'samples'
  onSuccess: () => void
  toast: ReturnType<typeof useToast>
}) {
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const TYPE_LABEL: Record<typeof type, string> = {
    products: '产品', news: '资讯', messages: '留言', samples: '寄样申请',
  }
  const label = TYPE_LABEL[type]

  const handleExport = async () => {
    try {
      let blob: Blob
      switch (type) {
        case 'products': blob = await api.admin.exportProducts(); break
        case 'news': blob = await api.admin.exportNews(); break
        case 'messages': blob = await api.admin.exportMessages(); break
        case 'samples': blob = await api.admin.exportSampleRequests(); break
      }
      const today = new Date().toISOString().slice(0, 10)
      const fname = `${type}_${today}.zip`
      downloadBlob(blob, fname)
      toast.success('已生成导出文件，正在下载')
    } catch (e: any) {
      toast.error(e.message || '导出失败')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm(`确定从「${file.name}」导入${label}吗？\n同名项会被跳过。`)) {
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    setImporting(true)
    try {
      let result: any
      switch (type) {
        case 'products': result = await api.admin.importProducts(file); break
        case 'news': result = await api.admin.importNews(file); break
        case 'messages': result = await api.admin.importMessages(file); break
        case 'samples': result = await api.admin.importSampleRequests(file); break
      }
      if (result.ok) {
        toast.success(`导入成功：新增 ${result.inserted} 条${result.errors?.length ? `，失败 ${result.errors.length} 条` : ''}`)
        onSuccess()
      } else {
        toast.error(result.error || '导入失败')
      }
    } catch (e: any) {
      toast.error(e.message || '导入失败')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.zip"
        onChange={handleImport}
        className="hidden"
        data-testid={`import-${type}-input`}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="border border-[#0F6637] text-[#0F6637] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#e8f5ec] transition-colors disabled:opacity-50"
      >
        {importing ? '导入中...' : '📥 导入'}
      </button>
      <button
        onClick={handleExport}
        data-testid={`export-${type}`}
        className="border border-[#0F6637] text-[#0F6637] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#e8f5ec] transition-colors"
      >
        📤 导出全部
      </button>
    </div>
  )
}

interface AdminPanelProps {
  onBack: () => void
}

type AdminTab = 'dashboard' | 'products' | 'news' | 'messages' | 'samples' | 'settings' | 'security'

// ============ 登录页面 ============
function LoginPage({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' })
  const [error, setError] = useState('')
  const [errorExtra, setErrorExtra] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorExtra('')
    try {
      const data = await api.auth.login(loginForm.user, loginForm.pass)
      if (data.role) localStorage.setItem('admin_role', data.role)
      if (data.user) localStorage.setItem('admin_username', data.user)
      onLogin()
    } catch (err: any) {
      setError(err.message || '登录失败')
      if (err.locked && err.remaining_minutes) {
        setErrorExtra(`账号已锁定，还需等待 ${err.remaining_minutes} 分钟`)
      } else if (err.remaining_attempts !== undefined) {
        setErrorExtra(`连续5次错误将锁定账号30分钟`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a3d1f] to-[#0F6637] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#0F6637] px-6 py-5 text-center">
          <div className="text-white text-xl font-bold">盛安密封 · 管理后台</div>
          <div className="text-green-200 text-sm mt-1">Shengan Seal CMS</div>
        </div>
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">管理员账号</label>
            <input
              type="text"
              placeholder="请输入账号"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
              value={loginForm.user}
              onChange={e => setLoginForm(p => ({ ...p, user: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#0F6637]"
              value={loginForm.pass}
              onChange={e => setLoginForm(p => ({ ...p, pass: e.target.value }))}
            />
          </div>
          {error && (
            <div className="text-red-500 text-xs bg-red-50 p-2 rounded space-y-0.5">
              <div>{error}</div>
              {errorExtra && <div className="text-red-400">{errorExtra}</div>}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F6637] text-white py-3 rounded-lg font-bold hover:bg-[#1a7a42] transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录管理后台'}
          </button>
          <div className="text-xs text-gray-400 text-center">初次使用请联系超级管理员获取账号</div>
        </form>
        <button
          onClick={onBack}
          className="w-full text-center text-xs text-gray-400 py-3 hover:text-gray-600 border-t border-gray-100"
        >
          ← 返回官网前台
        </button>
      </div>
    </div>
  )
}

// ============ 主面板 ============
export default function AdminPanel({ onBack }: AdminPanelProps) {
  const [loginOk, setLoginOk] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const [currentRole, setCurrentRole] = useState<string>('admin')
  const [currentUsername, setCurrentUsername] = useState<string>('')
  const toast = useToast()

  useEffect(() => {
    api.auth.verify().then(valid => {
      setLoginOk(valid)
      setAuthChecked(true)
    })
  }, [])

  useEffect(() => {
    if (loginOk) {
      // 登录成功后从 localStorage 读取用户信息
      const role = localStorage.getItem('admin_role') || 'admin'
      const username = localStorage.getItem('admin_username') || ''
      setCurrentRole(role)
      setCurrentUsername(username)
    }
  }, [loginOk])

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">验证登录状态...</div>
  }

  if (!loginOk) {
    return <LoginPage onLogin={() => setLoginOk(true)} onBack={onBack} />
  }

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: '控制台', icon: '📊' },
    { key: 'products', label: '产品管理', icon: '📦' },
    { key: 'news', label: '资讯管理', icon: '📰' },
    { key: 'messages', label: '留言管理', icon: '✉️' },
    { key: 'samples', label: '寄样申请', icon: '📦' },
    { key: 'settings', label: '渠道设置', icon: '⚙️' },
    ...(currentRole === 'super_admin' ? [{ key: 'security' as AdminTab, label: '账号与安全', icon: '🛡️' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 侧边菜单 */}
      <div className="w-52 bg-[#0a3d1f] flex-shrink-0 flex flex-col">
        <div className="px-4 py-5 border-b border-white/10">
          <div className="text-white font-bold text-base">盛安密封</div>
          <div className="text-green-400 text-xs mt-0.5">管理后台 v2.0</div>
          <div className="text-green-300 text-xs mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
            <span className="truncate">{currentUsername}</span>
            {currentRole === 'super_admin' && <span className="text-yellow-300">（超管）</span>}
          </div>
        </div>
        <nav className="flex-1 py-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#0F6637] text-white font-semibold'
                  : 'text-green-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => {
            localStorage.removeItem('admin_role')
            localStorage.removeItem('admin_username')
            api.auth.logout()
            onBack()
          }}
          className="px-4 py-3 text-green-400 hover:text-white text-xs border-t border-white/10 flex items-center gap-2"
        >
          ← 退出登录
        </button>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'news' && <NewsView />}
        {activeTab === 'messages' && <MessagesView />}
        {activeTab === 'samples' && <SamplesView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'security' && <SecurityView currentUsername={currentUsername} toast={toast} />}
      </div>
    </div>
  )
}

// ============ 控制台 ============
function DashboardView() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.admin.getStats().then(setStats).catch(() => {})
  }, [])

  if (!stats) return <div className="text-gray-400">加载中...</div>

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">控制台概览</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: '今日留言', value: stats.today_messages, sub: `待跟进 ${stats.pending_messages} 条`, color: '#e4323c' },
          { label: '今日寄样申请', value: stats.today_samples, sub: `待处理 ${stats.pending_samples} 条`, color: '#f59e0b' },
          { label: '总留言量', value: stats.total_messages, sub: '历史累计', color: '#0F6637' },
          { label: '总寄样申请', value: stats.total_samples, sub: '历史累计', color: '#1a7a42' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-gray-500 text-sm">{item.label}</div>
            <div className="text-3xl font-black mt-1" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs text-gray-400 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">系统说明</h3>
        <ul className="text-xs text-gray-500 space-y-1.5">
          <li>✅ 产品管理：新增/修改/删除产品，前台实时同步</li>
          <li>✅ 资讯管理：发布/编辑行业资讯，前台实时同步</li>
          <li>✅ 留言管理：查看客户真实留言，标记跟进状态</li>
          <li>✅ 寄样申请：查看寄样申请，标记处理状态</li>
          <li>✅ 渠道设置：修改拼多多链接、联系方式等，前台实时同步</li>
          <li>✅ 数据持久化：所有数据存储在 SQLite 数据库，刷新不丢失</li>
        </ul>
      </div>
    </div>
  )
}

// ============ 产品管理 ============
function ProductsView() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  const load = useCallback(() => {
    api.admin.getProducts().then(data => { setProducts(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这个产品吗？')) return
    await api.admin.deleteProduct(id)
    load()
  }

  const handleSave = async (data: any) => {
    if (editing?.id) {
      await api.admin.updateProduct(editing.id, data)
    } else {
      await api.admin.createProduct(data)
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  if (loading) return <div className="text-gray-400">加载中...</div>

  if (showForm) {
    return <ProductForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />
  }

  return (
    <div>
      <ToastView msgs={toast.msgs} />
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">产品管理</h2>
        <div className="flex items-center gap-2">
          <ExportImportButtons type="products" onSuccess={load} toast={toast} />
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="bg-[#0F6637] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1a7a42] transition-colors"
          >
            + 新增产品
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['产品名称', '分类', '价格', '拼多多链接', '状态', '操作'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{prod.name}</td>
                <td className="px-4 py-3 text-gray-500">{prod.category}</td>
                <td className="px-4 py-3 text-[#0F6637] font-semibold">{prod.price}</td>
                <td className="px-4 py-3 text-xs text-blue-500 truncate max-w-[200px]">{prod.pdd_link}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${prod.status === '上架' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {prod.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(prod); setShowForm(true) }} className="text-xs text-blue-500 hover:underline">编辑</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={() => handleDelete(prod.id)} className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    short_name: initial?.short_name || '',
    category: initial?.category || '',
    badge: initial?.badge || '',
    badge_color: initial?.badge_color || '#0F6637',
    description: initial?.description || '',
    highlights: Array.isArray(initial?.highlights) ? initial.highlights.join('\n') : (initial?.highlights || ''),
    use_cases: Array.isArray(initial?.use_cases) ? initial.use_cases.join('\n') : (initial?.use_cases || ''),
    specs: JSON.stringify(initial?.specs || [], null, 2),
    bg_color: initial?.bg_color || '#f0f9f4',
    border_color: initial?.border_color || '#0F6637',
    price: initial?.price || '',
    stock: initial?.stock || '充足',
    pdd_link: initial?.pdd_link || 'https://mobile.yangkeduo.com',
    status: initial?.status || '上架',
    sort_order: initial?.sort_order || 0,
    image_url: initial?.image_url || '',
    gallery_images: (initial?.gallery_images || []) as string[],
    detail_images: (initial?.detail_images || []) as string[],
  })
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  // 上传图片（单张/多张）
  const MAX_SIZE = 20 * 1024 * 1024 // 20MB
  const handleUpload = async (files: FileList, target: 'image_url' | 'gallery_images' | 'detail_images') => {
    if (!files.length) return
    const oversized = Array.from(files).filter(f => f.size > MAX_SIZE)
    if (oversized.length) {
      alert(`以下文件超过 20MB，请压缩后再上传：\n${oversized.map(f => `${f.name}（${(f.size / 1024 / 1024).toFixed(1)}MB）`).join('\n')}`)
      return
    }
    setUploading(true)
    try {
      const fileArr = Array.from(files)
      if (target === 'image_url') {
        const res = await api.admin.uploadImage(fileArr[0])
        setForm(p => ({ ...p, image_url: res.urls?.[0] || res.url }))
      } else {
        const res = await api.admin.uploadImages(fileArr)
        const newUrls: string[] = res.urls || [res.url]
        setForm(p => ({
          ...p,
          [target]: [...(p[target] as string[]), ...newUrls],
        }))
      }
    } catch (err: any) {
      alert('上传失败: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (target: 'gallery_images' | 'detail_images', index: number) => {
    setForm(p => ({
      ...p,
      [target]: (p[target] as string[]).filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...form,
        highlights: form.highlights.split('\n').filter(Boolean),
        use_cases: form.use_cases.split('\n').filter(Boolean),
        specs: JSON.parse(form.specs),
        sort_order: Number(form.sort_order),
      }
      onSave(data)
    } catch {
      setError('规格参数 JSON 格式错误，请检查')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">{initial?.id ? '编辑产品' : '新增产品'}</h2>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">← 返回列表</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-5 max-w-3xl">
        {/* 基础信息 */}
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📝 基础信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">产品名称（拼多多标题） *</label>
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">官网短名（卡片标题）</label>
              <input value={form.short_name} onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))}
                placeholder="如：自粘式密封条·家装通用款"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">分类 *</label>
              <input required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                placeholder="如：拼多多C端·家装散户"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">标签文字</label>
              <input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))}
                placeholder="如：拼多多热销款"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">价格</label>
              <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="如：¥2.8/米起"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
          </div>
        </div>

        {/* 图片管理 */}
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🖼️ 产品图片</h3>

          {/* 主图 */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">产品主图（列表封面）</label>
            <div className="text-xs text-gray-400 mb-2">支持 JPG / PNG / WebP / GIF 格式，单张不超过 20MB</div>
            <div className="flex items-start gap-3">
              {form.image_url && (
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img src={form.image_url} alt="主图" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-[#0F6637] hover:text-[#0F6637] transition-colors">
                {uploading ? '上传中...' : '点击上传主图'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                  onChange={e => handleUpload(e.target.files!, 'image_url')} disabled={uploading} />
              </label>
            </div>
            <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
              placeholder="或手动输入图片路径" className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#0F6637]" />
          </div>

          {/* 轮播图 */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-600 mb-1 block">轮播主图（详情页画廊，可多选）</label>
            <div className="text-xs text-gray-400 mb-2">支持 JPG / PNG / WebP / GIF 格式，单张不超过 20MB</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.gallery_images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage('gallery_images', i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                    删除
                  </button>
                </div>
              ))}
              <label className="cursor-pointer w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:border-[#0F6637] hover:text-[#0F6637] transition-colors">
                {uploading ? '...' : '+添加'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
                  onChange={e => handleUpload(e.target.files!, 'gallery_images')} disabled={uploading} />
              </label>
            </div>
            <div className="text-xs text-gray-400">共 {form.gallery_images.length} 张轮播图</div>
          </div>

          {/* 详情图 */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">详情长图（产品详情区展示，可多选）</label>
            <div className="text-xs text-gray-400 mb-2">支持 JPG / PNG / WebP / GIF 格式，单张不超过 20MB</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.detail_images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage('detail_images', i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                    删除
                  </button>
                </div>
              ))}
              <label className="cursor-pointer w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:border-[#0F6637] hover:text-[#0F6637] transition-colors">
                {uploading ? '...' : '+添加'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden"
                  onChange={e => handleUpload(e.target.files!, 'detail_images')} disabled={uploading} />
              </label>
            </div>
            <div className="text-xs text-gray-400">共 {form.detail_images.length} 张详情图</div>
          </div>
        </div>

        {/* 产品描述 */}
        <div className="border-b border-gray-100 pb-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">📋 产品描述</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">产品描述</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">亮点标签（每行一个）</label>
              <textarea rows={3} value={form.highlights} onChange={e => setForm(p => ({ ...p, highlights: e.target.value }))}
                placeholder="自带德国进口双面胶&#10;免开槽·免打孔"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">使用场景（每行一个）</label>
              <textarea rows={3} value={form.use_cases} onChange={e => setForm(p => ({ ...p, use_cases: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">规格参数（JSON 格式）</label>
              <textarea rows={5} value={form.specs} onChange={e => setForm(p => ({ ...p, specs: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#0F6637]" />
            </div>
          </div>
        </div>

        {/* 其他设置 */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">⚙️ 其他设置</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">拼多多链接</label>
              <input value={form.pdd_link} onChange={e => setForm(p => ({ ...p, pdd_link: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">状态</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]">
                <option>上架</option>
                <option>下架</option>
              </select>
            </div>
          </div>
        </div>

        {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
        <div className="flex gap-3">
          <button type="submit" disabled={uploading} className="bg-[#0F6637] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1a7a42] disabled:opacity-50">
            {uploading ? '图片上传中...' : '保存'}
          </button>
          <button type="button" onClick={onCancel} className="border border-gray-200 px-6 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            取消
          </button>
        </div>
      </form>
    </div>
  )
}

// ============ 资讯管理 ============
function NewsView() {
  const [news, setNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const toast = useToast()

  const load = useCallback(() => {
    api.admin.getNews().then(data => { setNews(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条资讯吗？')) return
    await api.admin.deleteNews(id)
    load()
  }

  const handleSave = async (data: any) => {
    if (editing?.id) {
      await api.admin.updateNews(editing.id, data)
    } else {
      await api.admin.createNews(data)
    }
    setShowForm(false)
    setEditing(null)
    load()
  }

  if (loading) return <div className="text-gray-400">加载中...</div>

  if (showForm) {
    return <NewsForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />
  }

  return (
    <div>
      <ToastView msgs={toast.msgs} />
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">资讯管理</h2>
        <div className="flex items-center gap-2">
          <ExportImportButtons type="news" onSuccess={load} toast={toast} />
          <button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="bg-[#0F6637] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#1a7a42] transition-colors"
          >
            + 发布新资讯
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {news.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="bg-[#e8f5ec] text-[#0F6637] text-xs px-2 py-0.5 rounded-full">{item.category}</span>
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {item.created_at?.split(' ')[0]} · 浏览 {item.views} · {item.published ? '已发布' : '草稿'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(item); setShowForm(true) }} className="text-xs text-blue-500 border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">编辑</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50">删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsForm({ initial, onSave, onCancel }: { initial: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    category: initial?.category || '行业科普',
    summary: initial?.summary || '',
    content: initial?.content || '',
    tags: (initial?.tags || []).join(', '),
    read_time: initial?.read_time || '3分钟',
    published: initial?.published ?? 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...form,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      published: Number(form.published),
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">{initial?.id ? '编辑资讯' : '发布新资讯'}</h2>
        <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">← 返回列表</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4 max-w-2xl">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">标题 *</label>
          <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">分类</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]">
              <option>安装教程</option>
              <option>行业科普</option>
              <option>工厂资讯</option>
              <option>建材标准</option>
              <option>改造知识</option>
              <option>SEO专题</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">阅读时长</label>
            <input value={form.read_time} onChange={e => setForm(p => ({ ...p, read_time: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">状态</label>
            <select value={form.published} onChange={e => setForm(p => ({ ...p, published: Number(e.target.value) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]">
              <option value={1}>发布</option>
              <option value={0}>草稿</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">摘要</label>
          <textarea rows={2} value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">正文内容</label>
          <textarea rows={6} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">标签（逗号分隔）</label>
          <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
            placeholder="安装教程, 自贴式, 旧房改造"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-[#0F6637] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1a7a42]">保存</button>
          <button type="button" onClick={onCancel} className="border border-gray-200 px-6 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
        </div>
      </form>
    </div>
  )
}

// ============ 留言管理 ============
function MessagesView() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const toast = useToast()

  const load = useCallback(() => {
    api.admin.getMessages(filter || undefined).then(data => { setMessages(data); setLoading(false) }).catch(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const toggleStatus = async (id: number, current: string) => {
    const newStatus = current === '待跟进' ? '已跟进' : '待跟进'
    await api.admin.updateMessage(id, { status: newStatus })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条留言吗？')) return
    await api.admin.deleteMessage(id)
    load()
  }

  if (loading) return <div className="text-gray-400">加载中...</div>

  return (
    <div>
      <ToastView msgs={toast.msgs} />
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">客户留言管理</h2>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]">
            <option value="">全部</option>
            <option value="待跟进">待跟进</option>
            <option value="已跟进">已跟进</option>
          </select>
          <ExportImportButtons type="messages" onSuccess={load} toast={toast} />
        </div>
      </div>
      {messages.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">暂无留言</div>
      ) : (
        <div className="space-y-3">
          {messages.map(m => (
            <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm border-l-4" style={{ borderLeftColor: m.status === '待跟进' ? '#e4323c' : '#0F6637' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-gray-800">{m.name}</span>
                    <span className="text-sm text-gray-500">{m.company}</span>
                    <span className="text-sm text-[#0F6637] font-semibold">{m.phone}</span>
                    <span className="text-xs text-gray-400">{m.created_at}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>需求：</strong>{m.need}
                  </div>
                  <div className="text-xs text-gray-400">
                    意向产品：{m.product || '未指定'} · 来源：{m.source === 'contact' ? '联系表单' : m.source}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold text-center ${m.status === '待跟进' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {m.status}
                  </span>
                  <button onClick={() => toggleStatus(m.id, m.status)}
                    className="text-xs text-white bg-[#0F6637] px-2 py-1 rounded-lg hover:bg-[#1a7a42] transition-colors">
                    切换状态
                  </button>
                  <button onClick={() => handleDelete(m.id)}
                    className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ 寄样申请管理 ============
function SamplesView() {
  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = useCallback(() => {
    api.admin.getSamples().then(data => { setSamples(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: number, status: string) => {
    await api.admin.updateSample(id, { status })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这条寄样申请吗？')) return
    await api.admin.deleteSample(id)
    load()
  }

  if (loading) return <div className="text-gray-400">加载中...</div>

  return (
    <div>
      <ToastView msgs={toast.msgs} />
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">寄样申请管理</h2>
        <ExportImportButtons type="samples" onSuccess={load} toast={toast} />
      </div>
      {samples.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">暂无寄样申请</div>
      ) : (
        <div className="space-y-3">
          {samples.map(s => (
            <div key={s.id} className="bg-white rounded-xl p-5 shadow-sm border-l-4" style={{ borderLeftColor: s.status === '待处理' ? '#f59e0b' : '#0F6637' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-gray-800">{s.name}</span>
                    <span className="text-sm text-[#0F6637] font-semibold">{s.phone}</span>
                    {s.company && <span className="text-sm text-gray-500">{s.company}</span>}
                    <span className="text-xs text-gray-400">{s.created_at}</span>
                  </div>
                  {s.address && <div className="text-sm text-gray-600 mb-1"><strong>收货地址：</strong>{s.address}</div>}
                  {s.product && <div className="text-xs text-gray-400 mb-1">意向产品：{s.product}</div>}
                  {s.note && <div className="text-xs text-gray-400">备注：{s.note}</div>}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[#0F6637]">
                    <option value="待处理">待处理</option>
                    <option value="已发货">已发货</option>
                    <option value="已处理">已处理</option>
                  </select>
                  <button onClick={() => handleDelete(s.id)}
                    className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ 渠道设置 ============
function SettingsView() {
  const [settings, setSettings] = useState<any[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.admin.getSettings().then(data => {
      setSettings(data)
      const map: Record<string, string> = {}
      data.forEach((s: any) => { map[s.key] = s.value })
      setValues(map)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.admin.updateSettings(values)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-gray-400">加载中...</div>

  // 按分类分组
  const categories = [...new Set(settings.map(s => s.category))]

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">渠道链接 & 企业信息</h2>
        <button onClick={handleSave} disabled={saving}
          className="bg-[#0F6637] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#1a7a42] disabled:opacity-50">
          {saving ? '保存中...' : saved ? '✅ 已保存' : '保存全部'}
        </button>
      </div>
      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm">
              {cat === 'channel' ? '渠道链接' : cat === 'contact' ? '联系方式' : cat === 'seo' ? 'SEO 设置' : '基础信息'}
            </h3>
            {settings.filter(s => s.category === cat).map(item => (
              <div key={item.key}>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                  {item.label}
                  {item.key === 'icp' && <span className="text-gray-400 font-normal ml-1">（需先到工信部备案后填入，留空不显示）</span>}
                </label>
                <input
                  value={values[item.key] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [item.key]: e.target.value }))}
                  placeholder={item.key === 'icp' ? '如：湘ICP备2026000001号' : ''}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0F6637]"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ 账号与安全 ============
function SecurityView({ currentUsername, toast }: { currentUsername: string; toast: ReturnType<typeof useToast> }) {
  const [subTab, setSubTab] = useState<'users' | 'logs' | 'self'>('users')
  const [users, setUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 新增账号表单
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ username: '', password: '', role: 'admin', remark: '' })

  // 重置密码表单
  const [resetTarget, setResetTarget] = useState<any>(null)
  const [newPwd, setNewPwd] = useState('')

  // 修改自己的密码
  const [selfPwd, setSelfPwd] = useState({ old: '', new: '' })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const list = await api.adminUsers.list()
      setUsers(list)
    } catch (e: any) {
      toast.error(e.message || '加载账号列表失败')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      const list = await api.adminUsers.loginLogs(100)
      setLogs(list)
    } catch (e: any) {
      toast.error(e.message || '加载登录日志失败')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (subTab === 'users') loadUsers()
    if (subTab === 'logs') loadLogs()
  }, [subTab, loadUsers, loadLogs])

  const handleCreate = async () => {
    if (!createForm.username || !createForm.password) {
      toast.error('用户名和密码不能为空')
      return
    }
    if (createForm.password.length < 6) {
      toast.error('密码至少 6 位')
      return
    }
    try {
      await api.adminUsers.create(createForm)
      toast.success(`账号 ${createForm.username} 创建成功`)
      setShowCreate(false)
      setCreateForm({ username: '', password: '', role: 'admin', remark: '' })
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || '创建失败')
    }
  }

  const handleReset = async () => {
    if (!newPwd || newPwd.length < 6) {
      toast.error('新密码至少 6 位')
      return
    }
    try {
      await api.adminUsers.resetPassword(resetTarget.id, newPwd)
      toast.success(`${resetTarget.username} 密码已重置`)
      setResetTarget(null)
      setNewPwd('')
    } catch (e: any) {
      toast.error(e.message || '重置失败')
    }
  }

  const handleToggleStatus = async (u: any) => {
    const newStatus = u.status === 'active' ? 'disabled' : 'active'
    if (!confirm(`确定要${newStatus === 'active' ? '启用' : '禁用'}账号 ${u.username} 吗？`)) return
    try {
      await api.adminUsers.setStatus(u.id, newStatus)
      toast.success(`账号已${newStatus === 'active' ? '启用' : '禁用'}`)
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || '操作失败')
    }
  }

  const handleDelete = async (u: any) => {
    if (!confirm(`确定删除账号 ${u.username} 吗？\n删除后无法恢复！`)) return
    try {
      await api.adminUsers.remove(u.id)
      toast.success('账号已删除')
      loadUsers()
    } catch (e: any) {
      toast.error(e.message || '删除失败')
    }
  }

  const handleChangeSelfPwd = async () => {
    if (!selfPwd.old || !selfPwd.new) {
      toast.error('请填写原密码和新密码')
      return
    }
    if (selfPwd.new.length < 6) {
      toast.error('新密码至少 6 位')
      return
    }
    try {
      await api.auth.changePassword(selfPwd.old, selfPwd.new)
      toast.success('密码修改成功，请下次登录使用新密码')
      setSelfPwd({ old: '', new: '' })
    } catch (e: any) {
      toast.error(e.message || '修改失败')
    }
  }

  return (
    <div className="space-y-4">
      {/* 子标签 */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {[
          { key: 'users' as const, label: '账号列表', icon: '👥' },
          { key: 'logs' as const, label: '登录日志', icon: '📋' },
          { key: 'self' as const, label: '我的密码', icon: '🔑' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              subTab === t.key
                ? 'border-[#0F6637] text-[#0F6637] font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-1">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* 账号列表 */}
      {subTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">管理员账号列表</h2>
              <p className="text-xs text-gray-500 mt-1">超级管理员可管理所有账号；至少保留一个超级管理员</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-[#0F6637] text-white text-sm rounded-lg hover:bg-[#1a7a42]"
            >
              + 新增账号
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">账号</th>
                <th className="px-3 py-2 text-left">角色</th>
                <th className="px-3 py-2 text-left">状态</th>
                <th className="px-3 py-2 text-left">最近登录</th>
                <th className="px-3 py-2 text-left">登录IP</th>
                <th className="px-3 py-2 text-left">备注</th>
                <th className="px-3 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">暂无账号</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">
                    {u.username}
                    {u.username === currentUsername && <span className="ml-2 text-xs text-yellow-600">（我）</span>}
                  </td>
                  <td className="px-3 py-2">
                    {u.role === 'super_admin' ? (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">超级管理员</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">普通管理员</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {u.status === 'active' ? (
                      <span className="text-green-600 text-xs">● 启用</span>
                    ) : (
                      <span className="text-red-500 text-xs">● 禁用</span>
                    )}
                    {u.locked_until && (
                      <div className="text-red-500 text-xs">🔒 锁定至 {u.locked_until}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.last_login_at || '从未登录'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.last_login_ip || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{u.remark || '-'}</td>
                  <td className="px-3 py-2 space-x-1">
                    <button
                      onClick={() => { setResetTarget(u); setNewPwd('') }}
                      className="text-xs text-blue-600 hover:underline"
                    >改密</button>
                    {u.username !== currentUsername && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs hover:underline ${u.status === 'active' ? 'text-orange-600' : 'text-green-600'}`}
                        >
                          {u.status === 'active' ? '禁用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="text-xs text-red-600 hover:underline"
                        >删除</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 登录日志 */}
      {subTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">登录日志（最近 100 条）</h2>
            <p className="text-xs text-gray-500 mt-1">包含所有登录尝试的账号、IP、时间和结果</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">时间</th>
                <th className="px-3 py-2 text-left">账号</th>
                <th className="px-3 py-2 text-left">IP</th>
                <th className="px-3 py-2 text-left">结果</th>
                <th className="px-3 py-2 text-left">原因</th>
                <th className="px-3 py-2 text-left">UA</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">暂无日志</td></tr>
              ) : logs.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{l.created_at}</td>
                  <td className="px-3 py-2">{l.username}</td>
                  <td className="px-3 py-2 text-xs text-gray-500">{l.ip || '-'}</td>
                  <td className="px-3 py-2">
                    {l.success === 1 ? (
                      <span className="text-green-600 text-xs">✓ 成功</span>
                    ) : (
                      <span className="text-red-500 text-xs">✗ 失败</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">{l.reason || '-'}</td>
                  <td className="px-3 py-2 text-xs text-gray-400 truncate max-w-xs" title={l.user_agent}>{l.user_agent || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 修改自己的密码 */}
      {subTab === 'self' && (
        <div className="bg-white rounded-lg shadow-sm p-5 max-w-md">
          <h2 className="text-lg font-bold text-gray-800 mb-1">修改我的密码</h2>
          <p className="text-xs text-gray-500 mb-4">当前账号：<span className="font-semibold">{currentUsername}</span></p>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">原密码</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={selfPwd.old}
                onChange={e => setSelfPwd(p => ({ ...p, old: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">新密码（至少 6 位）</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={selfPwd.new}
                onChange={e => setSelfPwd(p => ({ ...p, new: e.target.value }))}
              />
            </div>
            <button
              onClick={handleChangeSelfPwd}
              className="w-full bg-[#0F6637] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#1a7a42]"
            >
              修改密码
            </button>
          </div>
        </div>
      )}

      {/* 新增账号弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">新增管理员账号</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">用户名（2-32 字符）</label>
                <input
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={createForm.username}
                  onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">初始密码（至少 6 位）</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={createForm.password}
                  onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">角色</label>
                <select
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  value={createForm.role}
                  onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                >
                  <option value="admin">普通管理员（仅业务功能）</option>
                  <option value="super_admin">超级管理员（账号管理权限）</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">备注（可选）</label>
                <input
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                  placeholder="如：业务员小王"
                  value={createForm.remark}
                  onChange={e => setCreateForm(p => ({ ...p, remark: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm"
              >取消</button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-[#0F6637] text-white rounded text-sm font-semibold"
              >确认创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">重置密码</h3>
            <p className="text-sm text-gray-600 mb-3">
              账号：<span className="font-semibold">{resetTarget.username}</span>
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">新密码（至少 6 位）</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setResetTarget(null); setNewPwd('') }}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm"
              >取消</button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-[#0F6637] text-white rounded text-sm font-semibold"
              >确认重置</button>
            </div>
          </div>
        </div>
      )}

      <ToastView msgs={toast.msgs} />
    </div>
  )
}
