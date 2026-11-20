import { useCallback, useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ImageLightbox } from './components/ImageLightbox';
import { PhotoGuideView } from './components/PhotoGuideView';
import { RegistrationForm } from './components/RegistrationForm';
import { SuccessConfirmation } from './components/SuccessConfirmation';
import { ToastBanner } from './components/ToastBanner';
import type { ToastNotice } from './components/ToastBanner';
import { TopBar } from './components/TopBar';
import { FLOW_SALON_ASSETS } from './constants/assets';
import type {
  AppView,
  CandidateRecord,
  CandidateStatus,
  DatabaseSummary,
} from './types/candidate';
import { copyTextToClipboard } from './utils/imageUtils';

const EMPTY_SUMMARY: DatabaseSummary = {
  total: 0,
  pending: 0,
  shortlisted: 0,
  scheduled: 0,
  archived: 0,
};

const ADMIN_PIN_STORAGE_KEY = 'flow_salon_admin_pin';

function resolveInitialView(): AppView {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  const adminParam = params.get('admin');
  if (
    viewParam === 'admin' ||
    adminParam === '1' ||
    adminParam === 'true' ||
    window.location.pathname.endsWith('/admin')
  ) {
    return 'admin';
  }
  if (viewParam === 'guide') return 'guide';
  return 'form';
}

