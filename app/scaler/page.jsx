'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function ScalerPage() {
  const dropzoneRef = useRef(null);
  const [size, setSize] = useState(240);
  const [outputs, setOutputs] = useState([]);
  const [info, setInfo] = useState('准备就绪');
  const [canClipboardRead, setCanClipboardRead] = useState(false);

  const buildFileName = (name, w, h) => {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    return `${base}_${w}x${h}.png`;
  };

  const addResult = (fileName, dataUrl, original, resized) => {
    const outputName = buildFileName(fileName, resized.width, resized.height);
    setOutputs((prev) => [
      { name: outputName, dataUrl, original, resized },
      ...prev
    ]);
  };

  const processImage = (file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const target = Math.max(parseInt(size, 10) || 240, 1);
        const scale = target / Math.max(img.width, img.height);
        const newWidth = Math.round(img.width * scale);
        const newHeight = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        const dataUrl = canvas.toDataURL('image/png');
        addResult(file.name, dataUrl, { width: img.width, height: img.height }, { width: newWidth, height: newHeight });
        setInfo(`已生成 ${outputs.length + 1} 张图片`);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      setInfo('未检测到图片文件');
      return;
    }
    setInfo(`正在处理 ${files.length} 张图片…`);
    files.forEach(processImage);
  };

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items || [];
    const images = [];
    for (const item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) images.push(file);
      }
    }
    if (images.length) {
      e.preventDefault();
      handleFiles(images);
    }
  }, []);

  useEffect(() => {
    setCanClipboardRead(typeof navigator !== 'undefined' && !!navigator.clipboard?.read);
    const dropzone = dropzoneRef.current;
    if (!dropzone) return undefined;
    const onDrag = (e) => {
      e.preventDefault();
      dropzone.classList.add('border-sky-300', 'bg-blue-50');
    };
    const onLeave = (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-sky-300', 'bg-blue-50');
    };
    const onDrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-sky-300', 'bg-blue-50');
      handleFiles(e.dataTransfer.files);
    };
    dropzone.addEventListener('dragenter', onDrag);
    dropzone.addEventListener('dragover', onDrag);
    dropzone.addEventListener('dragleave', onLeave);
    dropzone.addEventListener('dragend', onLeave);
    dropzone.addEventListener('drop', onDrop);
    window.addEventListener('paste', handlePaste);
    return () => {
      dropzone.removeEventListener('dragenter', onDrag);
      dropzone.removeEventListener('dragover', onDrag);
      dropzone.removeEventListener('dragleave', onLeave);
      dropzone.removeEventListener('dragend', onLeave);
      dropzone.removeEventListener('drop', onDrop);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  useEffect(() => {
    setInfo(outputs.length ? `已生成 ${outputs.length} 张图片` : '准备就绪');
  }, [outputs]);

  const importFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      setInfo('当前浏览器不支持直接读取剪贴板图片');
      return;
    }
    try {
      setInfo('正在读取剪贴板...');
      const items = await navigator.clipboard.read();
      const images = [];
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          images.push(new File([blob], `clipboard.${type.split('/')[1] || 'png'}`, { type }));
        }
      }
      if (!images.length) {
        setInfo('剪贴板中未发现图片');
        return;
      }
      handleFiles(images);
    } catch (err) {
      console.error(err);
      setInfo('读取剪贴板失败，请检查权限');
    }
  };

  const clearResults = () => {
    setOutputs([]);
    setInfo('已清空，等待新图片');
  };

  const concatUint8 = (arrays) => {
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

  const crc32 = (data) => {
    let crc = 0 ^ -1;
    for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
    return (crc ^ -1) >>> 0;
  };

  const dosTimeDate = (date = new Date()) => {
    const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
    const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time, date: dosDate };
  };

  const createZip = async () => {
    const encoder = new TextEncoder();
    const parts = [];
    const centralParts = [];
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
    const zipArray = concatUint8([...parts, ...centralParts, new Uint8Array(eocd.buffer)]);
    return new Blob([zipArray], { type: 'application/zip' });
  };

  const downloadZip = async () => {
    if (!outputs.length) return;
    setInfo('正在打包 ZIP...');
    try {
      const zipBlob = await createZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'images.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('打包失败，请重试');
    } finally {
      setInfo(outputs.length ? `可打包 ${outputs.length} 张` : '准备就绪');
    }
  };

  return (
    <div className="space-y-4 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-5">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 text-white font-black grid place-items-center shadow">IT</div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">图片等比例缩放到指定最大尺寸</h1>
          <p className="text-sm text-slate-600">把图片最长边缩放到指定像素（默认 240），保持宽高比，支持批量、拖拽和直接粘贴。</p>
        </div>
      </header>

      <main className="space-y-4">
        <section className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl shadow p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold">
              <span>目标最长边(px)</span>
              <input
                id="sizeInput"
                type="number"
                min="1"
                step="1"
                value={size}
                onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 border-0 bg-transparent focus:outline-none focus:ring-0 text-base text-slate-900"
              />
            </label>
            <label htmlFor="fileInput" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold shadow hover:shadow-lg cursor-pointer">
              📁 选择图片（可多选）
            </label>
            <input id="fileInput" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            <button
              type="button"
              onClick={importFromClipboard}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-800 bg-slate-50 disabled:opacity-50"
              disabled={!canClipboardRead}
              title={canClipboardRead ? '从剪贴板直接读取图片' : '当前浏览器不支持直接读取剪贴板图片'}
            >
              从剪贴板导入
            </button>
            <button
              id="zipBtn"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold shadow disabled:opacity-50"
              type="button"
              disabled={!outputs.length}
              onClick={downloadZip}
            >
              下载 ZIP（全部）
            </button>
            <button id="clearBtn" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-800 bg-slate-50" type="button" onClick={clearResults}>
              清空结果
            </button>
            <div className="text-xs text-slate-600">或直接拖拽图片/截图到下面区域，或在页面上粘贴</div>
          </div>

          <div ref={dropzoneRef} className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center p-8 transition" data-dropzone>
            <strong className="text-slate-800">把图片拖到这里</strong>
            <div className="text-sm text-slate-600">支持批量，粘贴截图会自动处理</div>
          </div>
          <div id="info" className="text-sm text-slate-600">{info}</div>
        </section>

        <section id="results" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {outputs.map((item) => (
            <article key={item.name} className="bg-white border border-slate-200 rounded-xl shadow p-3 space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">{item.name}</div>
              <div className="border border-slate-200 rounded-lg bg-white grid place-items-center min-h-[140px]">
                <img src={item.dataUrl} alt="缩放后的图片预览" className="w-full h-full max-h-[320px] object-contain" />
              </div>
              <div className="flex justify-between flex-wrap gap-2 text-xs text-slate-600">
                <span>原始：{item.original.width} × {item.original.height}</span>
                <span>输出：{item.resized.width} × {item.resized.height}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <a
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold shadow hover:shadow-lg"
                  href={item.dataUrl}
                  download={item.name}
                >
                  下载 PNG
                </a>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold"
                  onClick={async (e) => {
                    const btn = e.currentTarget;
                    btn.disabled = true;
                    btn.textContent = '复制中…';
                    try {
                      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                        const blob = await (await fetch(item.dataUrl)).blob();
                        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                        btn.textContent = '已复制';
                      } else if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(item.dataUrl);
                        btn.textContent = '已复制';
                      } else {
                        throw new Error('浏览器不支持 Clipboard API');
                      }
                    } catch (err) {
                      console.error(err);
                      btn.textContent = '复制失败';
                    } finally {
                      setTimeout(() => {
                        btn.textContent = '复制图片';
                        btn.disabled = false;
                      }, 1200);
                    }
                  }}
                >
                  复制图片
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
