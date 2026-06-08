import React, { useState, useRef, useEffect } from 'react';
import { uploadProductImage, deleteProductImageByUrl } from '../../firebase';
import { 
  Upload, Trash2, Star, Loader2, Image as ImageIcon, X, 
  RotateCw, Check, Plus, ZoomIn, ZoomOut, Move
} from 'lucide-react';

interface ProductImageUploadProps {
  mainImage: string;
  setMainImage: (url: string) => void;
  images: string[];
  setImages: (urls: string[]) => void;
}

interface PendingImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  rotation: number; // -180 to 180 degrees slider
  zoom: number; // scale multiplier, e.g. 0.5 to 3.0
  offsetX: number; // pan X coordinate
  offsetY: number; // pan Y coordinate
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  mainImage,
  setMainImage,
  images,
  setImages
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: boolean }[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [activePendingIdx, setActivePendingIdx] = useState<number | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Drag to pan image state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const originalOffset = useRef({ x: 0, y: 0 });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const queueFilesForEditing = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    const newPending: PendingImage[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 10),
      originalFile: file,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
      zoom: 1.0,
      offsetX: 0,
      offsetY: 0
    }));

    setPendingImages(prev => {
      const updated = [...prev, ...newPending];
      // Set active to the first new item
      if (prev.length === 0) {
        setActivePendingIdx(0);
      }
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      queueFilesForEditing(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      queueFilesForEditing(e.target.files);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  const triggerEditInputClick = () => {
    editFileInputRef.current?.click();
  };

  // Clean raw ObjectURLs to prevent memory leakage
  useEffect(() => {
    return () => {
      pendingImages.forEach(img => {
        if (img.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [pendingImages]);

  // Drag and pan handler for desktop/mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (activePendingIdx !== null && pendingImages[activePendingIdx]) {
      originalOffset.current = { 
        x: pendingImages[activePendingIdx].offsetX, 
        y: pendingImages[activePendingIdx].offsetY 
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || activePendingIdx === null) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    
    setPendingImages(prev => {
      const copy = [...prev];
      const curr = copy[activePendingIdx];
      if (curr) {
        curr.offsetX = originalOffset.current.x + deltaX;
        curr.offsetY = originalOffset.current.y + deltaY;
      }
      return copy;
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Drag and pan handler for mobile/touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    if (activePendingIdx !== null && pendingImages[activePendingIdx]) {
      originalOffset.current = { 
        x: pendingImages[activePendingIdx].offsetX, 
        y: pendingImages[activePendingIdx].offsetY 
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || activePendingIdx === null || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.current.x;
    const deltaY = e.touches[0].clientY - dragStart.current.y;
    
    setPendingImages(prev => {
      const copy = [...prev];
      const curr = copy[activePendingIdx];
      if (curr) {
        curr.offsetX = originalOffset.current.x + deltaX;
        curr.offsetY = originalOffset.current.y + deltaY;
      }
      return copy;
    });
  };

  const resetPositionAndScale = () => {
    if (activePendingIdx === null) return;
    setPendingImages(prev => {
      const copy = [...prev];
      const curr = copy[activePendingIdx];
      if (curr) {
        curr.rotation = 0;
        curr.zoom = 1.0;
        curr.offsetX = 0;
        curr.offsetY = 0;
      }
      return copy;
    });
  };

  // Apply edits to the file using HTML5 Canvas before uploading
  const processAndCreateBlob = (pendingImg: PendingImage): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(pendingImg.originalFile);
            return;
          }

          // Standard Shopify aspect ratio is 4:5 (e.g. 800 x 1000 pixels)
          canvas.width = 800;
          canvas.height = 1000;

          // Fill background with elegant workspace white
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Calculate image cover size (object-cover)
          let drawW = img.width;
          let drawH = img.height;
          const ratio = Math.max(canvas.width / drawW, canvas.height / drawH);
          drawW = drawW * ratio;
          drawH = drawH * ratio;

          // Scale offsets from screen crop viewport reference width (260px) to full canvas width (800px)
          const scaleFactor = canvas.width / 260;
          const canvasOffsetX = pendingImg.offsetX * scaleFactor;
          const canvasOffsetY = pendingImg.offsetY * scaleFactor;

          // Move cursor to center of output canvas, translating in outer coordinate space first (matching CSS transform order)
          ctx.translate(canvas.width / 2 + canvasOffsetX, canvas.height / 2 + canvasOffsetY);

          // Apply manual rotation (degrees to radians)
          ctx.rotate((pendingImg.rotation * Math.PI) / 180);

          // Apply manual zoom scale
          ctx.scale(pendingImg.zoom, pendingImg.zoom);

          // Draw image centered at origin
          ctx.drawImage(
            img, 
            -drawW / 2, 
            -drawH / 2, 
            drawW, 
            drawH
          );

          // Produce compressed, high-quality, lightweight file
          canvas.toBlob((blob) => {
            if (blob) {
              const finalIndexedFile = new File([blob], pendingImg.originalFile.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(finalIndexedFile);
            } else {
              resolve(pendingImg.originalFile);
            }
          }, 'image/jpeg', 0.88);
        };

        img.onerror = (err) => {
          reject(err);
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = (err) => {
        reject(err);
      };

      reader.readAsDataURL(pendingImg.originalFile);
    });
  };

  // Process manual edits and upload final files to Firebase Storage
  const handleUploadAllPending = async () => {
    if (pendingImages.length === 0) return;

    const newUploading = pendingImages.map(f => ({ name: f.originalFile.name, progress: true }));
    setUploadingFiles(prev => [...prev, ...newUploading]);

    const queueToProcess = [...pendingImages];
    // Keep pendingImages intact during processing so the UI remains stable and 
    // cleanup useEffect is NOT triggered prematurely!
    const uploadedUrls: string[] = [];

    for (const item of queueToProcess) {
      try {
        const processedFile = await processAndCreateBlob(item);
        const downloadUrl = await uploadProductImage(processedFile);
        if (downloadUrl) {
          uploadedUrls.push(downloadUrl);
        }
      } catch (err) {
        console.error("Failed to process and upload manual edits:", item.originalFile.name, err);
        alert(`خطأ في رفع الملف المعدل: ${item.originalFile.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.name !== item.originalFile.name));
      }
    }

    // Now, after ALL items are processed, safe to clear pendingImages and revoke blob URLs!
    queueToProcess.forEach(item => {
      if (item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setPendingImages([]);
    setActivePendingIdx(null);

    if (uploadedUrls.length > 0) {
      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      if (!mainImage) {
        setMainImage(uploadedUrls[0]);
      }
    }
  };

  const handleRemoveImage = (url: string, index: number) => {
    setDeletingImageUrl(url);
  };

  const handleSetMain = (url: string) => {
    setMainImage(url);
  };

  const activePendingImage = activePendingIdx !== null ? pendingImages[activePendingIdx] : null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100">
        <span className="text-[14px] font-semibold text-brand-text flex items-center gap-2">
          <ImageIcon size={18} className="text-neutral-400" />
          وسائط وصور المنتج (Media & Images)
        </span>
        <span className="text-[11px] text-neutral-400 font-mono">
          {images.length} صور مرفوعة
        </span>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerInputClick}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
          dragActive 
            ? 'border-neutral-800 bg-neutral-50 scale-[0.99]' 
            : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/50 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleChange}
        />
        
        <div className="p-3 bg-neutral-100 rounded-full text-neutral-600 group-hover:scale-110 transition-transform">
          <Upload size={22} className="text-brand-text" />
        </div>
        
        <div>
          <p className="text-[14px] font-medium text-brand-text font-sans">
            اسحب الصور وأفلتها هنا، أو اضغط للتصفح وتهيئة الصور يدوياً
          </p>
          <p className="text-[12px] text-neutral-400 mt-1">
            ميزات مرنة: يمكنك تكبير/تصغير وتدوير محاذاة الصورة سحب وإمالة يدوية سهلة
          </p>
        </div>
      </div>

      {/* Manual Interactive Editor Setup Workshop Modal */}
      {pendingImages.length > 0 && activePendingImage && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-[999] flex items-start md:items-center justify-center p-4 md:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px] my-auto">
            
            {/* Top Workspace Canvas layout with move pointer cursor */}
            <div className="flex-1 bg-neutral-100 p-4 md:p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-l border-neutral-200">
              <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-brand-text/95 backdrop-blur-sm text-white text-[10px] md:text-xs px-2.5 py-1 md:px-3 md:py-1.5 rounded-full font-sans font-semibold tracking-wide flex items-center gap-1 z-20 shadow-sm border border-white/5">
                <Move size={12} className="shrink-0" />
                اسحب الصورة بالماوس أو الإصبع للتحريك والوزن
              </div>
              
              {/* Box acting as crop window, aspect 4:5 */}
              <div 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
                className="w-full max-w-[320px] aspect-[4/5] bg-neutral-200 rounded-2xl overflow-hidden shadow-inner border border-neutral-300 relative flex items-center justify-center cursor-move select-none"
              >
                {/* Draggable image scaled in centered box, showing beautiful overflow behind mask */}
                <div 
                  style={{
                    transform: `translate(${activePendingImage.offsetX}px, ${activePendingImage.offsetY}px) rotate(${activePendingImage.rotation}deg) scale(${activePendingImage.zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease'
                  }}
                  className="w-[260px] h-[325px] flex items-center justify-center pointer-events-none"
                >
                  <img
                    src={activePendingImage.previewUrl}
                    alt="Manual scale adjustment"
                    className="w-full h-full object-cover pointer-events-none rounded-none shadow-md"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Crop boundary overlay mask to guide the user precisely */}
                <div className="absolute w-[260px] h-[325px] border-2 border-dashed border-white pointer-events-none z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] rounded-none">
                  {/* Outer safety high-contrast separator */}
                  <div className="absolute -inset-[1px] border border-black/20 pointer-events-none"></div>
                  {/* Corner focus brackets */}
                  <div className="absolute -top-[3px] -left-[3px] w-4 h-4 border-t-4 border-l-4 border-white"></div>
                  <div className="absolute -top-[3px] -right-[3px] w-4 h-4 border-t-4 border-r-4 border-white"></div>
                  <div className="absolute -bottom-[3px] -left-[3px] w-4 h-4 border-b-4 border-l-4 border-white"></div>
                  <div className="absolute -bottom-[3px] -right-[3px] w-4 h-4 border-b-4 border-r-4 border-white"></div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[14px] font-semibold text-brand-text truncate max-w-[280px]">
                  {activePendingImage.originalFile.name}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5 font-sans">
                  {(activePendingImage.originalFile.size / (1024 * 1024)).toFixed(2)} MB • أداة وزن يدوي فائقة المرونة
                </p>
              </div>
            </div>

            {/* Editing Panel (Zooming scale and rotation degree slider) */}
            <div className="w-full md:w-[360px] p-6 flex flex-col justify-between bg-white overflow-y-auto h-full space-y-6">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-1.5 font-sans">
                      <RotateCw size={18} className="text-brand-text shrink-0 animate-spin-slow" />
                      التحكم اليدوي والمحاذاة
                    </h3>
                    <p className="text-[12px] text-neutral-400 mt-1 font-sans">
                      عدّل اتجاه وزوم وحجم الصورة قبل رفعها للخادم
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("هل تريد إلغاء وإغلاق مسودة العمل؟")) {
                        setPendingImages([]);
                        setActivePendingIdx(null);
                      }
                    }}
                    className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <hr className="my-4 border-neutral-100" />

                {/* Adjustments Stack */}
                <div className="space-y-6">
                  
                  {/* Zoom Manual Section */}
                  <div>
                    <div className="flex justify-between text-[12px] font-semibold mb-2 text-neutral-500">
                      <span>التكبير والتصغير اليدوي (Manual Zoom)</span>
                      <span className="text-brand-text font-mono">{(activePendingImage.zoom * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            if (curr) curr.zoom = Math.max(0.4, Number((curr.zoom - 0.1).toFixed(1)));
                            return copy;
                          });
                        }}
                        className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 select-none text-neutral-500"
                      >
                        <ZoomOut size={16} />
                      </button>

                      <input
                        type="range"
                        min="0.4"
                        max="3.0"
                        step="0.05"
                        value={activePendingImage.zoom}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setPendingImages(prev => {
                            const copy = [...prev];
                            copy[activePendingIdx!].zoom = val;
                            return copy;
                          });
                        }}
                        className="flex-1 h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand-text"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            if (curr) curr.zoom = Math.min(3.0, Number((curr.zoom + 0.1).toFixed(1)));
                            return copy;
                          });
                        }}
                        className="p-2 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 select-none text-neutral-500"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Precise Manual Rotation degree slider */}
                  <div>
                    <div className="flex justify-between text-[12px] font-semibold mb-2 text-neutral-500">
                      <span>التدوير اليدوي بالإمالة (Manual Rotation)</span>
                      <span className="text-brand-text font-mono">{activePendingImage.rotation}°</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            if (curr) curr.rotation = (curr.rotation - 45 + 360) % 360;
                            if (curr.rotation > 180) curr.rotation -= 360;
                            return copy;
                          });
                        }}
                        className="p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 text-[11px]"
                      >
                        -45°
                      </button>

                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={activePendingImage.rotation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setPendingImages(prev => {
                            const copy = [...prev];
                            copy[activePendingIdx!].rotation = val;
                            return copy;
                          });
                        }}
                        className="flex-1 h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand-text"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            if (curr) curr.rotation = (curr.rotation + 45) % 360;
                            if (curr.rotation > 180) curr.rotation -= 360;
                            return copy;
                          });
                        }}
                        className="p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 text-[11px]"
                      >
                        +45°
                      </button>
                    </div>
                  </div>

                  {/* Reset view options */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resetPositionAndScale}
                      className="text-[12px] text-red-500 font-semibold hover:underline bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100"
                    >
                      إعادة تعيين المحاذاة والوزن الافتراضي
                    </button>
                  </div>

                </div>

                <hr className="my-6 border-neutral-100" />

                {/* Queue switcher */}
                <div>
                  <div className="flex justify-between items-center text-[11px] font-bold text-neutral-400 mb-2 font-sans uppercase">
                    <span>قائمة الصور ({pendingImages.length} صور)</span>
                    <button
                      type="button"
                      onClick={triggerEditInputClick}
                      className="text-[11px] text-brand-text font-bold flex items-center gap-0.5 hover:underline"
                    >
                      <Plus size={12} />
                      إضافة غيرها
                    </button>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files) queueFilesForEditing(e.target.files);
                      }}
                    />
                  </div>

                  <div className="flex gap-2 py-1 overflow-x-auto scrollbar-thin">
                    {pendingImages.map((img, index) => {
                      const isActive = activePendingIdx === index;
                      return (
                        <div key={img.id} className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setIsDragging(false);
                              setActivePendingIdx(index);
                            }}
                            className={`w-12 h-15 rounded-lg overflow-hidden border-2 bg-neutral-50 transition-all ${
                              isActive ? 'border-brand-text ring-2 ring-brand-text/10 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <img
                              src={img.previewUrl}
                              alt="Draft thumbnail icon"
                              style={{
                                transform: `rotate(${img.rotation}deg) scale(${img.zoom})`
                              }}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (img.previewUrl.startsWith('blob:')) {
                                URL.revokeObjectURL(img.previewUrl);
                              }
                              setPendingImages(prev => {
                                const filtered = prev.filter((_, idx) => idx !== index);
                                if (filtered.length === 0) {
                                  setActivePendingIdx(null);
                                } else if (activePendingIdx! >= filtered.length) {
                                  setActivePendingIdx(filtered.length - 1);
                                }
                                return filtered;
                              });
                            }}
                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="pt-4 border-t border-neutral-100 flex gap-2 w-full">
                {showCancelConfirm ? (
                  <div className="flex-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-3 text-neutral-500 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-[12px] font-medium transition-colors text-center"
                    >
                      تراجع
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingImages([]);
                        setActivePendingIdx(null);
                        setShowCancelConfirm(false);
                      }}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[12px] font-medium transition-colors text-center"
                    >
                      نعم، إلغاء الكل
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex-1 py-3 border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-xl text-[13px] font-medium transition-colors text-center"
                  >
                    إلغاء الكل
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUploadAllPending}
                  className="flex-2 py-3 bg-brand-text hover:bg-neutral-800 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-text/10"
                >
                  <Check size={16} />
                  وزن ورفع الصور ({pendingImages.length})
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Uploading Status Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200/50 animate-pulse">
          <p className="text-[12px] font-medium text-neutral-600 flex items-center gap-1.5 font-sans">
            <Loader2 size={14} className="animate-spin text-neutral-500" />
            جاري حفظ ومعالجة وزن الصورة ورفعها بأقصى سرعة للمخزن السحابي...
          </p>
          <div className="flex flex-wrap gap-2">
            {uploadingFiles.map((file, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-white border border-neutral-100 px-2.5 py-1 rounded-lg text-[11px] text-neutral-500">
                <Loader2 size={11} className="animate-spin text-brand-text shrink-0" />
                <span className="truncate max-w-[120px]">{file.name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Image Previews / Shopify Style Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
          {images.map((url, index) => {
            const isMain = mainImage === url;
            return (
              <div 
                key={url + '-' + index} 
                className={`relative group bg-neutral-50 rounded-xl overflow-hidden border transition-all ${
                  isMain 
                    ? 'border-brand-text ring-2 ring-brand-text/10 shadow-sm scale-102' 
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Ratio container */}
                <div className="aspect-[4/5] bg-neutral-100 w-full relative">
                  <img 
                    src={url} 
                    alt={`Product preview ${index + 1}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  
                  {isMain && (
                    <div className="absolute top-2 left-2 bg-brand-text text-white px-2 py-1 rounded-lg text-[10px] font-medium shadow-sm flex items-center gap-1">
                      <Star size={10} className="fill-current text-white" />
                      الصورة الرئيسية
                    </div>
                  )}

                   {/* Actions overlay & Delete confirmation overlay */}
                  {deletingImageUrl === url ? (
                    <div className="absolute inset-0 bg-red-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-white text-center gap-2 animate-fade-in z-20">
                      <p className="text-[12px] font-bold font-sans">تأكيد حذف الصورة؟</p>
                      <div className="flex gap-2 w-full max-w-[150px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingImageUrl(null);
                          }}
                          className="flex-1 py-1 px-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-medium transition-colors"
                        >
                          تراجع
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingImageUrl(null);
                            const filtered = images.filter((_, idx) => idx !== index);
                            setImages(filtered);
                            if (mainImage === url) {
                              setMainImage(filtered.length > 0 ? filtered[0] : '');
                            }
                            deleteProductImageByUrl(url).catch(err => {
                              console.warn("Could not delete file from database storage path:", err);
                            });
                          }}
                          className="flex-1 py-1 px-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-medium transition-colors"
                        >
                          تأكيد
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetMain(url)}
                          title="تعيين كصورة رئيسية"
                          className="p-2 bg-white text-brand-text hover:bg-neutral-100 rounded-full transition-all shadow-md transform translate-y-2 group-hover:translate-y-0"
                        >
                          <Star size={15} className="text-yellow-500 hover:fill-current animate-pulse" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url, index)}
                        title="حذف الصورة تماماً"
                        className="p-2 bg-red-500 text-white hover:bg-red-600 rounded-full transition-all shadow-md transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Badge/label at bottom for index/actions info */}
                <div className="px-3 py-1.5 bg-white border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-sans">
                  <span>الصورة {index + 1}</span>
                  {!isMain && (
                    <button 
                      type="button" 
                      onClick={() => handleSetMain(url)} 
                      className="text-neutral-400 hover:text-brand-text font-semibold hover:underline"
                    >
                      تعيين كرئيسية
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-neutral-50/50 rounded-2xl border border-neutral-100 text-neutral-400 text-center">
          <ImageIcon size={32} className="text-neutral-300 stroke-[1.5] mb-2" />
          <p className="text-[13px]">لا توجد صور للمنتج حالياً</p>
          <p className="text-[11px] text-neutral-400">ارفع صوراً لعرضها كمعاينة وتحديد الصورة الأساسية للمتجر</p>
        </div>
      )}
    </div>
  );
};