export function App() {
  const [activeView, setActiveView] = useState<AppView>(resolveInitialView);
  const [submittedCandidate, setSubmittedCandidate] = useState<CandidateRecord | null>(null);

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      return sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [summary, setSummary] = useState<DatabaseSummary>(EMPTY_SUMMARY);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState<ToastNotice | null>(null);
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);

  const showToast = useCallback((title: string, description?: string) => {
    const id = Date.now();
    setToast({ id, title, description });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 6500);
  }, []);

  const fetchCandidatesWithPin = useCallback(async (pin: string) => {
    if (!pin) return false;
    setIsLoadingDb(true);
    setDbError(null);
    try {
      const response = await fetch('/api/candidates', {
        headers: {
          'x-admin-pin': pin,
        },
      });
      if (response.status === 401) {
        setIsAdminAuthenticated(false);
        return false;
      }
      if (!response.ok) {
        throw new Error('Gagal memuat data kandidat dari database pusat.');
      }
      const data = (await response.json()) as {
        candidates: CandidateRecord[];
        summary: DatabaseSummary;
      };
      setCandidates(data.candidates || []);
      setSummary(data.summary || EMPTY_SUMMARY);
      setIsAdminAuthenticated(true);
      return true;
    } catch (err) {
      setDbError(
        err instanceof Error
          ? err.message
          : 'Tidak dapat terhubung ke database pusat.',
      );
      return false;
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    if (activeView === 'admin' && adminPin) {
      void fetchCandidatesWithPin(adminPin);
    }
  }, [activeView, adminPin, fetchCandidatesWithPin]);

  const handleAuthenticateAdmin = async (pin: string): Promise<boolean> => {
    const ok = await fetchCandidatesWithPin(pin);
    if (ok) {
      setAdminPin(pin);
      try {
        sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, pin);
      } catch {
        // ignore storage restrictions
      }
    }
    return ok;
  };

  const handleAdminLogout = () => {
    setAdminPin('');
    setIsAdminAuthenticated(false);
    setCandidates([]);
    try {
      sessionStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
    } catch {
      // ignore
    }
    setActiveView('form');
  };

  const handleNavigate = (view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCandidateSubmitted = (candidate: CandidateRecord) => {
    setSubmittedCandidate(candidate);
    showToast(
      'Pendaftaran Berhasil Terkirim',
      `Data ${candidate.fullName} (${candidate.registrationCode}) otomatis tersimpan di database pusat.`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterAnother = () => {
    setSubmittedCandidate(null);
    setActiveView('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyShareLink = async () => {
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const ok = await copyTextToClipboard(baseUrl);
    if (ok) {
      setLinkCopied(true);
      showToast(
        'Tautan Formulir Tersalin',
        'Bagikan tautan ini ke kandidat model melalui WhatsApp atau Instagram DM.',
      );
      window.setTimeout(() => setLinkCopied(false), 2400);
    }
  };

  const handleUpdateStatus = async (id: string, status: CandidateStatus) => {
    const response = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': adminPin,
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      showToast('Gagal memperbarui status', 'Silakan coba beberapa saat lagi.');
      return;
    }
    const data = (await response.json()) as {
      candidate: CandidateRecord;
      summary: DatabaseSummary;
    };
    setCandidates((prev) =>
      prev.map((item) => (item.id === id ? data.candidate : item)),
    );
    setSummary(data.summary);
    showToast('Status Kandidat Diperbarui', `Status ${data.candidate.fullName} telah disimpan.`);
  };

  const handleDeleteCandidate = async (id: string) => {
    const response = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-pin': adminPin,
      },
    });
    if (!response.ok) {
      showToast('Gagal menghapus data', 'Silakan coba beberapa saat lagi.');
      return;
    }
    const data = (await response.json()) as {
      deletedId: string;
      summary: DatabaseSummary;
    };
    setCandidates((prev) => prev.filter((item) => item.id !== data.deletedId));
    setSummary(data.summary);
    showToast('Data Dihapus', 'Rekaman kandidat telah dihapus dari database pusat.');
  };

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-clip">
      <TopBar
        activeView={activeView}
        onNavigate={handleNavigate}
        linkCopied={linkCopied}
        onCopyShareLink={() => void handleCopyShareLink()}
      />

      <ToastBanner notice={toast} onDismiss={() => setToast(null)} />

      <main className="flex-1">
        {activeView === 'form' &&
          (submittedCandidate ? (
            <SuccessConfirmation
              candidate={submittedCandidate}
              onRegisterAnother={handleRegisterAnother}
              onInspectImage={(src, caption) => setLightbox({ src, caption })}
            />
          ) : (
            <RegistrationForm
              onSubmitted={handleCandidateSubmitted}
              onOpenGuide={() => handleNavigate('guide')}
              onInspectImage={(src, caption) => setLightbox({ src, caption })}
            />
          ))}

        {activeView === 'guide' && (
          <PhotoGuideView
            onBackToForm={() => handleNavigate('form')}
            onInspectImage={(src, caption) => setLightbox({ src, caption })}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboardView
            candidates={candidates}
            summary={summary}
            isLoading={isLoadingDb}
            error={dbError}
            isAuthenticated={isAdminAuthenticated}
            onAuthenticate={handleAuthenticateAdmin}
            onLogout={handleAdminLogout}
            onRefresh={() => void fetchCandidatesWithPin(adminPin)}
            onUpdateStatus={handleUpdateStatus}
            onDeleteCandidate={handleDeleteCandidate}
            onOpenForm={handleRegisterAnother}
            onInspectImage={(src, caption) => setLightbox({ src, caption })}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-white/75 bg-white/55 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#244235]">
          <div className="flex items-center gap-2.5">
            <img
              src={FLOW_SALON_ASSETS.brandLogo}
              alt="Flow Salon"
              referrerPolicy="no-referrer"
              className="h-4 w-auto object-contain logo-emerald"
            />
            <span className="font-medium">· Program Model Rambut</span>
          </div>
          <div className="flex items-center gap-4 font-semibold">
            <button
              type="button"
              onClick={() => handleNavigate('form')}
              className="hover:text-[#062b1e] transition-colors cursor-pointer"
            >
              Formulir
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleNavigate('guide')}
              className="hover:text-[#062b1e] transition-colors cursor-pointer"
            >
              Panduan Foto
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleNavigate('admin')}
              className="inline-flex items-center gap-1 text-[#244235]/80 hover:text-[#062b1e] transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </footer>

      <ImageLightbox
        src={lightbox?.src || null}
        caption={lightbox?.caption}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}

export default App;
