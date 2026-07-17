/**
 * API 客户端 - 盛安密封官网
 * 统一管理所有后端 API 调用
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 获取存储的 token
function getToken(): string | null {
  return localStorage.getItem('shengan_admin_token')
}

function setToken(token: string) {
  localStorage.setItem('shengan_admin_token', token)
}

function clearToken() {
  localStorage.removeItem('shengan_admin_token')
}

// 通用请求
async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    clearToken()
    throw new Error('未登录或登录已过期')
  }
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

// ============ 公开 API ============
export const api = {
  // --- 认证 ---
  auth: {
    async login(user: string, pass: string) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ user, pass }),
      })
      setToken(data.token)
      return data
    },
    async verify() {
      try {
        await request('/auth/verify')
        return true
      } catch {
        return false
      }
    },
    logout() {
      clearToken()
    },
  },

  // --- 产品 ---
  products: {
    async list() {
      return request('/products')
    },
    async detail(id: number) {
      return request(`/products/${id}`)
    },
    async subProducts() {
      return request('/sub-products')
    },
  },

  // --- 资讯 ---
  news: {
    async list(category?: string) {
      const qs = category ? `?category=${encodeURIComponent(category)}` : ''
      return request(`/news${qs}`)
    },
    async detail(id: number) {
      return request(`/news/${id}`)
    },
  },

  // --- 留言 ---
  messages: {
    async submit(data: { name: string; company?: string; phone: string; need?: string; product?: string; source?: string }) {
      return request('/messages', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  },

  // --- 寄样申请 ---
  samples: {
    async submit(data: { name: string; phone: string; company?: string; address?: string; product?: string; note?: string }) {
      return request('/samples', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    },
  },

  // --- 设置 ---
  settings: {
    async list() {
      return request('/settings')
    },
  },

  // --- 二维码 ---
  qrCodes: {
    async list() {
      return request('/qr-codes')
    },
  },

  // ============ 管理后台 API ============
  admin: {
    // 产品
    async getProducts() {
      return request('/admin/products')
    },
    async createProduct(data: any) {
      return request('/admin/products', { method: 'POST', body: JSON.stringify(data) })
    },
    async updateProduct(id: number, data: any) {
      return request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async deleteProduct(id: number) {
      return request(`/admin/products/${id}`, { method: 'DELETE' })
    },
    async exportProducts() {
      const token = getToken()
      const res = await fetch(`${API_BASE}/admin/products/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.blob()
    },
    async importProducts(file: File) {
      const token = getToken()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE}/admin/products/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      })
      return res.json()
    },
    async manageSubProduct(data: any, method: 'POST' | 'PUT' | 'DELETE') {
      return request('/admin/sub-products', { method, body: JSON.stringify(data) })
    },

    // 资讯
    async getNews() {
      return request('/admin/news')
    },
    async createNews(data: any) {
      return request('/admin/news', { method: 'POST', body: JSON.stringify(data) })
    },
    async updateNews(id: number, data: any) {
      return request(`/admin/news/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async deleteNews(id: number) {
      return request(`/admin/news/${id}`, { method: 'DELETE' })
    },
    async exportNews() {
      const token = getToken()
      const res = await fetch(`${API_BASE}/admin/news/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.blob()
    },
    async importNews(file: File) {
      const token = getToken()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE}/admin/news/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      })
      return res.json()
    },

    // 留言
    async getMessages(status?: string) {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ''
      return request(`/admin/messages${qs}`)
    },
    async updateMessage(id: number, data: { status: string }) {
      return request(`/admin/messages/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async deleteMessage(id: number) {
      return request(`/admin/messages/${id}`, { method: 'DELETE' })
    },
    async exportMessages() {
      const token = getToken()
      const res = await fetch(`${API_BASE}/admin/messages/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.blob()
    },
    async importMessages(file: File) {
      const token = getToken()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE}/admin/messages/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      })
      return res.json()
    },

    // 寄样
    async getSamples() {
      return request('/admin/samples')
    },
    async updateSample(id: number, data: { status: string }) {
      return request(`/admin/samples/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },
    async deleteSample(id: number) {
      return request(`/admin/samples/${id}`, { method: 'DELETE' })
    },
    async exportSampleRequests() {
      const token = getToken()
      const res = await fetch(`${API_BASE}/admin/sample-requests/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return res.blob()
    },
    async importSampleRequests(file: File) {
      const token = getToken()
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API_BASE}/admin/sample-requests/import`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      })
      return res.json()
    },

    // 设置
    async getSettings() {
      return request('/admin/settings')
    },
    async updateSettings(data: Record<string, string>) {
      return request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) })
    },

    // 二维码
    async updateQrCode(id: number, data: any) {
      return request(`/admin/qr-codes/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    },

    // 图片上传
    async uploadImage(file: File) {
      const token = getToken()
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('上传失败')
      return res.json()
    },
    async uploadImages(files: File[]) {
      const token = getToken()
      const formData = new FormData()
      files.forEach(f => formData.append('file', f))
      const res = await fetch(`${API_BASE}/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error('上传失败')
      return res.json()
    },

    // 统计
    async getStats() {
      return request('/admin/stats')
    },
  },
}
