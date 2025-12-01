import "./globals.css";
import { Inter } from "next/font/google";
import { Github } from "lucide-react";

import Sidebar from "./components/Sidebar";
import Providers from "./providers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

export const metadata = {
  title: "image-tool",
  description: "图片裁剪分片与等比例缩放，纯前端本地处理"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={cn("min-h-screen bg-muted/30 font-sans antialiased", inter.variable)}>
        <Providers>
          <div className="container grid gap-8 py-10 lg:grid-cols-[260px,1fr]">
            <Sidebar />
            <main className="space-y-8">
              <div className="w-full min-w-0">{children}</div>
              <footer className="rounded-2xl border bg-background/80 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">image-tool</span>
                    <span>纯前端离线可用</span>
                    <span>裁剪分片 & 等比例缩放</span>
                    <span>© HSn</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="gap-2">
                    <a href="https://github.com/HSn0918/image-tool" target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                </div>
              </footer>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}