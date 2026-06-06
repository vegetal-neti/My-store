import React, { useState, useRef } from 'react';
import { uploadProductImage, deleteProductImageByUrl } from '../../firebase';
import { Upload, Trash2, Star, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface ProductImageUploadProps {
  mainImage: string;
  setMainImage: (url: string) => void;
  images: string[];
  setImages: (urls: string[]) => void;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  mainImage,
  setMainImage,
  images,
  setImages
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    // Set uploading state
    const newUploading = validFiles.map(f => ({ name: f.name, progress: true }));
    setUploadingFiles(prev => [...prev, ...newUploading]);

    const uploadedUrls: string[] = [];

    for (const file of validFiles) {
      try {
        const downloadUrl = await uploadProductImage(file);
        if (downloadUrl) {
          uploadedUrls.push(downloadUrl);
        }
      } catch (err) {
        console.error("Failed to upload file:", file.name, err);
        alert(`خطأ أثناء رفع الصورة: ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(item => item.name !== file.name));
      }
    }

    if (uploadedUrls.length > 0) {
      const updatedImages = [...images, ...uploadedUrls];
      setImages(updatedImages);
      // If there is no main image set yet, set the first newly uploaded image as main
      if (!mainImage) {
        setMainImage(uploadedUrls[0]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = async (url: string, index: number) => {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذه الصورة من نظام التخزين؟")) {
      try {
        // Delete from Firebase Storage
        await deleteProductImageByUrl(url);
      } catch (err) {
        console.warn("Could not delete from Storage bucket:", err);
      }

      // Remove from arrays
      const filtered = images.filter((_, idx) => idx !== index);
      setImages(filtered);

      // If we deleted the main image, choose another or clear it
      if (mainImage === url) {
        setMainImage(filtered.length > 0 ? filtered[0] : '');
      }
    }
  };

  const handleSetMain = (url: string) => {
    setMainImage(url);
  };

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
            اسحب الصور وأفلتها هنا، أو اضغط للتصفح
          </p>
          <p className="text-[12px] text-neutral-400 mt-1">
            يدعم صيغ JPG, PNG, WEBP (يمكنك تشغيل رفع متعدد)
          </p>
        </div>
      </div>

      {/* Uploading Status Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200/50 animate-pulse">
          <p className="text-[12px] font-medium text-neutral-600 flex items-center gap-1.5 font-sans">
            <Loader2 size={14} className="animate-spin text-neutral-500" />
            جاري العمل على رفع الصور للمخزن السحابي...
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
                <div className="px-3 py-1.5 bg-white border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>الصورة {index + 1}</span>
                  {!isMain && (
                    <button 
                      type="button" 
                      onClick={() => handleSetMain(url)} 
                      className="text-neutral-400 hover:text-brand-text font-medium"
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
