import "./globals.css";
import { Inter } from "next/font/google";

import Providers from "./providers";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";
import { AppFrame } from "@/components/app-frame";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
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
      <body
        className={cn(
          "min-h-screen bg-muted/30 font-sans antialiased",
          inter.variable,
        )}
      >
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
