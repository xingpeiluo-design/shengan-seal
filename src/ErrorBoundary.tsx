import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('应用错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F8F5]">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-[#333] mb-2">页面加载出错了</h1>
            <p className="text-gray-500 mb-4">请刷新页面重试，或联系管理员</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#0F6637] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0a4d2a] transition-colors"
            >
              刷新页面
            </button>
            {this.state.error && (
              <pre className="mt-4 text-xs text-red-400 bg-gray-100 p-3 rounded max-w-md overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
