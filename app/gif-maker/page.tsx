"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gifshot from "gifshot";
import { Film } from "lucide-react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SheetInfo {
  width: number;
  height: number;
  name: string;
}

export default function GifMakerPage() {
  const [cols, setCols] = useState(6);
  const [rows, setRows] = useState(4);
  const [delay, setDelay] = useState(120);
  const [loop, setLoop] = useState(true);
  const [status, setStatus] = useState("等待上传/粘贴素材");
  const [sheetSrc, setSheetSrc] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const dropzoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      cleanupObjectUrl();
    },
    [cleanupObjectUrl],
  );

  const loadSheet = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith("image/")) {
        setStatus("仅支持图片文件");
        return;
      }
      cleanupObjectUrl();
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setSheetSrc(url);
      setSheetInfo({ name: file.name, width: 0, height: 0 });
      setGifUrl(null);
      setStatus(`已读取 ${file.name}，等待图片加载…`);
    },
    [cleanupObjectUrl],
  );

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList || []).filter((file) =>
        file.type.startsWith("image/"),
      );
      if (!files.length) {
        setStatus("未检测到图片，请重新选择");
        return;
      }
      loadSheet(files[0]);
    },
    [loadSheet],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            loadSheet(file);
            event.preventDefault();
            return;
          }
        }
      }
    },
    [loadSheet],
  );

  useEffect(() => {
    const dropzone = dropzoneRef.current;
    if (!dropzone) return;

    const onDrag = (event: DragEvent) => {
      event.preventDefault();
      dropzone.classList.add("border-primary", "bg-background");
    };
    const onLeave = (event: DragEvent) => {
      event.preventDefault();
      dropzone.classList.remove("border-primary", "bg-background");
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      dropzone.classList.remove("border-primary", "bg-background");
      const files = event.dataTransfer?.files;
      if (files && files.length) {
        handleFiles(files);
      }
    };
    dropzone.addEventListener("dragenter", onDrag);
    dropzone.addEventListener("dragover", onDrag);
    dropzone.addEventListener("dragleave", onLeave);
    dropzone.addEventListener("dragend", onLeave);
    dropzone.addEventListener("drop", onDrop);
    window.addEventListener("paste", handlePaste);
    return () => {
      dropzone.removeEventListener("dragenter", onDrag);
      dropzone.removeEventListener("dragover", onDrag);
      dropzone.removeEventListener("dragleave", onLeave);
      dropzone.removeEventListener("dragend", onLeave);
      dropzone.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleFiles, handlePaste]);

  const updateOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const cropper = cropperRef.current;
    if (!overlay || !cropper) return;
    const box = cropper.getCropBoxData();
    if (!box.width || !box.height) {
      overlay.style.display = "none";
      return;
    }
    overlay.style.display = "block";
    overlay.style.left = `${box.left}px`;
    overlay.style.top = `${box.top}px`;
    overlay.style.width = `${box.width}px`;
    overlay.style.height = `${box.height}px`;
    overlay.innerHTML = "";
    for (let c = 1; c < cols; c++) {
      const v = document.createElement("div");
      v.className =
        "absolute border-l border-white/70 top-0 shadow-[1px_0_0_0_rgba(0,0,0,0.2)]";
      v.style.left = `${(c / cols) * 100}%`;
      v.style.height = "100%";
      overlay.appendChild(v);
    }
    for (let r = 1; r < rows; r++) {
      const h = document.createElement("div");
      h.className =
        "absolute border-t border-white/70 left-0 shadow-[0_1px_0_0_rgba(0,0,0,0.2)]";
      h.style.top = `${(r / rows) * 100}%`;
      h.style.width = "100%";
      overlay.appendChild(h);
    }
  }, [cols, rows]);

  const onImageLoaded = useCallback(() => {
    if (!imageRef.current) return;
    const { naturalWidth, naturalHeight } = imageRef.current;
    setSheetInfo((info) => ({
      name: info?.name ?? "sprite-sheet",
      width: naturalWidth,
      height: naturalHeight,
    }));
    setStatus(
      `已加载 ${naturalWidth}x${naturalHeight} ，默认 ${rows * cols} 帧`,
    );
    if (cropperRef.current) {
      cropperRef.current.destroy();
    }
    const imgNode = imageRef.current;
    if (imgNode) {
      cropperRef.current = new Cropper(imgNode, {
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        background: false,
        responsive: true,
        crop: updateOverlay,
      });
    }
  }, [cols, rows, updateOverlay]);

  useEffect(() => {
    updateOverlay();
  }, [updateOverlay, sheetSrc]);

  const generateGif = useCallback(() => {
    const img = imageRef.current;
    if (!img || !sheetSrc) {
      setStatus("请先加载图片");
      return;
    }
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    if (!naturalWidth || !naturalHeight) {
      setStatus("无法读取图片尺寸");
      return;
    }
    const frameWidth = Math.floor(naturalWidth / Math.max(cols, 1));
    const frameHeight = Math.floor(naturalHeight / Math.max(rows, 1));
    if (frameWidth <= 0 || frameHeight <= 0) {
      setStatus("无效的网格尺寸");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setStatus("浏览器不支持 Canvas");
      return;
    }

    const frames: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.clearRect(0, 0, frameWidth, frameHeight);
        ctx.drawImage(
          img,
          c * frameWidth,
          r * frameHeight,
          frameWidth,
          frameHeight,
          0,
          0,
          frameWidth,
          frameHeight,
        );
        frames.push(canvas.toDataURL("image/png"));
      }
    }

    setGenerating(true);
    setStatus("正在合成 GIF…");
    gifshot.createGIF(
      {
        images: frames,
        gifWidth: frameWidth,
        gifHeight: frameHeight,
        numFrames: frames.length,
        interval: Math.max(delay, 20) / 1000,
        sampleInterval: 5,
        numWorkers: 2,
        repeat: loop ? 0 : -1,
      },
      (result) => {
        setGenerating(false);
        if (result.error) {
          setStatus(result.errorMsg ?? "GIF 生成失败");
          return;
        }
        setGifUrl(result.image);
        setStatus(`成功生成 ${frames.length} 帧 GIF`);
      },
    );
  }, [cols, rows, delay, loop, sheetSrc]);

  const framesCount = cols * rows;

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-muted bg-background/80">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-border bg-secondary/70 p-2">
                <Film className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl">序列帧 GIF 生成器</CardTitle>
                <CardDescription>
                  读取图 / 网格切片 / 一键输出 GIF 动画。
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="text-[11px]">
              GIF
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {status}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-[1.25fr,1fr,0.95fr]">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>素材区</CardTitle>
            <CardDescription>
              拖拽 / 点击 / 粘贴任意图，左侧为缩略预览。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div
              ref={dropzoneRef}
              className="relative flex min-h-[320px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) handleFiles(event.target.files);
                }}
              />
              {sheetSrc ? (
                <>
                  <div className="relative max-h-[280px] w-full rounded-md border bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imageRef}
                      src={sheetSrc}
                      alt="sprite sheet"
                      onLoad={onImageLoaded}
                      className="h-full w-full rounded-md object-contain"
                    />
                    <div ref={overlayRef} className="absolute inset-0" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {sheetInfo && sheetInfo.width && sheetInfo.height
                      ? `${sheetInfo.width}x${sheetInfo.height}`
                      : "加载中…"}{" "}
                    · 共 {framesCount} 帧
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-base font-medium text-foreground">
                    拖拽图片到此处
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持粘贴 / 点击上传
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    浏览文件
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-background/80 p-3 text-left">
                <p className="text-[11px] uppercase text-muted-foreground">
                  尺寸
                </p>
                <p className="text-sm font-semibold">
                  {sheetInfo && sheetInfo.width && sheetInfo.height
                    ? `${sheetInfo.width} × ${sheetInfo.height}`
                    : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/80 p-3 text-left">
                <p className="text-[11px] uppercase text-muted-foreground">
                  帧数
                </p>
                <p className="text-sm font-semibold">{framesCount}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/80 p-3 text-left">
                <p className="text-[11px] uppercase text-muted-foreground">
                  文件名
                </p>
                <p
                  className="truncate text-sm font-semibold"
                  title={sheetInfo?.name ?? "未命名"}
                >
                  {sheetInfo?.name ?? "未命名"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>参数配置</CardTitle>
            <CardDescription>
              自定义网格、帧率以及循环行为，一键输出。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cols">列（横向）</Label>
                <Input
                  id="cols"
                  type="number"
                  min={1}
                  value={cols}
                  onChange={(event) =>
                    setCols(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rows">行（纵向）</Label>
                <Input
                  id="rows"
                  type="number"
                  min={1}
                  value={rows}
                  onChange={(event) =>
                    setRows(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delay">帧间隔（ms）</Label>
                <Input
                  id="delay"
                  type="number"
                  min={1}
                  value={delay}
                  onChange={(event) =>
                    setDelay(Math.max(1, Number(event.target.value) || 1))
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="loop"
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={loop}
                  onChange={(event) => setLoop(event.target.checked)}
                />
                <Label htmlFor="loop" className="text-sm">
                  循环播放
                </Label>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border/70 bg-muted/10 p-4 text-xs text-muted-foreground">
              如果源图尺寸无法被行列整除，将自动向下取整裁剪；建议使用规律图以获得最佳效果。
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={generateGif}
                disabled={!sheetSrc || generating}
                className="flex-1 min-w-[140px]"
              >
                {generating ? "合成中…" : `生成 GIF（${framesCount} 帧）`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={!sheetSrc}
                onClick={() => {
                  cleanupObjectUrl();
                  setSheetSrc(null);
                  setSheetInfo(null);
                  setGifUrl(null);
                  setStatus("已清空素材");
                }}
              >
                清空
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle>GIF 预览与下载</CardTitle>
            <CardDescription>
              生成后可在此预览，点击下方按钮保存。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border bg-muted/20 p-4">
              {gifUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gifUrl}
                  alt="GIF preview"
                  className="h-full max-h-52 w-full max-w-xs object-contain"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  暂无 GIF，请先生成。
                </p>
              )}
            </div>
            <Button asChild disabled={!gifUrl} variant="secondary">
              <a href={gifUrl ?? "#"} download="sprite.gif">
                下载 GIF
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
