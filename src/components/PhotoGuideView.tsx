import { ArrowLeft, CheckCircle2, Eye } from 'lucide-react';
import { FLOW_SALON_ASSETS, HAIR_ANGLES, PHOTO_CHECKLIST } from '../constants/assets';
import { resolveAssetUrl } from '../types/candidate';
import { ResilientImage } from './ResilientImage';

interface PhotoGuideViewProps {
  onBackToForm: () => void;
  onInspectImage: (src: string, caption: string) => void;
}

export function PhotoGuideView({
  onBackToForm,
  onInspectImage,
}: PhotoGuideViewProps) {
  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-5 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="glass-surface-strong rounded-[28px] p-5 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="max-w-2xl">
          <img
            src={resolveAssetUrl(FLOW_SALON_ASSETS.brandLogo)}
            alt="Flow Salon"
            referrerPolicy="no-referrer"
            className="h-6 w-auto object-contain mb-2.5 logo-emerald"
          />
          <h1 className="text-[26px] sm:text-[34px] font-semibold text-[#062b1e] leading-[1.12] text-balance">
            Panduan Foto 4 Sudut Rambut
          </h1>
          <p className="text-xs sm:text-[15px] text-[#2c4c3e] mt-2 leading-relaxed">
            Tim stylist kami menilai ketebalan, tekstur, warna alami, dan kesehatan ujung rambut secara langsung dari foto Anda. Pastikan seluruh bagian rambut terlihat jelas pada keempat sudut berikut.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToForm}
          className="min-h-[48px] px-5 py-3 rounded-2xl text-white text-sm font-semibold glass-emerald-cta inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Kembali ke Formulir</span>
        </button>
      </div>

      {/* 4 Reference Angles Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {HAIR_ANGLES.map((angle, index) => (
          <article
            key={angle.key}
            className="glass-surface rounded-3xl overflow-hidden flex flex-col"
          >
            <button
              type="button"
              onClick={() =>
                onInspectImage(
                  angle.sampleUrl,
                  `Contoh ${angle.title} — ${angle.guideDetail}`,
                )
              }
              className="group relative aspect-[3/4] w-full overflow-hidden bg-emerald-950/5 cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
            >
              <ResilientImage
                src={angle.sampleUrl}
                alt={`Contoh foto rambut ${angle.title}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-between text-white">
                <span className="text-xs font-semibold tabular-nums">
                  0{index + 1}. {angle.shortLabel}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-200">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </button>

            <div className="p-3.5 sm:p-5 flex-1 flex flex-col">
              <h2 className="text-sm sm:text-base font-semibold text-[#062b1e]">
                {angle.title}
              </h2>
              <p className="text-xs text-[#2c4c3e] mt-1 leading-relaxed">
                {angle.guideDetail}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Essential Photography Checklist */}
      <section className="glass-surface rounded-[28px] p-5 sm:p-8">
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#062b1e]">
          Syarat Utama Agar Foto Lolos Kurasi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          {PHOTO_CHECKLIST.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 py-2.5 border-b border-emerald-950/10 md:border-b-0"
            >
              <CheckCircle2
                className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <p className="text-xs sm:text-sm text-[#072218] leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
