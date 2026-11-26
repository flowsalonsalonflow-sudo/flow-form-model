import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Loader2,
  Send,
  ShieldCheck,
} from 'lucide-react';
import {
  FLOW_SALON_ASSETS,
  HAIR_ANGLES,
  HAIR_QUIZ_QUESTIONS,
} from '../constants/assets';
import type {
  CandidatePhotos,
  CandidateRecord,
  HairQuizAnswers,
  PhotoAngle,
} from '../types/candidate';
import { resolveAssetUrl } from '../types/candidate';
import {
  formatWhatsappInput,
  isValidIndonesianWhatsapp,
} from '../utils/imageUtils';
import { PhotoUploadCard } from './PhotoUploadCard';
import { ResilientImage } from './ResilientImage';

interface RegistrationFormProps {
  onSubmitted: (candidate: CandidateRecord) => void;
  onOpenGuide: () => void;
  onInspectImage: (src: string, caption: string) => void;
}

const EMPTY_PHOTOS: CandidatePhotos = {
  front: '',
  back: '',
  right: '',
  left: '',
};

const EMPTY_QUIZ: HairQuizAnswers = {
  coloredLast4Years: '',
  smoothedLast4Years: '',
  antiDandruffShampoo: '',
  blackShampoo: '',
  keratinLast4Years: '',
};

function buildHairNoteSummary(quiz: HairQuizAnswers): string {
  return [
    `Diwarnai (4 thn): ${quiz.coloredLast4Years}`,
    `Smoothing (4 thn): ${quiz.smoothedLast4Years}`,
    `Shampoo Anti-Ketombe: ${quiz.antiDandruffShampoo}`,
    `Shampoo Hitam: ${quiz.blackShampoo}`,
    `Keratin (4 thn): ${quiz.keratinLast4Years}`,
  ].join(' · ');
}

