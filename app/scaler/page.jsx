'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export default function ScalerPage() {
  const dropzoneRef = useRef(null);
  const [size, setSize] = useState(240);
  const [outputs, setOutputs] = useState([]);
  const [info, setInfo] = useState('系统就绪');
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
        setInfo(`已处理 ${outputs.length + 1} 张图片`);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) {
      setInfo('错误：未检测到图片文件');
      return;
    }
    setInfo(`正在处理 ${files.length} 张图片...`);
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
      dropzone.classList.add('border-foreground', 'bg-gray-50');
    };
    const onLeave = (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-foreground', 'bg-gray-50');
    };
    const onDrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('border-foreground', 'bg-gray-50');
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
    setInfo(outputs.length ? `已生成 ${outputs.length} 张图片` : '系统就绪');
  }, [outputs]);

  const importFromClipboard = async () => {
    if (!navigator.clipboard?.read) {
      setInfo('错误：剪贴板访问被拒绝');
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
        setInfo('剪贴板中无图片');
        return;
      }
      handleFiles(images);
    } catch (err) {
      console.error(err);
      setInfo('剪贴板读取失败');
    }
  };

  const clearResults = () => {
    setOutputs([]);
    setInfo('已清空');
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
      alert('打包失败');
    } finally {
      setInfo(outputs.length ? `可打包 ${outputs.length} 张` : '系统就绪');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">等比例缩放器</h1>
          <p className="text-sm text-gray-500 mt-1">长边缩放 // 批量处理 // ZIP 导出</p>
        </div>
      </header>

      <div className="vercel-card p-6 space-y-6 bg-white">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
             <label className="vercel-label">目标长边 (px)</label>
             <div className="flex items-center gap-2">
               <input
                 id="sizeInput"
                 type="number"
                 min={1}
                 value={size}
                 onChange={(e) => setSize(Math.max(1, Number(e.target.value) || 1))}
                 className="vercel-input w-32"
               />
             </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
             <label htmlFor="fileInput" className="vercel-button vercel-button-secondary cursor-pointer flex items-center gap-2">
               <span>加载图片</span>
             </label>
             <input id="fileInput" type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
             
             <button className="vercel-button vercel-button-secondary" onClick={importFromClipboard} disabled={!canClipboardRead}>
               粘贴剪贴板
             </button>

             <div className="w-px h-8 bg-gray-200 mx-2"></div>

             <button 
               className="vercel-button vercel-button-primary" 
               disabled={!outputs.length} 
               onClick={downloadZip}
             >
               下载 ZIP
             </button>
             <button className="vercel-button vercel-button-secondary text-red-600 hover:border-red-200 hover:bg-red-50" onClick={clearResults}>
               清空
             </button>
          </div>
        </div>
        
        <div ref={dropzoneRef} className="border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-center p-10 transition-all duration-200 hover:border-gray-300" data-dropzone>
          <strong className="text-foreground text-base block mb-2">拖拽图片到此处</strong>
          <div className="text-xs text-gray-500 uppercase tracking-widest">支持批量处理</div>
        </div>
        <div id="info" className="text-xs text-gray-400 font-mono text-center pt-2">{info}</div>
      </div>

      <section id="results" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {outputs.map((item) => (
          <div key={item.name} className="vercel-card p-3 group hover:shadow-md">
            <div className="flex justify-between items-start mb-3">
               <span className="text-[10px] px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium truncate max-w-[150px] border border-gray-200">
                 {item.name}
               </span>
            </div>
            
            <div className="border border-gray-100 rounded bg-gray-50 grid place-items-center h-40 overflow-hidden mb-3 relative">
              <img src={item.dataUrl} alt="preview" className="max-w-full max-h-full object-contain p-2" />
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 font-mono mb-3 border-b border-gray-100 pb-2">
              <span>原: {item.original.width}x{item.original.height}</span>
              <span className="text-foreground font-semibold">新: {item.resized.width}x{item.resized.height}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a href={item.dataUrl} download={item.name} className="vercel-button vercel-button-secondary text-[10px] py-1 px-1 h-8">
                下载
              </a>
              <button
                className="vercel-button vercel-button-secondary text-[10px] py-1 px-1 h-8"
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  btn.disabled = true;
                  const originalText = btn.innerText;
                  btn.innerText = '已复制';
                  try {
                    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                      const blob = await (await fetch(item.dataUrl)).blob();
                      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    } else if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(item.dataUrl);
                    }
                  } catch (err) {
                    console.error(err);
                    btn.innerText = '错误';
                  } finally {
                    setTimeout(() => {
                      btn.innerText = '复制';
                      btn.disabled = false;
                    }, 1200);
                  }
                }}
              >
                复制
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}