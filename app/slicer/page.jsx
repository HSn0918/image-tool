'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import JSZip from 'jszip';
import 'cropperjs/dist/cropper.css';

const ratioPresets = [
  { label: '16 : 9', value: 1.7777778 },
  { label: '4 : 3', value: 1.3333333 },
  { label: '1 : 1', value: 1 }
];

export default function SlicerPage() {
  const dropZoneRef = useRef(null);
  const imageRef = useRef(null);
  const overlayRef = useRef(null);
  const previewRef = useRef(null);
  const cropperRef = useRef(null);
  const objectUrlRef = useRef(null);

  const [status, setStatus] = useState('等待图片加载... 默认全图裁成 6×4 张');
  const [cols, setCols] = useState(6);
  const [rows, setRows] = useState(4);
  const [ratio, setRatio] = useState('free');
  const [hasImage, setHasImage] = useState(false);

  const getActiveRatio = () => (ratio === 'free' ? NaN : Number(ratio));

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
      v.className = 'grid-line v';
      v.style.left = `${(c / cols) * 100}%`;
      overlay.appendChild(v);
    }
    for (let r = 1; r < rows; r++) {
      const h = document.createElement('div');
      h.className = 'grid-line h';
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
        setStatus('图片已加载，默认全图裁成网格，可调整比例或网格数量');
      },
      crop: updateGridOverlay
    });
  };

  const loadImage = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('请选择图片文件（JPG/PNG/WebP 等）');
      return;
    }
    revokeObjectUrl();
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    // 确保 img 已挂载再设定 src
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
          setStatus('已从剪贴板粘贴图片');
          return;
        }
      }
    }
    setStatus('剪贴板中未发现图片');
  }, []);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return undefined;
    const onDrag = (e) => {
      e.preventDefault();
      dropZone.classList.add('ring-2', 'ring-sky-200');
    };
    const onLeave = (e) => {
      e.preventDefault();
      dropZone.classList.remove('ring-2', 'ring-sky-200');
    };
    const onDrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('ring-2', 'ring-sky-200');
      handleFiles(e.dataTransfer.files);
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
      setStatus(value === 'free' ? '已切换为自由比例' : '已切换比例');
      updateGridOverlay();
    }
  };

  const onDownload = async () => {
    const cropper = cropperRef.current;
    if (!cropper) {
      setStatus('请先加载并裁剪图片');
      return;
    }
    const canvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
    if (!canvas) {
      setStatus('请先在图片上创建裁剪区域');
      return;
    }
    const colsVal = Math.max(1, cols);
    const rowsVal = Math.max(1, rows);
    const canvasToBlob = (cvs) => new Promise((resolve) => cvs.toBlob(resolve, 'image/png', 0.96));
    setStatus(`正在生成 ${colsVal}×${rowsVal} 分片并打包...`);
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
      setStatus('正在压缩 ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);
      link.href = url;
      link.download = `cropped-${colsVal}x${rowsVal}-grid.zip`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setStatus('已完成导出');
    } catch (err) {
      console.error(err);
      setStatus('打包失败，请重试');
    }
  };

  const onReset = () => {
    cleanupCropper();
    if (imageRef.current) imageRef.current.src = '';
    setHasImage(false);
    setRatio('free');
    setStatus('已重置，重新拖拽或选择图片，默认全图裁成网格');
  };

  const onFlip = () => {
    const cropper = cropperRef.current;
    if (!cropper) return setStatus('请先加载图片');
    const data = cropper.getData();
    const scaleX = data.scaleX === -1 ? 1 : -1;
    cropper.scaleX(scaleX);
    setStatus(scaleX === -1 ? '已镜像翻转' : '已恢复原始方向');
  };

  const onFit = () => {
    const cropper = cropperRef.current;
    if (!cropper) return setStatus('请先加载图片');
    cropper.reset();
    cropper.setAspectRatio(getActiveRatio());
    const canvasData = cropper.getCanvasData();
    cropper.setCropBoxData({ left: canvasData.left, top: canvasData.top, width: canvasData.width, height: canvasData.height });
    updateGridOverlay();
    setStatus('已重新适配并保持当前比例');
  };

  return (
    <div className="space-y-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-5">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-white font-black grid place-items-center shadow">IT</div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">图片裁剪分片工具</h1>
          <p className="text-sm text-slate-600">单文件运行 · 拖拽/点击上传 · 自动 ZIP 打包</p>
        </div>
      </header>

      <main className="grid gap-4 lg:grid-cols-[1fr,320px] items-start">
        <section ref={dropZoneRef} className="relative bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow-lg p-4 min-h-[540px] flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center border border-dashed border-slate-200 rounded-xl bg-white/80 overflow-hidden">
            <input type="file" id="fileInput" accept="image/*" hidden onChange={(e) => handleFiles(e.target.files)} />
            {!hasImage && (
              <div className="text-center text-slate-600 space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">拖拽图片到此处</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">或点击选择文件</div>
                <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow hover:shadow-lg transition" onClick={() => document.getElementById('fileInput')?.click()}>
                  选择图片
                </button>
                <div className="text-xs text-slate-500">支持 JPG · PNG · WebP · 可直接粘贴</div>
              </div>
            )}
            <img
              ref={imageRef}
              alt="预览"
              className={`max-w-full max-h-full object-contain select-none ${hasImage ? 'block' : 'hidden'}`}
            />
            <div ref={overlayRef} className="grid-overlay pointer-events-none" />
          </div>
        </section>

        <aside className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl shadow p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">比例预设</h3>
            <div className="grid grid-cols-2 gap-2" id="ratioGroup">
              {ratioPresets.map((item) => (
                <button
                  key={item.label}
                  className={`px-3 py-2 rounded-lg border ${ratio === String(item.value) ? 'bg-blue-50 border-blue-300' : 'border-slate-200 hover:border-sky-300'}`}
                  data-ratio={item.value}
                  onClick={() => onRatioClick(String(item.value))}
                >
                  {item.label}
                </button>
              ))}
              <button
                className={`px-3 py-2 rounded-lg border ${ratio === 'free' ? 'bg-blue-50 border-blue-300' : 'border-slate-200 hover:border-sky-300'}`}
                data-ratio="free"
                onClick={() => onRatioClick('free')}
              >
                自由比例（默认全图）
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">操作</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 rounded-lg border border-slate-200 hover:border-sky-300" onClick={onFit}>
                重新适配
              </button>
              <button className="px-3 py-2 rounded-lg border border-slate-200 hover:border-sky-300" onClick={onFlip}>
                镜像翻转
              </button>
            </div>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow hover:shadow-lg transition" onClick={onDownload}>
                导出裁剪结果为 ZIP
              </button>
              <button className="w-full px-4 py-2 rounded-lg bg-amber-100 text-amber-800 font-semibold border border-amber-200" onClick={onReset}>
                重置整个画布
              </button>
              <div className="text-xs text-slate-600" id="status">
                {status}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow p-4 space-y-3">
            <h3 className="font-semibold text-slate-800">切分网格</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm text-slate-700 space-y-1">
                <span>列数</span>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  type="number"
                  min="1"
                  value={cols}
                  onChange={(e) => setCols(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <label className="text-sm text-slate-700 space-y-1">
                <span>行数</span>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  type="number"
                  min="1"
                  value={rows}
                  onChange={(e) => setRows(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
            </div>
            <p className="text-xs text-slate-600">导出时按网格将当前裁剪区域分割成列×行张数</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow p-4 space-y-2">
            <h3 className="font-semibold text-slate-800">裁剪预览</h3>
            <div ref={previewRef} className="border border-dashed border-slate-200 rounded-xl bg-slate-50 h-40 overflow-hidden preview" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow p-4 space-y-1 text-xs text-slate-600 leading-relaxed">
            <p>• 拖拽图片到左侧画布，或点击「选择图片」。</p>
            <p>• 默认全图裁成 6×4 张，可调整比例或网格列/行数后导出。</p>
            <p>• 支持直接粘贴剪贴板图片 (Cmd/Ctrl+V)。</p>
            <p>• 选择比例后，可拖动/缩放裁剪框；滚轮可缩放，双击可放大。</p>
            <p>• 导出时会按网格生成高清 PNG 分片，并打包为 ZIP 下载。</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
