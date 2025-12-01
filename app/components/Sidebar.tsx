"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crop, Maximize2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/theme-toggle";

const nav = [
  {
    href: "/slicer",
    label: "图片裁剪分片",
    description: "网格切片 / ZIP",
    icon: Crop
  },
  {
    href: "/scaler",
    label: "等比例缩放",
    description: "批量缩放 / ZIP",
    icon: Maximize2
  }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold leading-tight">image-tool</p>
          <p className="text-xs text-muted-foreground">v1.0.0 · 本地运行</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-2.5 py-0.5 text-[11px] uppercase tracking-wide">
            离线
          </Badge>
          <ThemeToggle />
        </div>
      </div>

      <nav className="grid gap-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                "h-auto justify-between px-3 py-3 text-left font-medium"
              )}
            >
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{item.description}</span>
              </span>
              {active && <span className="text-[10px] font-semibold uppercase text-primary">Active</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <p className="text-xs leading-relaxed text-muted-foreground">
          所有图片均在浏览器内处理，不会上传到服务器。拖拽 / 粘贴 / 点击皆可开始。
        </p>
      </div>
    </div>
  );
}
