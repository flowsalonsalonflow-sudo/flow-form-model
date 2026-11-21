import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Award,
  CalendarCheck,
  Clock,
  ExternalLink,
  FolderArchive,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import {
  FLOW_SALON_ASSETS,
  HAIR_ANGLES,
  HAIR_QUIZ_QUESTIONS,
  STATUS_LABELS,
} from '../constants/assets';
import type {
  CandidateRecord,
  CandidateStatus,
  DatabaseSummary,
  HairQuizAnswers,
} from '../types/candidate';
import { resolveAssetUrl } from '../types/candidate';
import {
  buildWhatsappLink,
  formatIndonesianDateTime,
} from '../utils/imageUtils';
import { ResilientImage } from './ResilientImage';

interface AdminDashboardViewProps {
  candidates: CandidateRecord[];
  summary: DatabaseSummary;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onAuthenticate: (pin: string) => Promise<boolean>;
  onLogout: () => void;
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: CandidateStatus) => Promise<void>;
  onDeleteCandidate: (id: string) => Promise<void>;
  onOpenForm: () => void;
  onInspectImage: (src: string, caption: string) => void;
}

type QuizFilterState = Record<keyof HairQuizAnswers, string>;

const INITIAL_QUIZ_FILTERS: QuizFilterState = {
  coloredLast4Years: 'all',
  smoothedLast4Years: 'all',
  antiDandruffShampoo: 'all',
  blackShampoo: 'all',
  keratinLast4Years: 'all',
};

const QUIZ_SHORT_LABELS: Record<keyof HairQuizAnswers, string> = {
  coloredLast4Years: '1. Diwarnai (4 thn)',
  smoothedLast4Years: '2. Smoothing (4 thn)',
  antiDandruffShampoo: '3. Shampoo Anti-Ketombe',
  blackShampoo: '4. Shampoo Hitam',
  keratinLast4Years: '5. Treatment Keratin (4 thn)',
};

const FILTER_OPTIONS: Array<{ id: 'all' | CandidateStatus; label: string }> = [
  { id: 'all', label: 'Semua Status' },
  { id: 'pending', label: 'Menunggu Review' },
  { id: 'shortlisted', label: 'Lolos Kurasi' },
  { id: 'scheduled', label: 'Dijadwalkan' },
];

function StatusIcon({ status }: { status: CandidateStatus }) {
  switch (status) {
    case 'shortlisted':
      return <Award className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />;
    case 'scheduled':
      return <CalendarCheck className="w-3.5 h-3.5 text-teal-800" aria-hidden="true" />;
    case 'archived':
      return <FolderArchive className="w-3.5 h-3.5 text-[#2c4c3e]" aria-hidden="true" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />;
  }
}

function statusTextColor(status: CandidateStatus): string {
  switch (status) {
    case 'shortlisted':
      return 'text-emerald-800';
    case 'scheduled':
      return 'text-teal-900';
    case 'archived':
      return 'text-[#2c4c3e]';
    default:
      return 'text-amber-800';
  }
}

