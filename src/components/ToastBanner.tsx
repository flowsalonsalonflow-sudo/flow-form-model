import { CheckCircle2, X } from 'lucide-react';

export interface ToastNotice {
  id: number;
  title: string;
  description?: string;
}

interface ToastBannerProps {
  notice: ToastNotice | null;
  onDismiss: () => void;
}

export function ToastBanner({ notice, onDismiss }: ToastBannerProps) {
  if (!notice) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 sm:top-20 right-3.5 left-3.5 sm:left-auto sm:w-[420px] z-50 pointer-events-auto"
    >
      <div className="glass-dark-sheet rounded-2xl px-4 py-3.5 text-[#062b1e] flex items-start gap-3">
        <CheckCircle2
          className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#062b1e] leading-snug">
            {notice.title}
          </p>
          {notice.description && (
            <p className="text-xs text-[#2c4c3e] mt-0.5 leading-relaxed">
              {notice.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="min-h-[36px] min-w-[36px] -mr-1.5 -mt-1 rounded-xl text-[#2c4c3e] hover:bg-emerald-950/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
