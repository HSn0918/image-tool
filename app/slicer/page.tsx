"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Cropper from "cropperjs"
import JSZip from "jszip"
import "cropperjs/dist/cropper.css"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const ratioPresets = [
  { label: "16:9", value: 1.7777778 },
  { label: "4:3", value: 1.3333333 },
  { label: "1:1", value: 1 },
]

export default function SlicerPage() {
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const [status, setStatus] = useState("准备就绪")
  const [cols, setCols] = useState(6)
  const [rows, setRows] = useState(4)
  const [ratio, setRatio] = useState("free")
  const [hasImage, setHasImage] = useState(false)

  const getActiveRatio = () => (ratio === "free" ? NaN : Number(ratio))

  const cleanupCropper = () => {
    if (cropperRef.current) {
      cropperRef.current.destroy()
      cropperRef.current = null
    }
    if (overlayRef.current) {
      overlayRef.current.style.display = "none"
      overlayRef.current.innerHTML = ""
    }
  }

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const updateGridOverlay = useCallback(() => {
    const cropper = cropperRef.current
    const overlay = overlayRef.current
    if (!cropper || !overlay) return
    const box = cropper.getCropBoxData()
    if (!box || !box.width || !box.height) {
      overlay.style.display = "none"
      return
    }
    overlay.style.display = "block"
    overlay.style.left = `${box.left}px`
    overlay.style.top = `${box.top}px`
    overlay.style.width = `${box.width}px`
    overlay.style.height = `${box.height}px`
    overlay.style.pointerEvents = "none"
    overlay.innerHTML = ""
    for (let c = 1; c < cols; c++) {
      const v = document.createElement("div")
      v.className =
        "absolute border-l border-white h-full top-0 shadow-[1px_0_0_0_rgba(0,0,0,0.5)]"
      v.style.left = `${(c / cols) * 100}%`
      overlay.appendChild(v)
    }
    for (let r = 1; r < rows; r++) {
      const h = document.createElement("div")
      h.className =
        "absolute border-t border-white w-full left-0 shadow-[0_1px_0_0_rgba(0,0,0,0.5)]"
      h.style.top = `${(r / rows) * 100}%`
      overlay.appendChild(h)
    }
  }, [cols, rows])

  const initCropper = () => {
    const img = imageRef.current
    if (!img) return
    cropperRef.current = new Cropper(img, {
      aspectRatio: getActiveRatio(),
      viewMode: 1,
      autoCropArea: 1,
      background: false,
      dragMode: "move",
      responsive: true,
      minContainerHeight: 400,
      minContainerWidth: 300,
      preview: previewRef.current || undefined,
      ready() {
        const cropper = cropperRef.current
        if (!cropper) return
        cropper.setAspectRatio(getActiveRatio())
        const canvasData = cropper.getCanvasData()
        cropper.setCropBoxData({
          left: canvasData.left,
          top: canvasData.top,
          width: canvasData.width,
          height: canvasData.height,
        })
        updateGridOverlay()
        setStatus("图片已加载，网格激活")
      },
      crop: updateGridOverlay,
    })
  }

  const loadImage = (file: File) => {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("错误：仅支持图片文件")
      return
    }
    revokeObjectUrl()
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setHasImage(true)
    requestAnimationFrame(() => {
      if (imageRef.current) {
        imageRef.current.src = url
      }
    })
    cleanupCropper()
    if (imageRef.current) {
      imageRef.current.onload = initCropper
    }
  }

  const handleFiles = (files: FileList) => {
    if (!files || !files.length) return
    loadImage(files[0])
  }

  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData && event.clipboardData.items
    if (!items) return
    // @ts-ignore
    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) {
          loadImage(file)
          setStatus("已粘贴图片")
          return
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return undefined

    const onDrag = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.add("border-blue-500", "bg-blue-50")
    }
    const onLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.remove("border-blue-500", "bg-blue-50")
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dropZone.classList.remove("border-blue-500", "bg-blue-50")
      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    }

    // @ts-ignore
    dropZone.addEventListener("dragenter", onDrag)
    // @ts-ignore
    dropZone.addEventListener("dragover", onDrag)
    // @ts-ignore
    dropZone.addEventListener("dragleave", onLeave)
    // @ts-ignore
    dropZone.addEventListener("dragend", onLeave)
    // @ts-ignore
    dropZone.addEventListener("drop", onDrop)
    // @ts-ignore
    window.addEventListener("paste", handlePaste)
    return () => {
      // @ts-ignore
      dropZone.removeEventListener("dragenter", onDrag)
      // @ts-ignore
      dropZone.removeEventListener("dragover", onDrag)
      // @ts-ignore
      dropZone.removeEventListener("dragleave", onLeave)
      // @ts-ignore
      dropZone.removeEventListener("dragend", onLeave)
      // @ts-ignore
      dropZone.removeEventListener("drop", onDrop)
      // @ts-ignore
      window.removeEventListener("paste", handlePaste)
    }
  }, [handlePaste])

  useEffect(
    () => () => {
      cleanupCropper()
      revokeObjectUrl()
    },
    []
  )

  useEffect(() => {
    updateGridOverlay()
  }, [cols, rows, updateGridOverlay])

  const onRatioClick = (value: string) => {
    setRatio(value)
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(value === "free" ? NaN : Number(value))
      setStatus(value === "free" ? "自由比例" : `比例 ${value}`)
      updateGridOverlay()
    }
  }

  const onDownload = async () => {
    const cropper = cropperRef.current
    if (!cropper) {
      setStatus("请先加载图片")
      return
    }
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    })
    if (!canvas) {
      setStatus("无有效裁剪区域")
      return
    }
    const colsVal = Math.max(1, cols)
    const rowsVal = Math.max(1, rows)
    const canvasToBlob = (cvs: HTMLCanvasElement): Promise<Blob | null> =>
      new Promise((resolve) => cvs.toBlob(resolve, "image/png", 0.96))
    setStatus(`正在处理 ${colsVal}x${rowsVal} 网格...`)
    const zip = new JSZip()
    const tileWBase = canvas.width / colsVal
    const tileHBase = canvas.height / rowsVal
    const tileCanvas = document.createElement("canvas")
    const ctx = tileCanvas.getContext("2d")
    if (!ctx) return
    for (let r = 0; r < rowsVal; r++) {
      for (let c = 0; c < colsVal; c++) {
        const sx = Math.round(c * tileWBase)
        const sy = Math.round(r * tileHBase)
        const sw =
          c === colsVal - 1 ? canvas.width - sx : Math.round(tileWBase)
        const sh =
          r === rowsVal - 1 ? canvas.height - sy : Math.round(tileHBase)
        tileCanvas.width = sw
        tileCanvas.height = sh
        ctx.clearRect(0, 0, sw, sh)
        ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
        const blob = await canvasToBlob(tileCanvas)
        if (blob) {
          const name = `cropped-c${c + 1}-r${r + 1}.png`
          zip.file(name, blob)
        }
      }
    }
    try {
      setStatus("正在打包...")
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      })
      const link = document.createElement("a")
      const url = URL.createObjectURL(zipBlob)
      link.href = url
      link.download = `cropped-${colsVal}x${rowsVal}-grid.zip`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setStatus("完成")
    } catch (err) {
      console.error(err)
      setStatus("导出失败")
    }
  }

  const onReset = () => {
    cleanupCropper()
    if (imageRef.current) imageRef.current.src = ""
    setHasImage(false)
    setRatio("free")
    setStatus("重置完成")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const onFlip = () => {
    const cropper = cropperRef.current
    if (!cropper) return setStatus("无图片")
    const data = cropper.getData()
    const scaleX = data.scaleX === -1 ? 1 : -1
    cropper.scaleX(scaleX)
    setStatus(scaleX === -1 ? "已翻转" : "已恢复")
  }

  const onFit = () => {
    const cropper = cropperRef.current
    if (!cropper) return setStatus("无图片")
    cropper.reset()
    cropper.setAspectRatio(getActiveRatio())
    const canvasData = cropper.getCanvasData()
    cropper.setCropBoxData({
      left: canvasData.left,
      top: canvasData.top,
      width: canvasData.width,
      height: canvasData.height,
    })
    updateGridOverlay()
    setStatus("视图重置")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            图片裁剪分片
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            支持拖拽上传，自定义网格分割并导出 ZIP。
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          本地处理
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <Card
          ref={dropZoneRef}
          className="min-h-[600px] cursor-pointer overflow-hidden border-dashed"
          onClick={() => !hasImage && fileInputRef.current?.click()}
        >
          <div className="relative flex h-full w-full items-center justify-center bg-muted/40">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              hidden
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files)
              }}
            />
            {!hasImage && (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground">
                    拖拽图片到此处
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    或点击区域选择
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  选择文件
                </Button>
              </div>
            )}
            <img
              ref={imageRef}
              alt="Preview"
              className={`max-w-full max-h-full select-none object-contain ${
                hasImage ? "block" : "hidden"
              }`}
            />
            <div ref={overlayRef} className="absolute pointer-events-none" />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">纵横比</CardTitle>
              <CardDescription>可快速限定裁剪框比例</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {ratioPresets.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    size="sm"
                    variant={
                      ratio === String(item.value) ? "default" : "outline"
                    }
                    className="w-full"
                    onClick={() => onRatioClick(String(item.value))}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant={ratio === "free" ? "default" : "outline"}
                className="w-full"
                onClick={() => onRatioClick("free")}
              >
                自由（默认）
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">网格配置</CardTitle>
              <CardDescription>定义导出分片数量</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="cols">列数 (Cols)</Label>
                  <Input
                    id="cols"
                    type="number"
                    min={1}
                    value={cols}
                    onChange={(e) =>
                      setCols(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rows">行数 (Rows)</Label>
                  <Input
                    id="rows"
                    type="number"
                    min={1}
                    value={rows}
                    onChange={(e) =>
                      setRows(Math.max(1, Number(e.target.value) || 1))
                    }
                  />
                </div>
              </div>
              <p className="text-right text-xs text-muted-foreground">
                预览：{cols} x {rows} 分割
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">操作</CardTitle>
              <CardDescription>快捷控制与导出</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onFit}
                >
                  重新适配
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onFlip}
                >
                  水平翻转
                </Button>
              </div>
              <Button type="button" className="w-full" onClick={onDownload}>
                导出 ZIP
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onReset}
              >
                重置
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    status.includes("错误") ? "bg-destructive" : "bg-emerald-500"
                  )}
                />
                <span>{status}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">裁剪预览</CardTitle>
              <CardDescription>实时缩略图</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={previewRef}
                className="h-32 w-full overflow-hidden rounded-md border bg-muted/40"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}