export function AdminDashboardView({
  candidates,
  summary,
  isLoading,
  error,
  isAuthenticated,
  onAuthenticate,
  onLogout,
  onRefresh,
  onUpdateStatus,
  onDeleteCandidate,
  onOpenForm,
  onInspectImage,
}: AdminDashboardViewProps) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | CandidateStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizFilters, setQuizFilters] = useState<QuizFilterState>(INITIAL_QUIZ_FILTERS);
  const [showQuizFilterPanel, setShowQuizFilterPanel] = useState(true);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handlePinSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPinError(null);
    if (!pinInput.trim()) {
      setPinError('Masukkan PIN atau password Admin Flow Salon.');
      return;
    }
    setIsVerifyingPin(true);
    try {
      const ok = await onAuthenticate(pinInput.trim());
      if (!ok) {
        setPinError('PIN Admin tidak sesuai. Silakan coba lagi.');
      } else {
        setPinInput('');
      }
    } finally {
      setIsVerifyingPin(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
        <form
          onSubmit={handlePinSubmit}
          className="glass-surface-strong rounded-[28px] p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700/15 border border-emerald-700/25 flex items-center justify-center text-emerald-800">
              <Lock className="w-5 h-5" aria-hidden="true" />
            </div>
            <img
              src={resolveAssetUrl(FLOW_SALON_ASSETS.brandLogo)}
              alt="Flow Salon"
              referrerPolicy="no-referrer"
              className="h-6 w-auto object-contain logo-emerald"
            />
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-[#062b1e]">
              Akses Admin Flow Salon
            </h1>
            <p className="text-xs sm:text-sm text-[#244235] mt-1 leading-relaxed">
              Halaman ini dikhususkan bagi tim internal Flow Salon untuk meninjau data dan 4 foto sudut rambut kandidat.
            </p>
          </div>

          <div>
            <label
              htmlFor="admin-pin-input"
              className="block text-xs font-semibold text-[#072218] mb-1.5"
            >
              PIN / Kode Akses Admin
            </label>
            <div className="relative">
              <KeyRound
                className="w-4 h-4 text-[#4e6b5e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="admin-pin-input"
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="Masukkan kode akses admin"
                autoFocus
                className="w-full min-h-[48px] pl-10 pr-4 rounded-xl text-sm text-[#072218] placeholder:text-[#4e6b5e] glass-input"
              />
            </div>
            {pinError && (
              <p className="mt-1.5 text-xs font-semibold text-red-700" role="alert">
                {pinError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="submit"
              disabled={isVerifyingPin}
              className="w-full min-h-[48px] rounded-xl text-white text-sm font-semibold glass-emerald-cta flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifyingPin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <span>Masuk ke Database Admin</span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenForm}
              className="w-full min-h-[44px] rounded-xl bg-white/55 hover:bg-white/75 text-xs font-semibold text-[#062b1e] transition-colors cursor-pointer"
            >
              Kembali ke Formulir Kandidat
            </button>
          </div>
        </form>
      </div>
    );
  }

  const activeQuizFilterCount = HAIR_QUIZ_QUESTIONS.filter(
    (q) => quizFilters[q.key] !== 'all',
  ).length;

  const handleSetQuizFilter = (key: keyof HairQuizAnswers, value: string) => {
    setQuizFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetAllFilters = () => {
    setQuizFilters(INITIAL_QUIZ_FILTERS);
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Preset helper: Ideal Virgin/Healthy Hair (All "Tidak Pernah" / "Tidak")
  const handleApplyVirginHairPreset = () => {
    setQuizFilters({
      coloredLast4Years: 'Tidak Pernah',
      smoothedLast4Years: 'Tidak Pernah',
      antiDandruffShampoo: 'Tidak',
      blackShampoo: 'Tidak',
      keratinLast4Years: 'Tidak Pernah',
    });
  };

  const selectedCandidate =
    candidates.find((item) => item.id === selectedCandidateId) || null;

  const getCandidateQuizAnswer = (
    item: CandidateRecord,
    key: keyof HairQuizAnswers,
  ): string => {
    if (item.hairQuiz && item.hairQuiz[key]) {
      return item.hairQuiz[key];
    }
    if (!item.hairNote) return '';
    const prefixMap: Record<keyof HairQuizAnswers, string> = {
      coloredLast4Years: 'Diwarnai (4 thn):',
      smoothedLast4Years: 'Smoothing (4 thn):',
      antiDandruffShampoo: 'Shampoo Anti-Ketombe:',
      blackShampoo: 'Shampoo Hitam:',
      keratinLast4Years: 'Keratin (4 thn):',
    };
    const prefix = prefixMap[key];
    const parts = item.hairNote.split('·').map((s) => s.trim());
    const matched = parts.find((p) => p.startsWith(prefix));
    if (!matched) return '';
    return matched.slice(prefix.length).trim();
  };

  const filteredCandidates = candidates.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.fullName.toLowerCase().includes(q) ||
      item.whatsappDisplay.toLowerCase().includes(q) ||
      item.whatsappNormalized.includes(q) ||
      item.registrationCode.toLowerCase().includes(q);

    const matchesQuiz = HAIR_QUIZ_QUESTIONS.every((question) => {
      const targetAnswer = quizFilters[question.key];
      if (!targetAnswer || targetAnswer === 'all') {
        return true;
      }
      const candidateAnswer = getCandidateQuizAnswer(item, question.key);
      return candidateAnswer === targetAnswer;
    });

    return matchesStatus && matchesQuery && matchesQuiz;
  });

  const handleStatusChange = async (id: string, nextStatus: CandidateStatus) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, nextStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingId(id);
    try {
      await onDeleteCandidate(id);
      if (selectedCandidateId === id) {
        setSelectedCandidateId(null);
      }
      setConfirmDeleteId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-5 sm:py-10 space-y-5">
      {/* Header & Summary Metrics */}
      <section className="glass-surface-strong rounded-[28px] p-5 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-900 tracking-wide">
              Panel Internal Flow Salon · Privat
            </p>
            <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#062b1e] leading-[1.1] mt-1">
              Database Kandidat Model
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="min-h-[44px] px-3.5 rounded-xl bg-white/65 hover:bg-white/85 border border-white/80 text-xs sm:text-sm font-semibold text-[#062b1e] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 text-emerald-700 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={onOpenForm}
              className="min-h-[44px] px-3.5 rounded-xl text-white text-xs sm:text-sm font-semibold glass-emerald-cta inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Lihat Formulir</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Keluar dari sesi Admin"
              className="min-h-[44px] px-3.5 rounded-xl bg-white/55 hover:bg-red-50/80 border border-white/80 text-xs sm:text-sm font-semibold text-red-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* 4-Column Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-white/60">
          <div>
            <span className="block text-xs font-medium text-[#244235]">Total Kandidat</span>
            <span className="block text-2xl sm:text-3xl font-semibold text-[#062b1e] tabular-nums mt-1">
              {summary.total}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-[#244235]">Menunggu Review</span>
            <span className="block text-2xl sm:text-3xl font-semibold text-amber-800 tabular-nums mt-1">
              {summary.pending}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-[#244235]">Lolos Kurasi</span>
            <span className="block text-2xl sm:text-3xl font-semibold text-emerald-800 tabular-nums mt-1">
              {summary.shortlisted}
            </span>
          </div>
          <div>
            <span className="block text-xs font-medium text-[#244235]">Dijadwalkan</span>
            <span className="block text-2xl sm:text-3xl font-semibold text-teal-900 tabular-nums mt-1">
              {summary.scheduled}
            </span>
          </div>
        </div>
      </section>

      {/* Status & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter status kandidat"
          className="flex items-center gap-1 p-1 rounded-2xl bg-white/50 backdrop-blur-md border border-white/75 overflow-x-auto"
        >
          {FILTER_OPTIONS.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-[#244235] hover:text-[#062b1e] hover:bg-white/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search
              className="w-4 h-4 text-[#4e6b5e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, WhatsApp, kode..."
              aria-label="Cari kandidat"
              className="w-full min-h-[44px] pl-10 pr-4 rounded-2xl text-sm text-[#072218] placeholder:text-[#4e6b5e] glass-input"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowQuizFilterPanel((prev) => !prev)}
            aria-expanded={showQuizFilterPanel}
            className={`min-h-[44px] px-3.5 rounded-2xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 shrink-0 transition-colors cursor-pointer ${
              activeQuizFilterCount > 0
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white/60 hover:bg-white/80 text-[#062b1e] border border-white/80'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>
              Filter Jawaban{activeQuizFilterCount > 0 ? ` (${activeQuizFilterCount})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive 5-Question Answer Filter Panel */}
      {showQuizFilterPanel && (
        <section className="glass-surface rounded-[24px] p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/60">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-[#062b1e]">
                Penyaringan Berdasarkan Jawaban Kondisi Rambut
              </h2>
              <p className="text-xs text-[#244235] mt-0.5">
                Kombinasikan jawaban Pertanyaan 1–5 untuk menyaring kandidat sesuai kriteria yang Anda cari.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleApplyVirginHairPreset}
                className="min-h-[36px] px-3 rounded-xl bg-emerald-800/12 hover:bg-emerald-800/20 border border-emerald-800/20 text-xs font-semibold text-emerald-950 transition-colors cursor-pointer whitespace-nowrap"
              >
                Filter Rambut Virgin (Semua Tidak)
              </button>

              {activeQuizFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setQuizFilters(INITIAL_QUIZ_FILTERS)}
                  className="min-h-[36px] px-3 rounded-xl bg-white/70 hover:bg-white border border-white/85 text-xs font-semibold text-[#062b1e] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset Filter Jawaban</span>
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-white/55">
            {HAIR_QUIZ_QUESTIONS.map((item, idx) => {
              const selectedVal = quizFilters[item.key];
              const filterChoices = ['all', item.options[0], item.options[1]];

              return (
                <div
                  key={item.key}
                  className="py-3 first:pt-1 last:pb-1 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5"
                >
                  <div className="flex items-start gap-2 pr-2">
                    <span className="text-xs sm:text-sm font-semibold text-[#072218] tabular-nums shrink-0 w-4">
                      {idx + 1}.
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-[#072218] leading-snug">
                      {item.question}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pl-6 lg:pl-0 lg:w-[340px] shrink-0">
                    {filterChoices.map((choice) => {
                      const isActive = selectedVal === choice;
                      const label = choice === 'all' ? 'Semua' : choice;
                      return (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => handleSetQuizFilter(item.key, choice)}
                          className={`min-h-[38px] px-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white/55 hover:bg-white/80 text-[#1b3a2d] border border-white/75'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Match count bar */}
          <div className="pt-3 border-t border-white/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[#244235]">
            <span className="font-semibold tabular-nums">
              Menampilkan {filteredCandidates.length} dari {candidates.length} kandidat
            </span>
            {(activeQuizFilterCount > 0 || statusFilter !== 'all' || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="font-semibold text-emerald-900 hover:underline cursor-pointer"
              >
                Tampilkan Semua Kandidat
              </button>
            )}
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="glass-surface rounded-2xl p-5 border-red-300/80 text-sm text-red-900"
        >
          {error}
        </div>
      )}

      {isLoading && candidates.length === 0 ? (
        <div className="glass-surface rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-[#244235]">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" aria-hidden="true" />
          <span className="text-sm font-semibold">Memuat data kandidat...</span>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="glass-surface rounded-3xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-[#062b1e]">
            Tidak ada kandidat dengan kombinasi jawaban tersebut
          </p>
          <p className="text-xs sm:text-sm text-[#244235] max-w-md mx-auto">
            Coba ubah salah satu filter jawaban di atas atau tekan tombol di bawah untuk mereset penyaringan.
          </p>
          {(activeQuizFilterCount > 0 || statusFilter !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="min-h-[42px] px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCandidates.map((candidate) => (
            <article
              key={candidate.id}
              className="glass-surface rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 transition-transform duration-200 hover:-translate-y-0.5"
            >
              {/* Top 4-Angle Hair Mosaic */}
              <button
                type="button"
                onClick={() => setSelectedCandidateId(candidate.id)}
                className="grid grid-cols-4 gap-1.5 rounded-2xl overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                aria-label={`Lihat 4 foto rambut ${candidate.fullName}`}
              >
                {HAIR_ANGLES.map((angle) => (
                  <div
                    key={angle.key}
                    className="relative aspect-[3/4] overflow-hidden bg-emerald-950/5"
                  >
                    <ResilientImage
                      src={candidate.photos[angle.key]}
                      alt={`${candidate.fullName} ${angle.title}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 py-0.5 text-[10px] font-semibold text-white text-center bg-black/60 backdrop-blur-xs">
                      {angle.shortLabel}
                    </span>
                  </div>
                ))}
              </button>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-[#062b1e] leading-snug">
                    {candidate.fullName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${statusTextColor(
                      candidate.status,
                    )}`}
                  >
                    <StatusIcon status={candidate.status} />
                    <span>{STATUS_LABELS[candidate.status]}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#244235] tabular-nums">
                  <span className="font-mono font-medium">{candidate.whatsappDisplay}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{candidate.registrationCode}</span>
                </div>

                <p className="text-xs text-[#2c4c3e] tabular-nums">
                  Masuk {formatIndonesianDateTime(candidate.createdAt)}
                </p>

                {/* Structured 5 Quiz Answers Summary on Card */}
                {candidate.hairQuiz ? (
                  <div className="pt-2 mt-1 border-t border-white/50 space-y-1 text-xs">
                    {HAIR_QUIZ_QUESTIONS.map((q) => {
                      const ans = candidate.hairQuiz?.[q.key] || '-';
                      return (
                        <div
                          key={q.key}
                          className="flex items-center justify-between gap-2 text-[#244235]"
                        >
                          <span className="truncate">{QUIZ_SHORT_LABELS[q.key]}</span>
                          <span className="font-semibold text-[#062b1e] shrink-0">
                            {ans}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  candidate.hairNote && (
                    <p className="text-xs text-[#072218] pt-1 line-clamp-2 leading-relaxed">
                      {candidate.hairNote}
                    </p>
                  )
                )}
              </div>

              <div className="pt-3 border-t border-white/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCandidateId(candidate.id)}
                  className="flex-1 min-h-[42px] px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  Detail &amp; 4 Foto
                </button>
                <a
                  href={buildWhatsappLink(
                    candidate.whatsappNormalized,
                    candidate.fullName,
                    candidate.registrationCode,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] px-3.5 rounded-xl bg-white/70 hover:bg-white border border-white/85 text-xs font-semibold text-[#062b1e] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/55 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail kandidat ${selectedCandidate.fullName}`}
          onClick={() => {
            setSelectedCandidateId(null);
            setConfirmDeleteId(null);
          }}
        >
          <div
            className="glass-dark-sheet w-full sm:max-w-3xl max-h-[90dvh] rounded-t-3xl sm:rounded-[28px] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden pt-3 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-emerald-950/20" />
            </div>

            <div className="px-5 sm:px-7 py-4 border-b border-emerald-950/10 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#244235] tabular-nums">
                  <span className="font-mono font-semibold text-emerald-800">
                    {selectedCandidate.registrationCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatIndonesianDateTime(selectedCandidate.createdAt)}</span>
                </div>
                <h2 className="text-2xl font-semibold text-[#062b1e] mt-0.5">
                  {selectedCandidate.fullName}
                </h2>
                <p className="text-sm font-mono text-[#244235] tabular-nums mt-0.5">
                  WhatsApp: {selectedCandidate.whatsappDisplay}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCandidateId(null);
                  setConfirmDeleteId(null);
                }}
                aria-label="Tutup detail kandidat"
                className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl hover:bg-emerald-950/10 text-[#062b1e] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-5 sm:p-7 overflow-y-auto space-y-5">
              <div>
                <span className="block text-xs font-semibold text-emerald-900 mb-2.5">
                  Foto 4 Sudut Rambut (Ketuk untuk memperbesar)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {HAIR_ANGLES.map((angle) => (
                    <button
                      key={angle.key}
                      type="button"
                      onClick={() =>
                        onInspectImage(
                          selectedCandidate.photos[angle.key],
                          `${selectedCandidate.fullName} — ${angle.title}`,
                        )
                      }
                      className="group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-2xl"
                    >
                      <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/90 bg-emerald-950/5">
                        <ResilientImage
                          src={selectedCandidate.photos[angle.key]}
                          alt={`${selectedCandidate.fullName} ${angle.title}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <span className="block text-xs font-semibold text-[#062b1e] mt-1.5 text-center">
                        {angle.shortLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCandidate.hairQuiz ? (
                <div className="rounded-2xl bg-white/70 border border-white/90 p-4 space-y-2">
                  <span className="block text-xs font-semibold text-emerald-900">
                    Jawaban Riwayat Kondisi Rambut
                  </span>
                  {HAIR_QUIZ_QUESTIONS.map((q, i) => (
                    <div
                      key={q.key}
                      className="flex items-start justify-between gap-3 text-xs border-b border-emerald-950/10 pb-2 last:border-b-0 last:pb-0"
                    >
                      <span className="text-[#244235]">
                        {i + 1}. {q.question}
                      </span>
                      <span className="font-semibold text-[#062b1e] shrink-0">
                        {selectedCandidate.hairQuiz?.[q.key] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                selectedCandidate.hairNote && (
                  <div className="rounded-2xl bg-white/70 border border-white/90 p-4">
                    <span className="block text-xs font-semibold text-emerald-900">
                      Riwayat Kondisi Rambut
                    </span>
                    <p className="text-sm text-[#072218] mt-1 leading-relaxed">
                      {selectedCandidate.hairNote}
                    </p>
                  </div>
                )
              )}

              <div className="space-y-2">
                <span className="block text-xs font-semibold text-[#244235]">
                  Status Kurasi Tim Flow Salon
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['pending', 'shortlisted', 'scheduled', 'archived'] as CandidateStatus[]).map(
                    (statusOption) => {
                      const active = selectedCandidate.status === statusOption;
                      return (
                        <button
                          key={statusOption}
                          type="button"
                          disabled={updatingId === selectedCandidate.id}
                          onClick={() =>
                            void handleStatusChange(selectedCandidate.id, statusOption)
                          }
                          className={`min-h-[42px] px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'bg-white/75 hover:bg-white text-[#072218] border border-emerald-950/12'
                          }`}
                        >
                          {STATUS_LABELS[statusOption]}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-7 py-4 border-t border-emerald-950/10 bg-white/50 flex flex-wrap items-center justify-between gap-3">
              {confirmDeleteId === selectedCandidate.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-red-800">
                    Hapus data ini?
                  </span>
                  <button
                    type="button"
                    disabled={updatingId === selectedCandidate.id}
                    onClick={() => void handleDelete(selectedCandidate.id)}
                    className="min-h-[40px] px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="min-h-[40px] px-3 rounded-xl bg-white/80 text-xs font-semibold text-[#244235] cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(selectedCandidate.id)}
                  className="min-h-[42px] px-3.5 rounded-xl text-xs font-semibold text-red-700 hover:bg-red-50/90 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  <span>Hapus Data</span>
                </button>
              )}

              <a
                href={buildWhatsappLink(
                  selectedCandidate.whatsappNormalized,
                  selectedCandidate.fullName,
                  selectedCandidate.registrationCode,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 rounded-xl text-white text-xs sm:text-sm font-semibold glass-emerald-cta inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Hubungi via WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
