'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkClass = (active) =>
  [
    'flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-200',
    active 
      ? 'bg-white text-foreground font-medium shadow-sm border border-gray-200' 
      : 'text-gray-500 hover:text-foreground hover:bg-gray-100'
  ].join(' ');

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col gap-6 sticky top-10 h-fit">
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-full bg-black text-white font-bold grid place-items-center text-sm">
          IT
        </div>
        <div className="flex flex-col">
          <p className="font-semibold text-sm tracking-tight text-foreground">image-tool</p>
          <p className="text-[10px] text-gray-500">v1.0.0</p>
        </div>
      </div>

      <nav className="grid gap-1">
        <Link className={linkClass(pathname === '/slicer')} href="/slicer">
          <span>图片裁剪分片</span>
        </Link>
        <Link className={linkClass(pathname === '/scaler')} href="/scaler">
          <span>等比例缩放</span>
        </Link>
      </nav>
      
      <div className="px-3 pt-4 border-t border-gray-200">
         <p className="text-xs text-gray-400 leading-relaxed">
           选择左侧模块以开始处理图像。所有操作均在本地完成。
         </p>
      </div>
    </aside>
  );
}