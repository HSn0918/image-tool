import Link from 'next/link';

export default function Home() {
  return (
    <main className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-6 flex flex-col gap-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">选择你的工具</h1>
        <p className="text-slate-600 text-sm">裁剪分片与等比例缩放分开成两个页面，纯前端本地处理，不上传图片。</p>
      </header>
      <section className="space-y-3">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 hover:border-sky-300 hover:shadow-lg transition">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-base font-semibold">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">裁剪分片</span>
              <span>网格切片 · ZIP 打包</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">拖拽/点击/粘贴图片，选择比例与网格行列，导出高清 PNG 分片并自动打包 ZIP。</p>
          </div>
          <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow hover:shadow-lg transition" href="/slicer">
            打开
          </Link>
        </div>
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 hover:border-sky-300 hover:shadow-lg transition">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-base font-semibold">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">等比例缩放</span>
              <span>最长边缩放 · 批量导出</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">输入目标最长边像素，拖拽/选择/粘贴图片，逐张下载或复制 PNG，可一键打包 ZIP。</p>
          </div>
          <Link className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow hover:shadow-lg transition" href="/scaler">
            打开
          </Link>
        </div>
      </section>
    </main>
  );
}
