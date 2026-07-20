import { useEffect, useState } from 'react'
import { api } from '../api'

export type SettingsMap = Record<string, string>

// 模块级缓存：全站共用一次请求，多个组件并发 useSettings 只会打一次 /api/settings
let _promise: Promise<SettingsMap> | null = null

export function getSettings(): Promise<SettingsMap> {
  if (!_promise) {
    _promise = api.settings
      .list()
      .then((rows: any[]) => {
        const map: SettingsMap = {}
        for (const r of rows || []) map[r.key] = r.value
        return map
      })
      .catch(() => ({}) as SettingsMap)
  }
  return _promise
}

// 组件内读取后台设置；settings 异步到位前为空对象，调用方务必保留 fallback。
export function useSettings(): SettingsMap {
  const [settings, setSettings] = useState<SettingsMap>({})
  useEffect(() => {
    let alive = true
    getSettings().then((s) => {
      if (alive) setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])
  return settings
}
