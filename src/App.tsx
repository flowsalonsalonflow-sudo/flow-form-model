import { useCallback, useState } from 'react';
import { ImageLightbox } from './components/ImageLightbox';
import { PhotoGuideView } from './components/PhotoGuideView';
import { RegistrationForm } from './components/RegistrationForm';
import { SuccessConfirmation } from './components/SuccessConfirmation';
import { ToastBanner } from './components/ToastBanner';
import type { ToastNotice } from './components/ToastBanner';
import { TopBar } from './components/TopBar';
import { FLOW_SALON_ASSETS } from './constants/assets';
import type { AppView, CandidateRecord } from './types/candidate';
import { copyTextToClipboard } from './utils/imageUtils';

function resolveInitialView(): AppView {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  if (viewParam === 'guide') return 'guide';
  return 'form';
}

export function App() {
  const [activeView, setActiveView] = useState<AppView>(resolveInitialView);
  const [submittedCandidate, setSubmittedCandidate] = useState<CandidateRecord | null>(null);

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

  return (
    <div className="relative min-h-dvh flex flex-col overflow-x-clip">
      {/* Subtle Ambient Emerald Glass Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute top-[28%] -right-28 w-[380px] h-[380px] rounded-full bg-teal-400/12 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[460px] h-[360px] rounded-full bg-emerald-500/12 blur-3xl" />
      </div>

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
      </main>

      <footer className="mt-auto border-t border-white/75 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#2c4c3e]">
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
