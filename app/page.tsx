'use client';

import Link from 'next/link';
import { ArrowRight, Crop, Maximize2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const tools = [
  {
    href: '/slicer',
    title: '图片裁剪分片',
    description: '网格切片序列，导出高清 ZIP 包。',
    detail: '拖拽 / 点击 / 粘贴 输入',
    icon: Crop
  },
  {
    href: '/scaler',
    title: '等比例缩放器',
    description: '长边缩放与批量导出，自动重命名。',
    detail: '批量拖拽 / 粘贴 / ZIP 打包',
    icon: Maximize2
  }
];

export default function Home() {
  return (
    <main className="space-y-6 animate-in fade-in-50">
      <Card className="border-dashed border-muted bg-background/80">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">选择工具</CardTitle>
              <CardDescription>所有操作均在浏览器本地执行，无需上传。</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              v1.0.0
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          请选择下方任意模块开启工作流，也可以在左侧 Sidebar 中切换功能。
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Card className="h-full border-border/80 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-full border border-border bg-secondary/80 p-2 text-secondary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{tool.title}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{tool.detail}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
