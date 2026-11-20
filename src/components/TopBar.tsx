import { Check, Link2 } from 'lucide-react';
import { FLOW_SALON_ASSETS } from '../constants/assets';
import type { AppView } from '../types/candidate';

interface TopBarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  linkCopied: boolean;
  onCopyShareLink: () => void;
}

export function TopBar({
  activeView,
  onNavigate,
  linkCopied,
  onCopyShareLink,
}: TopBarProps) {
  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'form', label: 'Formulir' },
    { id: 'guide', label: 'Panduan Foto' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-bar">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Official Flow Salon Logo Image (Emerald tint on light frosted glass) */}
        <button
          type="button"
          onClick={() => onNavigate('form')}
          aria-label="Flow Salon — Kembali ke Formulir Pendaftaran"
          className="shrink-0 min-h-[44px] flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg cursor-pointer"
        >
          <img
            src={FLOW_SALON_ASSETS.brandLogo}
            alt="Flow Salon"
            referrerPolicy="no-referrer"
            className="h-6 sm:h-7 w-auto object-contain select-none logo-emerald"
          />
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-4 sm:gap-7 overflow-x-auto no-scrollbar"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-h-[44px] flex items-center text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md px-1 ${
                  isActive
                    ? 'text-emerald-800'
                    : 'text-[#2c4c3e] hover:text-[#062b1e]'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1.5 left-1 right-1 h-[2px] rounded-full bg-emerald-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Contextual Action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onCopyShareLink}
            aria-label="Salin tautan pendaftaran model Flow Salon"
            className={`min-h-[44px] min-w-[44px] sm:px-4 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              linkCopied
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white/80 hover:bg-white text-[#062b1e] border border-emerald-900/15 shadow-xs'
            }`}
          >
            {linkCopied ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <Link2 className="w-4 h-4 shrink-0 text-emerald-700" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {linkCopied ? 'Link Tersalin' : 'Salin Link'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
