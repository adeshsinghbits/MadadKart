'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, ImagePlus, AlertCircle, CheckCircle } from 'lucide-react';

export interface UploadedImage {
  url: string;
  caption: string;
  width?: number;
  height?: number;
  localId: string; // temp client-only key
}

interface ImageUploaderProps {
  token: string;
  folder?: string;
  maxFiles?: number;
  onUpload: (img: UploadedImage) => void;
  /** Already-uploaded images to show in the preview strip */
  existing?: UploadedImage[];
  onRemove?: (localId: string) => void;
  onCaptionChange?: (localId: string, caption: string) => void;
  accept?: string;
  label?: string;
  hint?: string;
}

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function ImageUploader({
  token,
  folder = 'madadkart/gallery',
  maxFiles = 20,
  onUpload,
  existing = [],
  onRemove,
  onCaptionChange,
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  label = 'Upload photos',
  hint = 'JPEG, PNG, WebP or GIF · max 10 MB each',
}: ImageUploaderProps) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploading, setUploading]     = useState<string[]>([]); // names being uploaded
  const [errors, setErrors]           = useState<string[]>([]);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  const clearError = (msg: string) =>
    setErrors(prev => prev.filter(e => e !== msg));

  const uploadFile = useCallback(async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors(p => [...p, `${file.name}: unsupported type`]);
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors(p => [...p, `${file.name}: exceeds 10 MB`]);
      return;
    }

    setUploading(p => [...p, file.name]);
    try {
      const fd = new FormData();
      fd.append('file',   file);
      fd.append('folder', folder);

      const res  = await fetch('/api/upload', {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      onUpload({
        url:     data.url,
        caption: '',
        width:   data.width,
        height:  data.height,
        localId: `${Date.now()}_${Math.random()}`,
      });
    } catch (err) {
      setErrors(p => [...p, `${file.name}: ${err instanceof Error ? err.message : 'upload failed'}`]);
    } finally {
      setUploading(p => p.filter(n => n !== file.name));
    }
  }, [token, folder, onUpload]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const remaining = maxFiles - existing.length;
    const toUpload  = Array.from(files).slice(0, remaining);
    toUpload.forEach(uploadFile);
  }, [existing.length, maxFiles, uploadFile]);

  /* Drag events */
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = ()                      => setIsDragging(false);
  const onDrop      = (e: React.DragEvent)   => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const isAtMax = existing.length >= maxFiles;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!isAtMax && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-accent/50 bg-muted/20'
            }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
            {uploading.length > 0
              ? <Loader2 size={22} className="animate-spin" />
              : <Upload size={22} />}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {isDragging ? 'Drop to upload' : label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {existing.length}/{maxFiles} photos uploaded
            </p>
          </div>

          {/* Uploading names */}
          {uploading.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {uploading.map(name => (
                <span key={name} className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  <Loader2 size={10} className="animate-spin" /> {name.slice(0, 20)}{name.length > 20 ? '…' : ''}
                </span>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* Errors */}
      <AnimatePresence>
        {errors.map(err => (
          <motion.div key={err} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5"><AlertCircle size={13} />{err}</span>
            <button onClick={() => clearError(err)} className="shrink-0"><X size={13} /></button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Preview grid */}
      {existing.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {existing.map((img, idx) => (
              <motion.div key={img.localId}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative rounded-xl overflow-hidden bg-muted aspect-square"
              >
                <img src={img.url} alt={img.caption || `Image ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                {/* Index badge */}
                <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {idx + 1}
                </div>

                {/* Remove */}
                {onRemove && (
                  <button onClick={() => onRemove(img.localId)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow">
                    <X size={12} />
                  </button>
                )}

                {/* Caption button */}
                {onCaptionChange && (
                  <button
                    onClick={() => setEditingCaption(editingCaption === img.localId ? null : img.localId)}
                    className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity truncate text-left">
                    {img.caption ? `"${img.caption}"` : '+ Add caption'}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Caption editor */}
      <AnimatePresence>
        {editingCaption && onCaptionChange && (() => {
          const img = existing.find(i => i.localId === editingCaption);
          if (!img) return null;
          return (
            <motion.div key="caption-editor" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-2 p-3 bg-accent rounded-xl border border-border">
              <img src={img.url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  autoFocus
                  value={img.caption}
                  onChange={e => onCaptionChange(img.localId, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setEditingCaption(null)}
                  maxLength={300}
                  placeholder="Add a caption…"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary bg-white"
                />
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{img.caption.length}/300</span>
                  <button onClick={() => setEditingCaption(null)} className="text-xs text-primary font-medium">Done</button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
