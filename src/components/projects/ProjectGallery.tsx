'use client';

/**
 * ProjectGallery
 * Full gallery tab component used inside the project detail page.
 * - Public view: masonry grid, lightbox, share button
 * - Owner/volunteer view: upload panel, delete per-photo, edit captions
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Trash2, Loader2, Share2, Check,
  ImageOff, Upload,
} from 'lucide-react';
import { Lightbox, LightboxImage } from './Lightbox';
import { ImageUploader, UploadedImage } from './ImageUploader';
import { useAuth } from '@/context/AuthContext';

interface GalleryItem {
  _id: string;
  url: string;
  caption?: string;
  uploadedBy?: { _id?: string; name: string; avatar?: string } | null;
  uploadedAt?: string;
  isCover?: boolean;
}

interface ProjectGalleryProps {
  projectId: string;
  creatorId: string;
  projectTitle: string;
  /** Accepted volunteer user IDs */
  acceptedVolunteerIds?: string[];
}

export function ProjectGallery({
  projectId,
  creatorId,
  projectTitle,
  acceptedVolunteerIds = [],
}: ProjectGalleryProps) {
  const { user, token } = useAuth();

  const [items, setItems]           = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingUploads, setPending]= useState<UploadedImage[]>([]);
  const [isSaving, setIsSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const [saveError, setSaveError]   = useState('');

  /* Who can upload? */
  const canUpload = !!user && (
    user._id === creatorId ||
    acceptedVolunteerIds.includes(user._id)
  );

  /* Fetch gallery */
  const loadGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/projects/${projectId}/gallery`);
      const data = await res.json();
      const all: GalleryItem[] = [
        ...(data.coverImages ?? []),
        ...(data.gallery     ?? []),
      ];
      setItems(all);
    } catch {}
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  /* Save pending uploads to DB */
  const handleSaveUploads = async () => {
    if (!pendingUploads.length || !token) return;
    setIsSaving(true);
    setSaveError('');
    let failed = 0;
    for (const img of pendingUploads) {
      try {
        const res = await fetch(`/api/projects/${projectId}/gallery`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ url: img.url, caption: img.caption, width: img.width, height: img.height }),
        });
        if (!res.ok) failed++;
      } catch { failed++; }
    }
    if (failed > 0) setSaveError(`${failed} photo${failed > 1 ? 's' : ''} failed to save.`);
    setPending([]);
    await loadGallery();
    setShowUpload(false);
    setIsSaving(false);
  };

  /* Delete a gallery item */
  const handleDelete = async (itemId: string) => {
    if (!token || !confirm('Remove this photo from the gallery?')) return;
    setDeletingId(itemId);
    try {
      await fetch(`/api/projects/${projectId}/gallery?itemId=${itemId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      setItems(prev => prev.filter(i => i._id !== itemId));
    } catch {}
    setDeletingId(null);
  };

  /* Share */
  const handleShare = async () => {
    const url = `${window.location.origin}/projects/${projectId}#gallery`;
    try {
      if (navigator.share) {
        await navigator.share({ title: projectTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  /* Lightbox helpers */
  const lbImages: LightboxImage[] = items.map(i => ({
    url:        i.url,
    caption:    i.caption,
    uploadedBy: i.uploadedBy ?? null,
    uploadedAt: i.uploadedAt,
    isCover:    i.isCover,
  }));

  const moveLightbox = (dir: 1 | -1) =>
    setLightboxIdx(prev => prev === null ? null : (prev + dir + items.length) % items.length);

  return (
    <div>
      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-foreground">
            Gallery
            {items.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{items.length} photo{items.length !== 1 ? 's' : ''}</span>
            )}
          </h3>
          {canUpload && (
            <p className="text-xs text-muted-foreground mt-0.5">You can upload photos as project creator / volunteer</p>
          )}
        </div>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-sm hover:bg-accent transition-colors text-muted-foreground">
              {copied ? <><Check size={13} className="text-emerald-500" /> Copied!</> : <><Share2 size={13} /> Share</>}
            </button>
          )}
          {canUpload && (
            <button onClick={() => setShowUpload(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                showUpload
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}>
              <Camera size={13} />
              {showUpload ? 'Hide uploader' : 'Add Photos'}
            </button>
          )}
        </div>
      </div>

      {/* ── Upload panel ──────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && canUpload && token && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-muted/30 border border-border rounded-2xl p-5">
              <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Upload size={14} className="text-primary" /> Upload Photos
              </h4>

              <ImageUploader
                token={token}
                folder={`madadkart/projects/${projectId}`}
                maxFiles={20 - items.filter(i => !i.isCover).length}
                existing={pendingUploads}
                onUpload={img => setPending(p => [...p, img])}
                onRemove={id  => setPending(p => p.filter(i => i.localId !== id))}
                onCaptionChange={(id, cap) =>
                  setPending(p => p.map(i => i.localId === id ? { ...i, caption: cap } : i))
                }
                label="Drag & drop project photos here"
                hint="JPEG, PNG, WebP · max 10 MB each · photos appear in the public gallery"
              />

              {saveError && (
                <p className="text-sm text-destructive mt-3">{saveError}</p>
              )}

              {pendingUploads.length > 0 && (
                <div className="flex gap-3 mt-4">
                  <button onClick={() => { setPending([]); setSaveError(''); }}
                    className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors">
                    Discard
                  </button>
                  <button onClick={handleSaveUploads} disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors">
                    {isSaving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : <>Save {pendingUploads.length} photo{pendingUploads.length !== 1 ? 's' : ''} to gallery</>}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gallery grid ──────────────────────────────────── */}
      {isLoading ? (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`skeleton rounded-xl bg-muted w-full ${i % 3 === 0 ? 'aspect-square' : 'aspect-video'}`} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <ImageOff size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No photos yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            {canUpload ? 'Click "Add Photos" above to share project moments.' : 'The project team hasn\'t shared any photos yet.'}
          </p>
        </div>
      ) : (
        /* Masonry grid using CSS columns */
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.03 }}
                className="break-inside-avoid group relative rounded-xl overflow-hidden bg-muted cursor-pointer"
                onClick={() => setLightboxIdx(idx)}
              >
                <img
                  src={item.url}
                  alt={item.caption ?? ''}
                  className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Caption */}
                {item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium line-clamp-2">{item.caption}</p>
                  </div>
                )}

                {/* Cover badge */}
                {item.isCover && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    Cover
                  </div>
                )}

                {/* Uploader name */}
                {item.uploadedBy && !item.isCover && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <img
                      src={item.uploadedBy.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.uploadedBy.name)}&backgroundColor=6366f1&textColor=fff`}
                      alt={item.uploadedBy.name}
                      className="w-5 h-5 rounded-full border border-white/50"
                    />
                    <span className="text-[10px] text-white font-medium bg-black/40 px-1.5 py-0.5 rounded-full">
                      {item.uploadedBy.name.split(' ')[0]}
                    </span>
                  </div>
                )}

                {/* Delete button — only for canUpload users */}
                {canUpload && !item.isCover && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item._id); }}
                    disabled={deletingId === item._id}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 shadow"
                  >
                    {deletingId === item._id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />}
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────── */}
      {lightboxIdx !== null && (
        <Lightbox
          images={lbImages}
          initialIndex={lightboxIdx}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => moveLightbox(-1)}
          onNext={() => moveLightbox(1)}
        />
      )}
    </div>
  );
}
