import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface ImageLightboxProps {
  src: string | null;
  caption?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, caption, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={caption || 'Pratinjau foto'}
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full rounded-3xl overflow-hidden glass-dark-sheet shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-emerald-950/10">
          <p className="text-xs sm:text-sm font-semibold text-[#062b1e] truncate">
            {caption || 'Pratinjau Foto Rambut'}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau"
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl text-[#062b1e] hover:bg-emerald-950/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative bg-emerald-950/10 max-h-[75dvh] flex items-center justify-center overflow-hidden">
          <ResilientImage
            src={src}
            alt={caption || 'Pratinjau foto rambut'}
            className="w-full max-h-[75dvh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
