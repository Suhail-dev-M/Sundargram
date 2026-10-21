import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'minimal' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    if (variant === 'minimal') {
      return (
        <button
          onClick={install}
          title="Install Sundargram App"
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0095F6] text-white hover:bg-[#1877F2] transition active:scale-95 ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      );
    }
    return (
      <button
        onClick={install}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold bg-[#0095F6] text-white hover:bg-[#1877F2] shadow-sm transition active:scale-98 ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>Install Sundargram PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition ${className}`}
        >
          <Share className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Install on iPhone / iPad</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                1. Tap the <strong className="text-[#0095F6]">Share</strong> icon in the Safari navigation bar.<br />
                2. Scroll down and tap <strong className="text-neutral-900 dark:text-white">Add to Home Screen</strong>.<br />
                3. Enjoy native full-screen Instagram gestures and offline storage!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 py-2.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
