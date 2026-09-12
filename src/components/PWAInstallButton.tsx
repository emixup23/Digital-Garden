import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedNotice, setInstalledNotice] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstalledNotice(true);
      setTimeout(() => setInstalledNotice(false), 3000);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-950/80 to-pink-950/80 border border-[#ec4899]/30 rounded-lg text-xs text-white">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#ec4899]" />
            <span>Install PKM Notes for instant offline desktop & mobile access</span>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#ec4899] hover:bg-[#db2777] font-semibold text-white transition-colors cursor-pointer text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstall}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-medium text-pink-300 hover:text-pink-200 transition-colors cursor-pointer"
        title="Install PKM Notes as a standalone desktop or mobile application for complete offline access"
      >
        <Download className="w-3.5 h-3.5 text-[#ec4899]" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/40 text-xs font-medium text-pink-300 hover:text-pink-200 transition-colors cursor-pointer"
          title="Install PKM Notes on iOS Safari"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#ec4899]" />
          <span className="hidden sm:inline">Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-xl bg-[#150d24] border border-[#2e1c52] p-5 shadow-2xl text-[#faf5ff]">
              <div className="flex items-center justify-between pb-3 border-b border-[#2e1c52]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#ec4899]" />
                  <h3 className="text-sm font-semibold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 space-y-3 text-xs text-gray-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0c0714] border border-[#2e1c52]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ec4899] text-white font-bold text-[10px] shrink-0">
                    1
                  </span>
                  <div>
                    Tap the <strong className="text-white">Share</strong> icon (<Share className="w-3 h-3 inline text-[#ec4899]" />) in the Safari navigation bar at the bottom of the screen.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0c0714] border border-[#2e1c52]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ec4899] text-white font-bold text-[10px] shrink-0">
                    2
                  </span>
                  <div>
                    Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0c0714] border border-[#2e1c52]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ec4899] text-white font-bold text-[10px] shrink-0">
                    3
                  </span>
                  <div>
                    Tap <strong className="text-white">Add</strong> in the top right. PKM Notes is now installed on your home screen and operates completely offline!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
