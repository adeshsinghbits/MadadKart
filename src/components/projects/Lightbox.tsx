'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, Download,
  ZoomIn, User, Calendar,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface LightboxImage {
  url: string;
  caption?: string;
  uploadedBy?: { name: string; avatar?: string } | null;
  uploadedAt?: string;
  isCover?: boolean;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({ images, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const image = images[currentIndex];

  /* Keyboard navigation */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape')       onClose();
    if (e.key === 'ArrowLeft')    onPrev();
    if (e.key === 'ArrowRight')   onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  if (!image) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm z-10 shrink-0"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <ZoomIn size={14} />
            <span>{currentIndex + 1} / {images.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={image.url} download target="_blank" rel="noreferrer"
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors" title="Download">
              <Download size={16} />
            </a>
            <button onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="flex-1 flex items-center justify-center relative min-h-0 px-14"
          onClick={e => e.stopPropagation()}>
          {/* Prev */}
          <button onClick={onPrev} disabled={images.length <= 1}
            className="absolute left-2 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 disabled:opacity-20 transition-colors">
            <ChevronLeft size={22} />
          </button>

          <AnimatePresence mode="wait">
            <motion.img
              key={image.url}
              src={image.url}
              alt={image.caption ?? ''}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
            />
          </AnimatePresence>

          {/* Next */}
          <button onClick={onNext} disabled={images.length <= 1}
            className="absolute right-2 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/25 disabled:opacity-20 transition-colors">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Bottom info */}
        {(image.caption || image.uploadedBy || image.uploadedAt) && (
          <div className="shrink-0 px-6 py-4 bg-black/40 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
            <div className="max-w-2xl mx-auto">
              {image.caption && (
                <p className="text-white text-sm font-medium mb-2 text-center">{image.caption}</p>
              )}
              <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
                {image.uploadedBy && (
                  <span className="flex items-center gap-1.5">
                    {image.uploadedBy.avatar
                      ? <img src={image.uploadedBy.avatar} alt="" className="w-4 h-4 rounded-full" />
                      : <User size={11} />}
                    {image.uploadedBy.name}
                  </span>
                )}
                {image.uploadedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDistanceToNow(new Date(image.uploadedAt), { addSuffix: true })}
                  </span>
                )}
                {image.isCover && (
                  <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px]">Cover image</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="shrink-0 flex gap-2 px-4 py-3 overflow-x-auto bg-black/30" onClick={e => e.stopPropagation()}>
            {images.map((img, i) => (
              <button key={i} onClick={() => {
                // navigate to index — bubble handled by parent via onPrev/onNext
                const diff = i - currentIndex;
                if (diff > 0) for (let j = 0; j < diff; j++) onNext();
                else          for (let j = 0; j < -diff; j++) onPrev();
              }}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIndex ? 'border-white scale-105' : 'border-transparent opacity-50 hover:opacity-80'
                }`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
