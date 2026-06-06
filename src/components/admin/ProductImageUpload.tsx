import React, { useState, useRef, useEffect } from 'react';
import { uploadProductImage, deleteProductImageByUrl } from '../../firebase';
import { 
  Upload, Trash2, Star, Loader2, Image as ImageIcon, X, 
  RotateCw, FlipHorizontal, Sliders, Check, Plus, SlidersHorizontal
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
  rotation: number; // 0, 90, 180, 270
  brightness: number; // 50 - 200
  contrast: number; // 50 - 200
  isFlipped: boolean;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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
      brightness: 100,
      contrast: 100,
      isFlipped: false
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

  // Apply edits to the file using HTML5 Canvas before uploading
  const processAndCreateBlob = (pendingImg: PendingImage): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(pendingImg.originalFile);
          return;
        }

        // Determine canvas dimensions based on 90 / 270 degree rotation
        const is90or270 = pendingImg.rotation % 180 !== 0;
        const width = is90or270 ? img.height : img.width;
        const height = is90or270 ? img.width : img.height;

        canvas.width = width;
        canvas.height = height;

        // Apply transformations centered
        ctx.translate(width / 2, height / 2);
        ctx.rotate((pendingImg.rotation * Math.PI) / 180);
        
        if (pendingImg.isFlipped) {
          ctx.scale(-1, 1);
        }

        // Apply filters in context
        const brightnessFilter = `brightness(${pendingImg.brightness}%)`;
        const contrastFilter = `contrast(${pendingImg.contrast}%)`;
        ctx.filter = `${brightnessFilter} ${contrastFilter}`;

        // Draw centered
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // Export as optimized file
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
        }, 'image/jpeg', 0.82);
      };

      img.onerror = (err) => {
        reject(err);
      };

      img.src = pendingImg.previewUrl;
    });
  };

  // Upload processed files
  const handleUploadAllPending = async () => {
    if (pendingImages.length === 0) return;

    // Show upload progress state
    const newUploading = pendingImages.map(f => ({ name: f.originalFile.name, progress: true }));
    setUploadingFiles(prev => [...prev, ...newUploading]);

    // Fast copy and clear queue
    const queueToProcess = [...pendingImages];
    setPendingImages([]);
    setActivePendingIdx(null);

    const uploadedUrls: string[] = [];

    for (const item of queueToProcess) {
      try {
        // Apply rotation/filters
        const processedFile = await processAndCreateBlob(item);
        const downloadUrl = await uploadProductImage(processedFile);
        if (downloadUrl) {
          uploadedUrls.push(downloadUrl);
        }
      } catch (err) {
        console.error("Failed to process and upload file:", item.originalFile.name, err);
        alert(`خطأ أثناء معالجة أو رفع الصورة: ${item.originalFile.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(f => f.name !== item.originalFile.name));
        if (item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      }
    }

    if (uploadedUrls.length > 0) {
      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      if (!mainImage) {
        setMainImage(uploadedUrls[0]);
      }
    }
  };

  const handleRemoveImage = async (url: string, index: number) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه الصورة من نظام التخزين؟")) {
      try {
        await deleteProductImageByUrl(url);
      } catch (err) {
        console.warn("Could not delete from storage bucket:", err);
      }

      const filtered = images.filter((_, idx) => idx !== index);
      setImages(filtered);

      if (mainImage === url) {
        setMainImage(filtered.length > 0 ? filtered[0] : '');
      }
    }
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
          <Upload size={22} className="text-brand-text animate-bounce-slow" />
        </div>
        
        <div>
          <p className="text-[14px] font-medium text-brand-text">
            اسحب الصور وأفلتها هنا، أو اضغط للتصفح والمعاينة والتعديل
          </p>
          <p className="text-[12px] text-neutral-400 mt-1">
            يمكنك تدوير، قلب، وتعديل إضاءة وتباين الصور من لوحة المعاينة قبل الرفع
          </p>
        </div>
      </div>

      {/* Multi-Image Interactive Custom Editor & Preview Workspace Modal */}
      {pendingImages.length > 0 && activePendingImage && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px]">
            
            {/* Left/Main Section: Live Interactive Styled Canvas Workspace */}
            <div className="flex-1 bg-neutral-100 p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-l border-neutral-200">
              <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-mono font-medium tracking-wide">
                مسودة التعديل (Editor Space)
              </div>
              
              <div className="w-full max-w-[320px] aspect-[4/5] bg-neutral-200/50 rounded-2xl overflow-hidden shadow-lg border border-neutral-300 relative flex items-center justify-center">
                <img
                  src={activePendingImage.previewUrl}
                  alt="Pending editing workspace"
                  style={{
                    transform: `rotate(${activePendingImage.rotation}deg) scaleX(${activePendingImage.isFlipped ? -1 : 1})`,
                    filter: `brightness(${activePendingImage.brightness}%) contrast(${activePendingImage.contrast}%)`,
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.15s ease'
                  }}
                  className="max-w-[100%] max-h-[100%] object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-[14px] font-semibold text-brand-text truncate max-w-[280px]">
                  {activePendingImage.originalFile.name}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {(activePendingImage.originalFile.size / (1024 * 1024)).toFixed(2)} MB • JPG/PNG Draft
                </p>
              </div>
            </div>

            {/* Right Panel: Editing & Queue Controls Panel */}
            <div className="w-full md:w-[360px] p-6 flex flex-col justify-between bg-white overflow-y-auto h-full space-y-6">
              
              {/* Header */}
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-bold text-brand-text flex items-center gap-1.5 font-sans">
                      <SlidersHorizontal size={18} className="text-brand-text shrink-0" />
                      تجهيز وتعديل الصور قبل الرفع
                    </h3>
                    <p className="text-[12px] text-neutral-400 mt-1">
                      اضبط مظهر صورك بالتفصيل قبل تحويلها للرابط النهائي
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("هل تريد إلغاء التغييرات والملفات المفتوحة؟")) {
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

                {/* Adjusting Slider Controls */}
                <div className="space-y-4">
                  {/* Rotation & Flip Row */}
                  <div>
                    <span className="block text-[12px] font-semibold text-neutral-500 mb-2">الدوران والاتجاه (Orientations)</span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            curr.rotation = (curr.rotation - 90 + 360) % 360;
                            return copy;
                          });
                        }}
                        className="flex flex-col items-center justify-center p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 rounded-xl text-neutral-600 transition-all"
                      >
                        <RotateCw size={16} className="-scale-x-100" />
                        <span className="text-[10px] mt-1">يسار 90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            curr.rotation = (curr.rotation + 90) % 360;
                            return copy;
                          });
                        }}
                        className="flex flex-col items-center justify-center p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 rounded-xl text-neutral-600 transition-all"
                      >
                        <RotateCw size={16} />
                        <span className="text-[10px] mt-1">يمين 90°</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPendingImages(prev => {
                            const copy = [...prev];
                            const curr = copy[activePendingIdx!];
                            curr.isFlipped = !curr.isFlipped;
                            return copy;
                          });
                        }}
                        className="flex flex-col items-center justify-center p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 rounded-xl text-neutral-600 transition-all"
                      >
                        <FlipHorizontal size={16} />
                        <span className="text-[10px] mt-1">عكس مرآة</span>
                      </button>
                    </div>
                  </div>

                  {/* Brightness Adjuster Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span className="text-neutral-500">الإضاءة والسطوع (Brightness)</span>
                      <span className="text-brand-text font-mono">{activePendingImage.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={activePendingImage.brightness}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPendingImages(prev => {
                          const copy = [...prev];
                          copy[activePendingIdx!].brightness = val;
                          return copy;
                        });
                      }}
                      className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand-text"
                    />
                  </div>

                  {/* Contrast Slider */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1 border-t border-neutral-50 pt-2">
                      <span className="text-neutral-500">التباين والوضوح (Contrast)</span>
                      <span className="text-brand-text font-mono">{activePendingImage.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="180"
                      value={activePendingImage.contrast}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPendingImages(prev => {
                          const copy = [...prev];
                          copy[activePendingIdx!].contrast = val;
                          return copy;
                        });
                      }}
                      className="w-full h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-brand-text"
                    />
                  </div>
                </div>

                <hr className="my-4 border-neutral-100" />

                {/* Vertical slider gallery scroll block */}
                <div>
                  <div className="flex justify-between items-center text-[12px] font-medium text-neutral-500 mb-2">
                    <span>صور مسودة الرفع ({pendingImages.length} صور)</span>
                    <button
                      type="button"
                      onClick={triggerEditInputClick}
                      className="text-[11px] text-brand-text font-semibold flex items-center gap-0.5 hover:underline"
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

                  <div className="flex gap-2.5 overflow-x-auto py-2.5 px-1 shrink-0 scrollbar-thin">
                    {pendingImages.map((img, index) => {
                      const isActive = activePendingIdx === index;
                      return (
                        <div key={img.id} className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setActivePendingIdx(index)}
                            className={`w-14 h-18 rounded-xl overflow-hidden border-2 bg-neutral-50 transition-all ${
                              isActive ? 'border-brand-text ring-2 ring-brand-text/10' : 'border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <img
                              src={img.previewUrl}
                              alt="Draft thumb"
                              style={{
                                transform: `rotate(${img.rotation}deg) scaleX(${img.isFlipped ? -1 : 1})`,
                                filter: `brightness(${img.brightness}%) contrast(${img.contrast}%)`
                              }}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                          
                          {/* Inline tiny trash to drop a single pending image */}
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
                            className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Confirm Actions */}
              <div className="pt-4 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("هل تريد إلغاء وإهمال جميع الصور المقترحة؟")) {
                      setPendingImages([]);
                      setActivePendingIdx(null);
                    }
                  }}
                  className="flex-1 py-3 border border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-xl text-[13px] font-medium transition-colors text-center"
                >
                  إلغاء الكل
                </button>
                <button
                  type="button"
                  onClick={handleUploadAllPending}
                  className="flex-2 py-3 bg-brand-text hover:bg-neutral-800 text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-brand-text/10"
                >
                  <Check size={16} />
                  معالجة ورفع الصور ({pendingImages.length})
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
            جاري معالجة ورفع الصور بأقصى سرعة للخادم السحابي...
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
                      <Star size={10} className="fill-current text-yellow-400" />
                      الصورة الرئيسية
                    </div>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => handleSetMain(url)}
                        title="تعيين كصورة رئيسية"
                        className="p-2 bg-white text-brand-text hover:bg-neutral-100 rounded-full transition-all shadow-md transform translate-y-2 group-hover:translate-y-0"
                      >
                        <Star size={15} className="text-yellow-500 hover:fill-current" />
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
                </div>
                
                {/* Badge/label at bottom for index/actions info */}
                <div className="px-3 py-1.5 bg-white border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-sans">
                  <span>الصورة {index + 1}</span>
                  {!isMain && (
                    <button 
                      type="button" 
                      onClick={() => handleSetMain(url)} 
                      className="text-neutral-400 hover:text-brand-text font-semibold"
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
