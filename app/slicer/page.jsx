'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import JSZip from 'jszip';
import 'cropperjs/dist/cropper.css';

const ratioPresets = [
  { label: '16:9', value: 1.7777778 },
  { label: '4:3', value: 1.3333333 },
  { label: '1:1', value: 1 }
];

export default function SlicerPage() {
  const dropZoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const previewRef = useRef(null);
  const cropperRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [status, setStatus] = useState('准备就绪');
  const [cols, setCols] = useState(6);
  const [rows, setRows] = useState(4);
  const [ratio, setRatio] = useState('free');
  const [hasImage, setHasImage] = useState(false);

  const getActiveRatio = () => (ratio === 'free' ? NaN : Number(ratio));

  // ... (keep existing cleanupCropper, revokeObjectUrl, updateGridOverlay, initCropper)

  const cleanupCropper = () => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
      overlayRef.current.innerHTML = '';
    }
  };

  const revokeObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const updateGridOverlay = useCallback(() => {
    const cropper = cropperRef.current;
    const overlay = overlayRef.current;
    if (!cropper || !overlay) return;
    const box = cropper.getCropBoxData();
    if (!box || !box.width || !box.height) {
      overlay.style.display = 'none';
      return;
    }
    overlay.style.display = 'block';
    overlay.style.left = `${box.left}px`;
    overlay.style.top = `${box.top}px`;
    overlay.style.width = `${box.width}px`;
    overlay.style.height = `${box.height}px`;
    overlay.style.pointerEvents = 'none';
    overlay.innerHTML = '';
    for (let c = 1; c < cols; c++) {
      const v = document.createElement('div');
      v.className = 'absolute border-l border-white h-full top-0 shadow-[1px_0_0_0_rgba(0,0,0,0.5)]';
      v.style.left = `${(c / cols) * 100}%`;
      overlay.appendChild(v);
    }
    for (let r = 1; r < rows; r++) {
      const h = document.createElement('div');
      h.className = 'absolute border-t border-white w-full left-0 shadow-[0_1px_0_0_rgba(0,0,0,0.5)]';
      h.style.top = `${(r / rows) * 100}%`;
      overlay.appendChild(h);
    }
  }, [cols, rows]);

  const initCropper = () => {
    const img = imageRef.current;
    if (!img) return;
    cropperRef.current = new Cropper(img, {
      aspectRatio: getActiveRatio(),
      viewMode: 1,
      autoCropArea: 1,
      background: false,
      dragMode: 'move',
      responsive: true,
      minContainerHeight: 400,
      minContainerWidth: 300,
      preview: previewRef.current,
      ready() {
        const cropper = cropperRef.current;
        if (!cropper) return;
        cropper.setAspectRatio(getActiveRatio());
        const canvasData = cropper.getCanvasData();
        cropper.setCropBoxData({
          left: canvasData.left,
          top: canvasData.top,
          width: canvasData.width,
          height: canvasData.height
        });
        updateGridOverlay();
        setStatus('图片已加载，网格激活');
      },
      crop: updateGridOverlay
    });
  };

  const loadImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('错误：仅支持图片文件');
      return;
    }
    revokeObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setHasImage(true);
    requestAnimationFrame(() => {
      if (imageRef.current) {
        imageRef.current.src = url;
      }
    });
    cleanupCropper();
    if (imageRef.current) {
      imageRef.current.onload = initCropper;
    }
  };

  const handleFiles = (files) => {
    if (!files || !files.length) return;
    loadImage(files[0]);
  };

  const handlePaste = useCallback((event) => {
    const items = event.clipboardData && event.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          loadImage(file);
          setStatus('已粘贴图片');
          return;
        }
      }
    }
    // Don't update status to 'empty' on every paste event as it might not be an image paste
  });

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return undefined;
    
    const onDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-blue-500', 'bg-blue-50');
    };
    const onLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    };
    const onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-blue-500', 'bg-blue-50');
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    };
    
    dropZone.addEventListener('dragenter', onDrag);
    dropZone.addEventListener('dragover', onDrag);
    dropZone.addEventListener('dragleave', onLeave);
    dropZone.addEventListener('dragend', onLeave);
    dropZone.addEventListener('drop', onDrop);
    window.addEventListener('paste', handlePaste);
    return () => {
      dropZone.removeEventListener('dragenter', onDrag);
      dropZone.removeEventListener('dragover', onDrag);
      dropZone.removeEventListener('dragleave', onLeave);
      dropZone.removeEventListener('dragend', onLeave);
      dropZone.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // ... (keep existing useEffects for cleanup and grid overlay)

  useEffect(
    () => () => {
      cleanupCropper();
      revokeObjectUrl();
    },
    []
  );

  useEffect(() => {
    updateGridOverlay();
  }, [cols, rows, updateGridOverlay]);

  const onRatioClick = (value) => {
    setRatio(value);
    if (cropperRef.current) {
      cropperRef.current.setAspectRatio(value === 'free' ? NaN : Number(value));
      setStatus(value === 'free' ? '自由比例' : `比例 ${value}`);
      updateGridOverlay();
    }
  };

  // ... (keep onDownload)
  const onDownload = async () => {
    const cropper = cropperRef.current;
    if (!cropper) {
      setStatus('请先加载图片');
      return;
    }
    const canvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
    if (!canvas) {
      setStatus('无有效裁剪区域');
      return;
    }
    const colsVal = Math.max(1, cols);
    const rowsVal = Math.max(1, rows);
    const canvasToBlob = (cvs) => new Promise((resolve) => cvs.toBlob(resolve, 'image/png', 0.96));
    setStatus(`正在处理 ${colsVal}x${rowsVal} 网格...`);
    const zip = new JSZip();
    const tileWBase = canvas.width / colsVal;
    const tileHBase = canvas.height / rowsVal;
    const tileCanvas = document.createElement('canvas');
    const ctx = tileCanvas.getContext('2d');
    for (let r = 0; r < rowsVal; r++) {
      for (let c = 0; c < colsVal; c++) {
        const sx = Math.round(c * tileWBase);
        const sy = Math.round(r * tileHBase);
        const sw = c === colsVal - 1 ? canvas.width - sx : Math.round(tileWBase);
        const sh = r === rowsVal - 1 ? canvas.height - sy : Math.round(tileHBase);
        tileCanvas.width = sw;
        tileCanvas.height = sh;
        ctx.clearRect(0, 0, sw, sh);
        ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
        const blob = await canvasToBlob(tileCanvas);
        if (blob) {
          const name = `cropped-c${c + 1}-r${r + 1}.png`;
          zip.file(name, blob);
        }
      }
    }
    try {
      setStatus('正在打包...');
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      link.href = url;
      link.download = `cropped-${colsVal}x${rowsVal}-grid.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus('完成');
    } catch (err) {
      console.error(err);
      setStatus('导出失败');
    }
  };

  const onReset = () => {
    cleanupCropper();
    if (imageRef.current) imageRef.current.src = '';
    setHasImage(false);
    setRatio('free');
    setStatus('重置完成');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onFlip = () => {
    const cropper = cropperRef.current;
    if (!cropper) return setStatus('无图片');
    const data = cropper.getData();
    const scaleX = data.scaleX === -1 ? 1 : -1;
    cropper.scaleX(scaleX);
    setStatus(scaleX === -1 ? '已翻转' : '已恢复');
  };

  const onFit = () => {
    const cropper = cropperRef.current;
    if (!cropper) return setStatus('无图片');
    cropper.reset();
    cropper.setAspectRatio(getActiveRatio());
    const canvasData = cropper.getCanvasData();
    cropper.setCropBoxData({ left: canvasData.left, top: canvasData.top, width: canvasData.width, height: canvasData.height });
    updateGridOverlay();
    setStatus('视图重置');
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">图片裁剪分片</h1>
          <p className="text-sm text-gray-500 mt-1">支持拖拽上传，自定义网格分割并导出 ZIP。</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">本地处理</span>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[1fr,300px] items-start">
        <section 
          ref={dropZoneRef} 
          className="vercel-card p-1 min-h-[600px] flex items-center justify-center relative bg-white overflow-hidden cursor-pointer"
          onClick={() => !hasImage && fileInputRef.current?.click()}
        >
          <div className="relative w-full h-full flex items-center justify-center rounded bg-gray-50 min-h-[590px] overflow-hidden">
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              hidden 
              onChange={(e) => handleFiles(e.target.files)} 
            />
            {!hasImage && (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground">拖拽图片到此处</h3>
                  <p className="text-sm text-gray-500 mt-1">或点击区域选择</p>
                </div>
                <button className="vercel-button vercel-button-secondary pointer-events-none">
                  选择文件
                </button>
              </div>
            )}
            <img
              ref={imageRef}
              alt="Preview"
              className={`max-w-full max-h-full object-contain select-none ${hasImage ? 'block' : 'hidden'}`}
            />
            <div ref={overlayRef} className="absolute pointer-events-none" />
          </div>
        </section>

        <aside className="space-y-6">
          {/* Aspect Ratio */}
          <div className="space-y-3">
            <h3 className="vercel-label">纵横比</h3>
            <div className="flex flex-wrap gap-2">
              {ratioPresets.map((item) => (
                <button
                  key={item.label}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md border transition-all ${ratio === String(item.value) ? 'bg-foreground text-background border-foreground' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  onClick={() => onRatioClick(String(item.value))}
                >
                  {item.label}
                </button>
              ))}
              <button
                className={`w-full px-3 py-1.5 text-sm rounded-md border transition-all ${ratio === 'free' ? 'bg-foreground text-background border-foreground' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                onClick={() => onRatioClick('free')}
              >
                自由 (默认)
              </button>
            </div>
          </div>

          {/* Grid Config */}
          <div className="space-y-3">
            <h3 className="vercel-label">网格配置</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">列数 (Cols)</label>
                <input
                  className="vercel-input w-full"
                  type="number"
                  min="1"
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">行数 (Rows)</label>
                <input
                  className="vercel-input w-full"
                  type="number"
                  min="1"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-right">预览：{cols} x {rows} 分割</p>
          </div>

          {/* Controls */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="vercel-label">操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="vercel-button vercel-button-secondary text-xs" onClick={onFit}>
                重新适配
              </button>
              <button className="vercel-button vercel-button-secondary text-xs" onClick={onFlip}>
                水平翻转
              </button>
            </div>
            <button className="vercel-button vercel-button-primary w-full mt-2" onClick={onDownload}>
              导出 ZIP
            </button>
            <button className="vercel-button vercel-button-secondary w-full" onClick={onReset}>
              重置
            </button>
            
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${status.includes('错误') ? 'bg-red-500' : 'bg-green-500'}`}></span>
              <span>{status}</span>
            </div>
          </div>

          {/* Preview Thumbnail */}
          <div className="space-y-2">
            <h3 className="vercel-label">裁剪预览</h3>
            <div ref={previewRef} className="border border-gray-200 rounded-md bg-gray-50 h-32 overflow-hidden" />
          </div>
        </aside>
      </main>
    </div>
  );
}