export function RegistrationForm({
  onSubmitted,
  onOpenGuide,
  onInspectImage,
}: RegistrationFormProps) {
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hairQuiz, setHairQuiz] = useState<HairQuizAnswers>(EMPTY_QUIZ);
  const [photos, setPhotos] = useState<CandidatePhotos>(EMPTY_PHOTOS);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const uploadedCount = HAIR_ANGLES.filter((angle) => Boolean(photos[angle.key])).length;

  const trimmedName = fullName.trim();
  const isNameValid = trimmedName.length >= 2;
  const isWhatsappValid = isValidIndonesianWhatsapp(whatsapp);
  const unansweredQuestionNumbers = HAIR_QUIZ_QUESTIONS.map((q, idx) =>
    hairQuiz[q.key] ? null : idx + 1,
  ).filter((num): num is number => num !== null);
  const isQuizComplete = unansweredQuestionNumbers.length === 0;
  const areAllPhotosReady = uploadedCount === 4;

  const missingAngles = HAIR_ANGLES.filter((angle) => !photos[angle.key]).map(
    (angle) => angle.shortLabel,
  );

  const missingSummaryItems: string[] = [];
  if (!isNameValid) {
    missingSummaryItems.push('Nama Lengkap wajib diisi (minimal 2 karakter).');
  }
  if (!isWhatsappValid) {
    missingSummaryItems.push('Nomor WhatsApp aktif wajib diisi (contoh: 0812-3456-7890).');
  }
  if (!isQuizComplete) {
    missingSummaryItems.push(
      `Pertanyaan Riwayat Kondisi Rambut nomor ${unansweredQuestionNumbers.join(', ')} wajib dipilih jawabannya.`,
    );
  }
  if (!areAllPhotosReady) {
    missingSummaryItems.push(
      `Foto Rambut tampak ${missingAngles.join(', ')} wajib diunggah (harus lengkap 4 sudut).`,
    );
  }

  const handlePhotoChange = (angle: PhotoAngle, dataUrl: string) => {
    setSubmitError(null);
    setPhotos((prev) => ({
      ...prev,
      [angle]: dataUrl,
    }));
  };

  const handleQuizAnswer = (key: keyof HairQuizAnswers, answer: string) => {
    setSubmitError(null);
    setHairQuiz((prev) => ({
      ...prev,
      [key]: answer,
    }));
  };

  const scrollToFirstInvalidField = () => {
    if (!isNameValid) {
      const el = document.getElementById('candidate-fullname');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
      return;
    }
    if (!isWhatsappValid) {
      const el = document.getElementById('candidate-whatsapp');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus();
      return;
    }
    if (!isQuizComplete) {
      const firstMissingQuiz = HAIR_QUIZ_QUESTIONS.find((q) => !hairQuiz[q.key]);
      if (firstMissingQuiz) {
        const el = document.getElementById(`quiz-row-${firstMissingQuiz.key}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    if (!areAllPhotosReady) {
      const el = document.getElementById('photo-upload-section');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setSubmitError(null);

    if (!isNameValid || !isWhatsappValid || !isQuizComplete || !areAllPhotosReady) {
      setSubmitError(
        'Pendaftaran belum dapat dikirim. Mohon lengkapi seluruh data, pertanyaan, dan 4 foto yang bertanda wajib di bawah ini.',
      );
      scrollToFirstInvalidField();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(resolveAssetUrl('/api/candidates'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: trimmedName,
          whatsapp: whatsapp.trim(),
          hairNote: buildHairNoteSummary(hairQuiz),
          hairQuiz,
          photos,
        }),
      });

      const payload = (await response.json()) as {
        candidate?: CandidateRecord;
        error?: string;
      };

      if (!response.ok || !payload.candidate) {
        throw new Error(
          payload.error || 'Gagal menyimpan pendaftaran ke database pusat.',
        );
      }

      onSubmitted(payload.candidate);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Koneksi terputus saat mengirim data. Silakan coba kembali.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 pb-12 sm:py-8 lg:py-10">
      {/* Compact Mobile Editorial Intro (Logo above title removed per user request) */}
      <div className="lg:hidden mb-4">
        <div className="glass-surface rounded-3xl p-4 flex items-center gap-3.5">
          <div className="w-16 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/80 shadow-xs">
            <ResilientImage
              src={FLOW_SALON_ASSETS.heroPortrait}
              alt="Model rambut Flow Salon"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-semibold text-[#062b1e] leading-snug">
              Pendaftaran Kandidat Model
            </h1>
            <p className="text-xs text-[#244235] mt-1 leading-relaxed">
              Isi biodata, riwayat rambut, dan 4 sudut foto rambut Anda.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop 2-Column Split / Mobile Single Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Editorial Column (Desktop) */}
        <aside className="hidden lg:flex lg:col-span-5 flex-col">
          <div className="glass-surface rounded-[28px] overflow-hidden flex flex-col h-full">
            {/* Full-bleed Hero Portrait with Measured Contrast Scrim */}
            <div className="relative flex-1 min-h-[420px] overflow-hidden">
              <ResilientImage
                src={FLOW_SALON_ASSETS.heroPortrait}
                alt="Editorial model rambut Flow Salon di studio kaca alami"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#042418]/90 via-[#042418]/35 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <h1 className="text-[34px] font-semibold leading-[1.12] text-balance">
                  Jadilah Wajah Karya Rambut Flow Salon
                </h1>
                <p className="text-sm text-emerald-50/90 mt-3 leading-relaxed max-w-md">
                  Lengkapi biodata, riwayat perawatan, dan 4 sudut foto rambut natural Anda untuk kurasi sesi perawatan dan pemotretan.
                </p>
              </div>
            </div>

            {/* Bottom Reference & Standards Strip */}
            <div className="p-6 space-y-5 bg-white/40 border-t border-white/70">
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-semibold text-[#062b1e]">
                    Standar 4 Sudut Foto Rambut
                  </h2>
                  <button
                    type="button"
                    onClick={onOpenGuide}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 cursor-pointer"
                  >
                    Panduan lengkap
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {HAIR_ANGLES.map((angle) => (
                    <button
                      key={angle.key}
                      type="button"
                      onClick={() =>
                        onInspectImage(
                          angle.sampleUrl,
                          `Contoh ${angle.title} — ${angle.guideDetail}`,
                        )
                      }
                      className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-xl cursor-pointer"
                    >
                      <div className="aspect-[3/4] rounded-xl overflow-hidden border border-white/80 bg-emerald-950/5">
                        <ResilientImage
                          src={angle.sampleUrl}
                          alt={`Contoh foto rambut ${angle.title}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <span className="block text-[11px] font-semibold text-[#244235] mt-1.5 text-center">
                        {angle.shortLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-emerald-950/10 space-y-2 text-xs text-[#244235] leading-relaxed">
                <p className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    Seluruh bagian rambut dari akar hingga ujung harus terlihat utuh tanpa penutup kepala.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    Privasi terjaga: data dan foto Anda bersifat rahasia dan tidak ditampilkan untuk umum.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Interactive Registration Form Column */}
        <section className="lg:col-span-7 flex flex-col">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="glass-surface-strong rounded-[28px] p-4 sm:p-7 lg:p-8 flex flex-col h-full"
          >
            {/* Form Heading (0/4 counter removed per user request) */}
            <div className="pb-4 border-b border-white/60">
              <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#062b1e] leading-tight">
                Formulir Kandidat Model
              </h2>
            </div>

            {/* Section 1: Data Diri */}
            <div className="py-5 space-y-4 border-b border-white/60">
              <div className="text-xs font-semibold text-emerald-900 tracking-wide">
                01. Identitas &amp; Kontak
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="candidate-fullname"
                    className="block text-sm font-semibold text-[#072218] mb-1.5"
                  >
                    Nama Lengkap <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    id="candidate-fullname"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setSubmitError(null);
                    }}
                    placeholder="Contoh: Amanda Larasati"
                    aria-invalid={attemptedSubmit && !isNameValid}
                    className={`w-full min-h-[48px] px-4 rounded-xl text-sm text-[#072218] placeholder:text-[#4e6b5e] glass-input ${
                      attemptedSubmit && !isNameValid
                        ? '!border-red-500 bg-red-50/70'
                        : ''
                    }`}
                  />
                  {attemptedSubmit && !isNameValid && (
                    <p className="mt-1.5 text-xs font-semibold text-red-700" role="alert">
                      Masukkan nama lengkap Anda (minimal 2 karakter).
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="candidate-whatsapp"
                    className="block text-sm font-semibold text-[#072218] mb-1.5"
                  >
                    Nomor WhatsApp <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    id="candidate-whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => {
                      setWhatsapp(formatWhatsappInput(e.target.value));
                      setSubmitError(null);
                    }}
                    placeholder="Contoh: 0812-3456-7890"
                    aria-invalid={attemptedSubmit && !isWhatsappValid}
                    className={`w-full min-h-[48px] px-4 rounded-xl text-sm font-mono tabular-nums text-[#072218] placeholder:font-sans placeholder:text-[#4e6b5e] glass-input ${
                      attemptedSubmit && !isWhatsappValid
                        ? '!border-red-500 bg-red-50/70'
                        : ''
                    }`}
                  />
                  {attemptedSubmit && !isWhatsappValid && (
                    <p className="mt-1.5 text-xs font-semibold text-red-700" role="alert">
                      Gunakan nomor WhatsApp aktif (08xx atau +628xx).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Multiple Choice Hair History Assessment (Airy hairline list, hanging indent on numbers) */}
            <div className="py-5 space-y-4 border-b border-white/60">
              <div>
                <div className="text-xs font-semibold text-emerald-900 tracking-wide">
                  02. Riwayat Kondisi Rambut <span className="text-emerald-700">*</span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#063b2a] mt-1 leading-relaxed">
                  Jawab Pertanyaan dibawah ini dengan jujur untuk menghindari resiko kerusakan rambutmu
                </p>
              </div>

              <div className="divide-y divide-white/55">
                {HAIR_QUIZ_QUESTIONS.map((item, idx) => {
                  const currentVal = hairQuiz[item.key];
                  const isMissing = attemptedSubmit && !currentVal;
                  return (
                    <div
                      key={item.key}
                      id={`quiz-row-${item.key}`}
                      className={`py-3.5 first:pt-1 last:pb-1 transition-colors ${
                        isMissing
                          ? 'rounded-xl bg-red-50/75 border border-red-400 px-3 my-1.5'
                          : ''
                      }`}
                    >
                      {/* Hanging indent: number column + text column so wrapped lines align with first letter */}
                      <div className="flex items-start gap-2 mb-2.5">
                        <span className="text-xs sm:text-sm font-semibold text-[#072218] leading-snug shrink-0 tabular-nums w-4">
                          {idx + 1}.
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-[#072218] leading-snug flex-1">
                          {item.question} <span className="text-emerald-700">*</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pl-6">
                        {item.options.map((opt) => {
                          const selected = currentVal === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleQuizAnswer(item.key, opt)}
                              aria-pressed={selected}
                              className={`min-h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                                selected
                                  ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800'
                                  : isMissing
                                    ? 'bg-white/80 hover:bg-white text-red-900 border border-red-400'
                                    : 'bg-white/50 hover:bg-white/75 text-[#0f3023] border border-white/80'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {isMissing && (
                        <p className="mt-2 pl-6 text-xs font-semibold text-red-700" role="alert">
                          Pertanyaan nomor {idx + 1} wajib dipilih salah satu jawabannya.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: 4-Angle Hair Photo Uploads */}
            <div id="photo-upload-section" className="py-5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="text-xs font-semibold text-emerald-900 tracking-wide">
                  03. Unggahan 4 Foto Rambut <span className="text-emerald-700">*</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-950 min-h-[36px] px-2 -mr-2 rounded-lg hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
                  <span>Panduan Foto</span>
                </button>
              </div>

              {/* Essential Hair Visibility Requirement Notice */}
              <div className="rounded-2xl bg-white/45 border border-white/75 px-3.5 py-2.5 mb-3.5">
                <p className="text-xs font-medium text-[#063b2a] leading-relaxed">
                  Pastikan seluruh bagian rambut terlihat jelas dari akar hingga ujung pada keempat sudut (depan, belakang, kanan, dan kiri).
                </p>
              </div>

              {attemptedSubmit && !areAllPhotosReady && (
                <div
                  role="alert"
                  className="mb-3.5 rounded-2xl bg-red-50/90 border border-red-400 px-3.5 py-2.5 flex items-start gap-2 text-red-900"
                >
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs font-semibold leading-relaxed">
                    Wajib dilengkapi: Foto rambut tampak {missingAngles.join(', ')} belum diunggah. Semua 4 foto wajib diisi.
                  </p>
                </div>
              )}

              {/* 2x2 Mobile-First Grid for the 4 Angles */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {HAIR_ANGLES.map((angle) => (
                  <PhotoUploadCard
                    key={angle.key}
                    angle={angle}
                    value={photos[angle.key]}
                    hasError={attemptedSubmit && !photos[angle.key]}
                    onChange={(dataUrl) => handlePhotoChange(angle.key, dataUrl)}
                    onInspect={onInspectImage}
                    onError={(msg) => setSubmitError(msg)}
                  />
                ))}
              </div>
            </div>

            {/* Validation / Network Error Feedback */}
            {(submitError || (attemptedSubmit && missingSummaryItems.length > 0)) && (
              <div
                role="alert"
                className="mb-4 rounded-2xl bg-red-50/95 border border-red-400 px-4 py-3.5 flex items-start gap-2.5 text-red-900 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <p className="font-semibold leading-relaxed">
                    {submitError ||
                      'Pendaftaran belum dapat dikirim. Mohon lengkapi seluruh data berikut:'}
                  </p>
                  {attemptedSubmit && missingSummaryItems.length > 0 && (
                    <ul className="list-disc pl-4 space-y-1 text-xs font-medium text-red-800">
                      {missingSummaryItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="pt-4 border-t border-white/60">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl text-white text-sm sm:text-[15px] font-semibold flex items-center justify-center gap-2.5 glass-emerald-cta disabled:opacity-65 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Menyimpan Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Kirim Pendaftaran</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
