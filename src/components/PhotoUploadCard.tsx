import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  Camera,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type { AngleMeta } from '../constants/assets';
import { compressImageToDataUrl } from '../utils/imageUtils';
import { ResilientImage } from './ResilientImage';

interface PhotoUploadCardProps {
  angle: AngleMeta;
  value: string;
  hasError?: boolean;
  onChange: (dataUrl: string) => void;
  onInspect: (src: string, caption: string) => void;
  onError: (message: string) => void;
}

export function PhotoUploadCard({
  angle,
  value,
  hasError = false,
  onChange,
  onInspect,
  onError,
}: PhotoUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      onChange(compressed);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memproses foto. Silakan coba lagi.';
      onError(message);
    } finally {
      setIsProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void handleFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  const triggerPicker = () => {
    inputRef.current?.click();
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`group flex flex-col rounded-2xl p-2.5 sm:p-3 transition-all duration-200 ${
        isDragging
          ? 'bg-emerald-50/75 border-2 border-emerald-600'
          : hasError && !value
            ? 'bg-red-50/75 border border-red-400'
            : value
              ? 'bg-white/60 border border-emerald-600/45 shadow-sm'
              : 'bg-white/42 border border-white/75 hover:border-emerald-500/45 hover:bg-white/58 shadow-xs'
      }`}
    >
      <input
        ref={inputRef}
        id={`photo-input-${angle.key}`}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="sr-only"
        aria-label={`Unggah foto rambut ${angle.title}`}
      />

      {/* Minimal Single-Row Header — Never truncates or wraps on narrow mobile screens */}
      <div className="flex items-center justify-between gap-1.5 mb-2 px-0.5">
        <span className="text-sm font-semibold text-[#062b1e] whitespace-nowrap">
          {angle.shortLabel}
        </span>

        {value ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Siap</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              onInspect(
                angle.sampleUrl,
                `Contoh ${angle.title} — ${angle.guideDetail}`,
              )
            }
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 shrink-0 min-h-[28px] px-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
          >
            Contoh
          </button>
        )}
      </div>

      {/* Preview or Upload Surface */}
      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-emerald-950/5 border border-emerald-900/10">
        {isProcessing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-md text-[#062b1e]">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" aria-hidden="true" />
            <span className="text-xs font-medium">Memproses...</span>
          </div>
        ) : value ? (
          <>
            <ResilientImage
              src={value}
              alt={`Pratinjau foto rambut ${angle.title}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => onInspect(value, `Foto Anda — ${angle.title}`)}
                aria-label={`Perbesar foto ${angle.title}`}
                className="min-h-[36px] min-w-[36px] px-2 rounded-lg bg-white/25 hover:bg-white/35 backdrop-blur-md text-white text-xs font-medium flex items-center justify-center transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={triggerPicker}
                  aria-label={`Ganti foto ${angle.title}`}
                  className="min-h-[36px] px-2.5 rounded-lg bg-white/95 hover:bg-white text-[#062b1e] text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  <span>Ganti</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  aria-label={`Hapus foto ${angle.title}`}
                  className="min-h-[36px] min-w-[36px] rounded-lg bg-white/25 hover:bg-red-600/90 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={triggerPicker}
            className="w-full h-full flex flex-col items-center justify-center p-2.5 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 transition-colors"
          >
            {/* Subtle guide reference preview in background */}
            <ResilientImage
              src={angle.sampleUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-[0.22] group-hover:opacity-[0.3] transition-opacity duration-200 pointer-events-none"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/55 to-white/45 pointer-events-none"
            />
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-emerald-600/25 shadow-sm flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform duration-200">
                <Camera className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-[#062b1e]">
                Pilih Foto
              </span>
            </div>
          </button>
        )}
      </div>

      {hasError && !value && (
        <p className="mt-1.5 text-[11px] font-semibold text-red-700" role="alert">
          Wajib diisi
        </p>
      )}
    </div>
  );
}
