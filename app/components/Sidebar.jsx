'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkClass = (active) =>
  [
    'flex items-center justify-between px-3.5 py-3 rounded-xl border text-sm font-semibold transition shadow-sm',
    active ? 'border-sky-300 bg-gradient-to-r from-sky-50 to-blue-50 text-slate-900 ring-1 ring-sky-100' : 'border-slate-200 bg-white/80 hover:border-sky-300 hover:bg-white'
  ].join(' ');

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-white/90 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-5 flex flex-col gap-4 sticky top-4 h-fit">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 via-sky-400 to-blue-600 text-white font-black text-xl grid place-items-center shadow-lg">IT</div>
      <div>
        <p className="font-extrabold text-lg mb-1 tracking-tight text-slate-900">image-tool</p>
        <p className="text-sm text-slate-600">统一入口 · 选择需要的图片工具</p>
      </div>
      <nav className="grid gap-2">
        <Link className={linkClass(pathname === '/slicer')} href="/slicer">
          <span>图片裁剪分片</span>
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">网格切片</span>
        </Link>
        <Link className={linkClass(pathname === '/scaler')} href="/scaler">
          <span>图片等比例缩放</span>
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">最长边</span>
        </Link>
      </nav>
    </aside>
  );
}
