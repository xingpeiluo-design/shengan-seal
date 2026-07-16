export default function TopBanner() {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <span className="text-[#0F6637] font-semibold tracking-wide">
          源头工厂直供｜包覆式密封条现货批发，工程配套、来样定制、全国包邮，新客免费拿样
        </span>
        <div className="hidden md:flex items-center gap-6 text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#0F6637]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            24小时采购热线：<strong>400-888-SEAL</strong>
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#0F6637]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            工厂咨询：<strong>138-0000-1234</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
