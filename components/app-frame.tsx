"use client";

import { ReactNode } from "react";
import Sidebar from "@/app/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <div className="mx-auto flex w-full max-w-[120rem] flex-1 gap-6 px-4 py-10 sm:px-6 lg:px-10">
        <aside className="hidden w-64 flex-none rounded-2xl border border-border/60 bg-background/90 p-6 shadow-sm lg:block">
          <Sidebar />
        </aside>
        <main className="flex-1 rounded-2xl border border-border/60 bg-background/95 p-6 shadow-sm">
          <div className="lg:hidden mb-6">
            <Sidebar />
          </div>
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>
      <footer className="border-t border-border/60 bg-background/80 py-6">
        <div className="mx-auto flex w-full max-w-[120rem] flex-col gap-4 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">image-tool</span>
            <span>纯前端离线可用</span>
            <span>裁剪分片 & 等比例缩放</span>
            <span>© HSn</span>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a
              href="https://github.com/HSn0918/image-tool"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
        </div>
      </footer>
    </div>
  );
}
