'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
          选择工具
        </h1>
        <p className="text-gray-500 text-sm">
          请选择下方的一个处理模块。所有操作均在浏览器本地安全环境中执行，无数据传输。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Slicer Module */}
        <Link href="/slicer" className="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-md bg-gray-50 border border-gray-100 text-foreground">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-foreground transition-colors">启动程序 &rarr;</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">图片裁剪分片</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            网格切片序列。自动打包为 ZIP 归档。<br/>
            支持输入：拖拽 / 点击 / 粘贴。
          </p>
        </Link>

        {/* Scaler Module */}
        <Link href="/scaler" className="group block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-md bg-gray-50 border border-gray-100 text-foreground">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-foreground transition-colors">启动程序 &rarr;</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">等比例缩放器</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            长边重缩放算法。批量导出。<br/>
            支持输入：拖拽 / 点击 / 粘贴。
          </p>
        </Link>
      </div>
    </main>
  );
}