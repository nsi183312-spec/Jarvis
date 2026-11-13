import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, Share2, MoreVertical } from 'lucide-react';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  compact = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isIframe, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Already running as an installed standalone PWA — suppress button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Install JARVIS AI to Home Screen"
        className={
          className ||
          (compact
            ? 'px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30 flex items-center gap-1 transition'
            : 'w-full px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-400/45 text-xs font-semibold text-emerald-200 flex items-center justify-between transition shadow-[0_0_16px_rgba(16,185,129,0.18)]')
        }
      >
        <span className="flex items-center gap-2">
          <Smartphone className={compact ? 'w-3 h-3' : 'w-4 h-4 text-emerald-300'} />
          <span>{compact ? 'Install' : 'Install App (PWA)'}</span>
        </span>
        {!compact && <Download className="w-3.5 h-3.5 text-emerald-300" />}
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-cyan-500/40 p-5 shadow-2xl text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="JARVIS AI Icon"
                  className="w-10 h-10 rounded-xl border border-cyan-400/40"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">Install JARVIS AI</h3>
                  <p className="text-[11px] text-cyan-300">Standalone Home Screen App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>iPhone / iPad Safari me install karne ke liye:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                  <li className="flex items-center gap-1.5">
                    <span>Safari toolbar me</span>
                    <Share2 className="w-3.5 h-3.5 text-cyan-300 inline" />
                    <strong>Share</strong>
                    <span>par tap karein.</span>
                  </li>
                  <li>
                    Neeche scroll karke <strong>Add to Home Screen</strong> chunein.
                  </li>
                  <li>
                    Top-right me <strong>Add</strong> par tap karein.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed">
                {isIframe && (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 text-[11px]">
                    Embedded preview frame ke andar browser install popup block hota hai. Android Chrome me direct App URL kholne par 1-tap install popup aa jaayega.
                  </div>
                )}
                <p>Android Chrome me Home Screen par install karne ke liye:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                  <li>
                    Chrome me top-right <MoreVertical className="w-3.5 h-3.5 inline text-cyan-300" />{' '}
                    <strong>(3 dots)</strong> menu dabayein.
                  </li>
                  <li>
                    <strong>Install app</strong> ya <strong>Add to Home screen</strong> par tap karein.
                  </li>
                  <li>
                    <strong>Install</strong> confirm karein — JARVIS AI bina browser address bar ke standalone app me khulega.
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
