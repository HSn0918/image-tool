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
  description: "图片裁剪分片与等比例缩放，纯前端本地处理",
  icons: {
    icon: "/icon.svg", // Reference to the SVG icon in the public directory
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {

  return (

    <html lang="zh-CN" suppressHydrationWarning>

      <body className={cn("h-screen overflow-hidden bg-background font-sans antialiased", inter.variable)}>

        <Providers>

          <div className="grid h-full lg:grid-cols-[260px_1fr]">

            <aside className="hidden h-full flex-col border-r bg-muted/30 lg:flex">

              <div className="flex-1 overflow-y-auto p-6">

                <Sidebar />

              </div>

            </aside>

            <main className="flex h-full min-w-0 flex-col overflow-hidden">

              <div className="flex-1 overflow-y-auto p-6">

                {children}

              </div>

            </main>

          </div>

        </Providers>

      </body>

    </html>

  );

}




