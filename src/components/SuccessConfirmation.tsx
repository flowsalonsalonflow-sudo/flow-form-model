import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  FLOW_SALON_ASSETS,
  HAIR_ANGLES,
  HAIR_QUIZ_QUESTIONS,
} from '../constants/assets';
import { resolveAssetUrl } from '../types/candidate';
import type { CandidateRecord } from '../types/candidate';
import {
  copyTextToClipboard,
  formatIndonesianDateTime,
} from '../utils/imageUtils';
import { ResilientImage } from './ResilientImage';

interface SuccessConfirmationProps {
  candidate: CandidateRecord;
  onRegisterAnother: () => void;
  onInspectImage: (src: string, caption: string) => void;
}

export function SuccessConfirmation({
  candidate,
  onRegisterAnother,
  onInspectImage,
}: SuccessConfirmationProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    const ok = await copyTextToClipboard(candidate.registrationCode);
    if (ok) {
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 py-5 sm:py-10">
      <div className="glass-surface-strong rounded-[28px] overflow-hidden">
        {/* Emerald Luminous Confirmation Banner */}
        <div className="px-5 py-6 sm:px-8 sm:py-8 bg-gradient-to-br from-emerald-700 via-emerald-800 to-[#053324] text-white">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-200" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-200">
                  Konfirmasi Pendaftaran Berhasil
                </p>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Tersimpan otomatis secara privat
                </p>
              </div>
            </div>

            <img
              src={resolveAssetUrl(FLOW_SALON_ASSETS.brandLogo)}
              alt="Flow Salon"
              referrerPolicy="no-referrer"
              className="h-6 sm:h-7 w-auto object-contain shrink-0"
            />
          </div>

          <h1 className="text-[26px] sm:text-[32px] font-semibold leading-[1.12] text-balance">
            Terima Kasih, {candidate.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50/90 mt-2 leading-relaxed max-w-xl">
            Formulir, jawaban kondisi rambut, dan 4 foto sudut rambut Anda telah kami terima. Tim kurasi stylist kami akan menghubungi nomor WhatsApp terdaftar dalam 1–3 hari kerja.
          </p>
        </div>

        {/* Receipt Body (Light Frosted Glass) */}
        <div className="p-5 sm:p-8 space-y-5">
          {/* Registration Code + Key Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-5 border-b border-emerald-950/10">
            <div className="rounded-2xl bg-emerald-50/80 border border-emerald-700/20 p-4 flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs text-[#2c4c3e]">
                  Kode Registrasi Kandidat
                </span>
                <span className="block font-mono text-lg font-semibold text-[#062b1e] tabular-nums mt-0.5">
                  {candidate.registrationCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[44px] px-3.5 rounded-xl bg-white/90 hover:bg-white border border-emerald-800/18 text-xs font-semibold text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-2xl bg-white/75 border border-white/90 p-4 space-y-1.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#2c4c3e]">WhatsApp</span>
                <span className="font-mono text-xs sm:text-sm font-semibold text-[#072218] tabular-nums">
                  {candidate.whatsappDisplay}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#2c4c3e]">Waktu Masuk</span>
                <span className="text-xs sm:text-sm font-medium text-[#072218] tabular-nums">
                  {formatIndonesianDateTime(candidate.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#2c4c3e]">Status</span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-800">
                  Menunggu Review Stylist
                </span>
              </div>
            </div>
          </div>

          {/* 4 Uploaded Hair Angles Confirmation Strip */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-[#062b1e]">
                Dokumentasi 4 Sudut Rambut Terkirim
              </h2>
              <span className="text-xs font-medium text-emerald-800 tabular-nums">
                4/4 foto tersimpan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {HAIR_ANGLES.map((angle) => {
                const photoUrl = candidate.photos[angle.key];
                return (
                  <button
                    key={angle.key}
                    type="button"
                    onClick={() =>
                      onInspectImage(
                        photoUrl,
                        `${candidate.fullName} — ${angle.title}`,
                      )
                    }
                    className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-2xl cursor-pointer"
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/90 bg-emerald-950/5 shadow-xs">
                      <ResilientImage
                        src={photoUrl}
                        alt={`${candidate.fullName} ${angle.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <span className="block text-xs font-semibold text-[#2c4c3e] mt-1.5 text-center">
                      {angle.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hair Assessment Answers Summary */}
          {candidate.hairQuiz ? (
            <div className="rounded-2xl bg-white/75 border border-white/90 p-4 space-y-2.5">
              <span className="block text-xs font-semibold text-emerald-800">
                Ringkasan Jawaban Kondisi Rambut
              </span>
              <div className="space-y-2">
                {HAIR_QUIZ_QUESTIONS.map((q) => (
                  <div
                    key={q.key}
                    className="flex items-start justify-between gap-3 text-xs border-b border-emerald-950/8 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-[#2c4c3e] leading-snug">{q.question}</span>
                    <span className="font-semibold text-[#062b1e] shrink-0">
                      {candidate.hairQuiz?.[q.key] || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            candidate.hairNote && (
              <div className="rounded-2xl bg-white/75 border border-white/90 px-4 py-3">
                <span className="block text-xs font-semibold text-emerald-800">
                  Riwayat Kondisi Rambut
                </span>
                <p className="text-xs sm:text-sm text-[#072218] mt-1 leading-relaxed">
                  {candidate.hairNote}
                </p>
              </div>
            )
          )}

          {/* Privacy Note */}
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-700/20 px-4 py-3 flex items-start gap-2.5 text-xs text-[#064e3b] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Data pendaftaran dan foto Anda tersimpan secara rahasia di database pusat dan tidak ditampilkan kepada publik.
            </span>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={onRegisterAnother}
              className="w-full min-h-[50px] px-5 py-3 rounded-2xl text-white text-sm font-semibold glass-emerald-cta flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Kembali ke Formulir Pendaftaran</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
