import './globals.css';
import { Manrope } from 'next/font/google';
import Sidebar from './components/Sidebar';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap'
});

export const metadata = {
  title: 'image-tool',
  description: '图片裁剪分片与等比例缩放，纯前端本地处理'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${manrope.className} min-h-screen bg-slate-950/2 text-slate-900 bg-gradient-to-br from-slate-50 via-white to-slate-100`}>
        <div className="max-w-7xl mx-auto grid gap-5 lg:grid-cols-[260px,1fr] px-4 md:px-8 py-8">
          <Sidebar />
          {children}
        </div>
        <footer className="max-w-7xl mx-auto px-4 md:px-8 pb-6 pt-4 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span>image-tool · 纯前端离线可用</span>
            <span>裁剪分片 / 等比例缩放</span>
            <span>© HSn</span>
          </div>
          <a className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200" href="https://github.com/HSn0918/image-tool" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="w-4 h-4 fill-current">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.18.08 1.8 1.22 1.8 1.22 1.04 1.78 2.72 1.27 3.38.97.1-.75.41-1.27.75-1.56-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.3 1.2-3.11-.12-.29-.52-1.46.11-3.06 0 0 .97-.31 3.18 1.19a11.07 11.07 0 0 1 5.8 0c2.2-1.5 3.17-1.19 3.17-1.19.64 1.6.24 2.77.12 3.06.75.81 1.2 1.85 1.2 3.1 0 4.43-2.69 5.42-5.25 5.7.42.36.8 1.06.8 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.55A10.99 10.99 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
