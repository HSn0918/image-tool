"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

interface OutputItem {
  name: string;
  dataUrl: string;
  original: { width: number; height: number };
  resized: { width: number; height: number };
}

export default function ScalerPage() {
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(240);
  const [outputs, setOutputs] = useState<OutputItem[]>([]);
  const [info, setInfo] = useState("系统就绪");
  const [canClipboardRead, setCanClipboardRead] = useState(false);

  const buildFileName = (name: string, w: number, h: number) => {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    return `${base}_${w}x${h}.png`;
  };

  const addResult = (
    fileName: string,
    dataUrl: string,
    original: { width: number; height: number },
    resized: { width: number; height: number },
  ) => {
    const outputName = buildFileName(fileName, resized.width, resized.height);
    setOutputs((prev) => [
      { name: outputName, dataUrl, original, resized },
      ...prev,
    ]);
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const target = Math.max(size || 240, 1);
        const scale = target / Math.max(img.width, img.height);
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const dataUrl = canvas.toDataURL("image/png");
        addResult(
          file.name,
          dataUrl,
          { width: img.width, height: img.height },
          { width: newWidth, height: newHeight },
        );
        setInfo(`已处理 ${outputs.length + 1} 张图片`);
      };
      if (ev.target?.result) {
        img.src = ev.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) {
      setInfo("错误：未检测到图片文件");
      return;
    }
    setInfo(`正在处理 ${files.length} 张图片...`);
    files.forEach(processImage);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items || [];
    const images: File[] = [];
    // @ts-ignore - iterating DataTransferItemList
    for (const item of items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) images.push(file);
      }
    }
    if (images.length) {
      e.preventDefault();
      handleFiles(images);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCanClipboardRead(
      typeof navigator !== "undefined" && !!navigator.clipboard?.read,
    );
    const dropzone = dropzoneRef.current;
    if (!dropzone) return undefined;
    const onDrag = (e: DragEvent) => {
      e.preventDefault();
      dropzone.classList.add("border-primary", "bg-background");
    };
    const onLeave = (e: DragEvent) => {
      e.preventDefault();
      dropzone.classList.remove("border-primary", "bg-background");
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dropzone.classList.remove("border-primary", "bg-background");
      if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files);
      }
    };
    // @ts-ignore - Native events
    dropzone.addEventListener("dragenter", onDrag);
    // @ts-ignore
    dropzone.addEventListener("dragover", onDrag);
    // @ts-ignore
    dropzone.addEventListener("dragleave", onLeave);
    // @ts-ignore
    dropzone.addEventListener("dragend", onLeave);
    // @ts-ignore
    dropzone.addEventListener("drop", onDrop);
    // @ts-ignore
    window.addEventListener("paste", handlePaste);
    return () => {
      // @ts-ignore
      dropzone.removeEventListener("dragenter", onDrag);
      // @ts-ignore
      dropzone.removeEventListener("dragover", onDrag);
      // @ts-ignore
      dropzone.removeEventListener("dragleave", onLeave);
      // @ts-ignore
      dropzone.removeEventListener("dragend", onLeave);
      // @ts-ignore
      dropzone.removeEventListener("drop", onDrop);
      // @ts-ignore
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setInfo(outputs.length ? `已生成 ${outputs.length} 张图片` : "系统就绪");
  }, [outputs]);

  const importFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      setInfo("错误：剪贴板访问被拒绝");
      return;
    }
    try {
      setInfo("正在读取剪贴板...");
      // @ts-ignore - clipboard read API
      const items = await navigator.clipboard.read();
      const images: File[] = [];
      for (const item of items) {
        // @ts-ignore
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await item.getType(type);
          images.push(
            new File([blob], `clipboard.${type.split("/")[1] || "png"}`, {
              type,
            }),
          );
        }
      }
      if (!images.length) {
        setInfo("剪贴板中无图片");
        return;
      }
      handleFiles(images);
    } catch (err) {
      console.error(err);
      setInfo("剪贴板读取失败");
    }
  };

  const clearResults = () => {
    setOutputs([]);
    setInfo("已清空");
  };

  const concatUint8 = (arrays: Uint8Array[]) => {
    const total = arrays.reduce((sum, a) => sum + a.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const arr of arrays) {
      out.set(arr, offset);
      offset += arr.length;
    }
    return out;
  };

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c >>> 0;
    }
    return table;
  })();

  const crc32 = (data: Uint8Array) => {
    let crc = 0 ^ -1;
    for (let i = 0; i < data.length; i++)
      crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
    return (crc ^ -1) >>> 0;
  };

  const dosTimeDate = (date = new Date()) => {
    const time =
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2);
    const dosDate =
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();
    return { time, date: dosDate };
  };

  const createZip = async () => {
    const encoder = new TextEncoder();
    const parts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;
    for (const item of outputs) {
      const res = await fetch(item.dataUrl);
      const data = new Uint8Array(await res.arrayBuffer());
      const nameBytes = encoder.encode(item.name);
      const { time, date } = dosTimeDate();
      const crc = crc32(data);
      const size = data.length;
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true);
      local.setUint16(10, time, true);
      local.setUint16(12, date, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, size, true);
      local.setUint32(22, size, true);
      local.setUint16(26, nameBytes.length, true);
      local.setUint16(28, 0, true);
      parts.push(new Uint8Array(local.buffer), nameBytes, data);
      const central = new DataView(new ArrayBuffer(46));
      central.setUint32(0, 0x02014b50, true);
      central.setUint16(4, 20, true);
      central.setUint16(6, 20, true);
      central.setUint16(8, 0x0800, true);
      central.setUint16(10, 0, true);
      central.setUint16(12, time, true);
      central.setUint16(14, date, true);
      central.setUint32(16, crc, true);
      central.setUint32(20, size, true);
      central.setUint32(24, size, true);
      central.setUint16(28, nameBytes.length, true);
      central.setUint16(30, 0, true);
      central.setUint16(32, 0, true);
      central.setUint16(34, 0, true);
      central.setUint16(36, 0, true);
      central.setUint32(38, 0, true);
      central.setUint32(42, offset, true);
      centralParts.push(new Uint8Array(central.buffer), nameBytes);
      offset += 30 + nameBytes.length + size;
    }
    const centralSize = centralParts.reduce((sum, p) => sum + p.length, 0);
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(4, 0, true);
    eocd.setUint16(6, 0, true);
    eocd.setUint16(8, outputs.length, true);
    eocd.setUint16(10, outputs.length, true);
    eocd.setUint32(12, centralSize, true);
    eocd.setUint32(16, offset, true);
    eocd.setUint16(20, 0, true);
    const zipArray = concatUint8([
      ...parts,
      ...centralParts,
      new Uint8Array(eocd.buffer),
    ]);
    return new Blob([zipArray], { type: "application/zip" });
  };

  const downloadZip = async () => {
    if (!outputs.length) return;
    setInfo("正在打包 ZIP...");
    try {
      const zipBlob = await createZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "images.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("打包失败");
    } finally {
      setInfo(outputs.length ? `可打包 ${outputs.length} 张` : "系统就绪");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            等比例缩放器
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            长边缩放 // 批量处理 // ZIP 导出
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          批量工具
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="sizeInput">目标长边 (px)</Label>
              <Input
                id="sizeInput"
                type="number"
                min={1}
                value={size}
                onChange={(e) =>
                  setSize(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-32"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                }}
              />
              <Button asChild variant="secondary">
                <label htmlFor="fileInput" className="cursor-pointer">
                  加载图片
                </label>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={importFromClipboard}
                disabled={!canClipboardRead}
              >
                粘贴剪贴板
              </Button>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <Button
                type="button"
                variant="default"
                disabled={!outputs.length}
                onClick={downloadZip}
              >
                下载 ZIP
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={clearResults}
              >
                清空
              </Button>
            </div>
          </div>

          <div
            ref={dropzoneRef}
            className="flex min-h-[400px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-10 text-center transition-all duration-200 hover:border-muted-foreground"
            data-dropzone
          >
            <strong className="block text-lg font-medium text-foreground">
              拖拽图片到此处
            </strong>
            <div className="text-sm text-muted-foreground uppercase tracking-widest">
              支持批量处理
            </div>
          </div>
          <p
            id="info"
            className="text-center text-xs font-mono text-muted-foreground"
          >
            {info}
          </p>
        </CardContent>
      </Card>

      <section
        id="results"
        className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        aria-live="polite"
      >
        {outputs.map((item) => (
          <Card key={item.name} className="group overflow-hidden shadow-sm">
            <div className="flex h-full flex-col">
              <CardHeader className="space-y-0 p-3 pb-2">
                <CardTitle
                  className="truncate text-xs font-medium"
                  title={item.name}
                >
                  {item.name}
                </CardTitle>
                <CardDescription className="truncate font-mono text-[10px] text-muted-foreground">
                  {item.original.width}x{item.original.height} →{" "}
                  {item.resized.width}x{item.resized.height}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 p-3 pt-0">
                <div className="flex h-48 w-full items-center justify-center rounded border bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.dataUrl}
                    alt="preview"
                    className="max-h-full max-w-full object-contain p-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <a href={item.dataUrl} download={item.name}>
                      下载
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={async (e) => {
                      const btn = e.currentTarget;
                      btn.disabled = true;
                      // const originalText = btn.innerText
                      btn.innerText = "已复制";
                      try {
                        if (
                          navigator.clipboard &&
                          typeof ClipboardItem !== "undefined"
                        ) {
                          const blob = await (await fetch(item.dataUrl)).blob();
                          await navigator.clipboard.write([
                            new ClipboardItem({ [blob.type]: blob }),
                          ]);
                        } else if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(item.dataUrl);
                        }
                      } catch (err) {
                        console.error(err);
                        btn.innerText = "错误";
                      } finally {
                        setTimeout(() => {
                          btn.innerText = "复制";
                          btn.disabled = false;
                        }, 1200);
                      }
                    }}
                  >
                    复制
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
