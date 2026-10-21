import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useModalStore, showToast } from '../../store/useModalStore';
import { api } from '../../lib/api';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  isSupabaseConfigured,
} from '../../lib/supabase';
import { SUNDARGRAM_SCHEMA_SQL } from '../../lib/schemaSql';
import {
  X,
  Moon,
  Sun,
  Smartphone,
  Lock,
  Database,
  Copy,
  Check,
  LogOut,
  ChevronRight,
  Shield,
  Code,
  Download,
  Package,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { currentUser, logout, refreshUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  const [activeSection, setActiveSection] = useState<'main' | 'appearance' | 'privacy' | 'database' | 'downloads'>('main');

  // Privacy state
  const [isPrivate, setIsPrivate] = useState(currentUser?.is_private || false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Supabase state
  const initial = getStoredSupabaseConfig();
  const [url, setUrl] = useState(initial.url);
  const [anonKey, setAnonKey] = useState(initial.anonKey);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const isConnected = isSupabaseConfigured();

  const handleTogglePrivacy = async (val: boolean) => {
    if (!currentUser) return;
    setIsPrivate(val);
    try {
      setSavingPrivacy(true);
      await api.updateProfile(currentUser.id, { is_private: val });
      showToast(val ? 'Account is now private' : 'Account is now public', 'success');
      refreshUser();
    } catch {
      setIsPrivate(!val);
      showToast('Failed to update privacy', 'error');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleSaveSupabase = () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('Please enter both Supabase URL and Anon Key', 'error');
      return;
    }
    if (!url.startsWith('http')) {
      showToast('Supabase URL must start with https://', 'error');
      return;
    }
    saveStoredSupabaseConfig(url.trim(), anonKey.trim());
    showToast('Supabase configuration saved! Reloading...', 'success');
    refreshUser();
    setTimeout(() => window.location.reload(), 600);
  };

  const handleClearSupabase = () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    showToast('Switched to Local Mode', 'info');
    setTimeout(() => window.location.reload(), 500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUNDARGRAM_SCHEMA_SQL);
    setCopied(true);
    showToast('SQL Migration copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <header className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeSection !== 'main' && (
              <button
                onClick={() => setActiveSection('main')}
                className="text-xs font-semibold text-[#0095F6] hover:underline mr-1"
              >
                Back
              </button>
            )}
            <h3 className="text-base font-bold text-[#262626] dark:text-[#FAFAFA]">
              {activeSection === 'main' && 'Settings'}
              {activeSection === 'appearance' && 'Appearance'}
              {activeSection === 'privacy' && 'Account Privacy'}
              {activeSection === 'database' && 'Database & Supabase'}
              {activeSection === 'downloads' && 'Project ZIP Downloads'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* MAIN MENU */}
          {activeSection === 'main' && (
            <div className="flex flex-col gap-1 divide-y divide-neutral-100 dark:divide-neutral-800">
              {/* 1. Appearance (Dark / Light) */}
              <button
                onClick={() => setActiveSection('appearance')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      Appearance
                    </span>
                    <span className="text-xs text-neutral-400">
                      {theme === 'dark' ? 'Dark theme' : 'Light theme'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {/* 2. Account Privacy */}
              <button
                onClick={() => setActiveSection('privacy')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      Account Privacy
                    </span>
                    <span className="text-xs text-neutral-400">
                      {isPrivate ? 'Private account' : 'Public account'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {/* 3. Database & Supabase Settings */}
              <button
                onClick={() => setActiveSection('database')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    <Database className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      Supabase & Backend
                    </span>
                    <span className="text-xs text-neutral-400">
                      {isConnected ? 'Connected to Supabase' : 'Offline Engine'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {/* 4. Download Project ZIPs */}
              <button
                onClick={() => setActiveSection('downloads')}
                className="w-full flex items-center justify-between p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 rounded-xl transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      Project ZIP Downloads
                    </span>
                    <span className="text-xs text-neutral-400">
                      Hosting ZIP (Vercel/Netlify) & Clean GitHub ZIP
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              {/* 5. Log Out */}
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="w-full flex items-center gap-3 p-3.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition text-rose-500 text-left mt-2"
              >
                <div className="p-2 rounded-lg bg-rose-100/50 dark:bg-rose-950/40">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold">Log Out</span>
              </button>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeSection === 'appearance' && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-neutral-500">
                Choose how Sundargram looks on your device.
              </p>

              <div className="space-y-2">
                {/* Light Mode */}
                <div
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                    theme === 'light'
                      ? 'border-[#0095F6] bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <div>
                      <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                        Light Mode
                      </span>
                      <p className="text-[11px] text-neutral-400">Classic bright social canvas</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      theme === 'light'
                        ? 'bg-[#0095F6] border-[#0095F6] text-white'
                        : 'border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {theme === 'light' && <Check className="w-3 h-3 stroke-[3px]" />}
                  </div>
                </div>

                {/* Dark Mode */}
                <div
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                    theme === 'dark'
                      ? 'border-[#0095F6] bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5 text-[#0095F6]" />
                    <div>
                      <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                        Dark Mode
                      </span>
                      <p className="text-[11px] text-neutral-400">High contrast pitch-black palette</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      theme === 'dark'
                        ? 'bg-[#0095F6] border-[#0095F6] text-white'
                        : 'border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {theme === 'dark' && <Check className="w-3 h-3 stroke-[3px]" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY SECTION */}
          {activeSection === 'privacy' && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#0095F6] mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA]">
                      Private Account
                    </span>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      When your account is private, only people you approve can see your photos, videos, and stories.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  disabled={savingPrivacy}
                  onChange={(e) => handleTogglePrivacy(e.target.checked)}
                  className="w-5 h-5 accent-[#0095F6] cursor-pointer shrink-0 ml-3"
                />
              </div>
            </div>
          )}

          {/* DATABASE & SUPABASE SECTION */}
          {activeSection === 'database' && (
            <div className="space-y-4 py-2">
              <div
                className={`p-3 rounded-xl border text-xs ${
                  isConnected
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                    }`}
                  />
                  <span className="font-semibold">
                    {isConnected ? 'Connected to Live Supabase' : 'Running in Local Offline Mode'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Project URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-500">Anon Public Key</label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUz..."
                    className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveSupabase}
                    className="px-3.5 py-1.5 bg-[#0095F6] text-white text-xs font-semibold rounded-lg hover:bg-[#1877F2] transition"
                  >
                    Save & Connect
                  </button>
                  {isConnected && (
                    <button
                      onClick={handleClearSupabase}
                      className="px-3 py-1.5 text-xs text-neutral-500 hover:text-rose-500 rounded-lg transition"
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={handleCopySql}
                    className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOWNLOADS SECTION */}
          {activeSection === 'downloads' && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-neutral-500 leading-relaxed">
                Download ready-to-use project archives for zero-configuration hosting or clean GitHub publishing.
              </p>

              {/* Package 1: Zero-NPM Ready-to-Upload Hosting ZIP */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
                        Ready-to-Upload ZIP (No npm needed)
                      </h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        Pre-compiled • Zero Node.js or npm install required
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-md">
                    Zero npm
                  </span>
                </div>
                
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Everything is 100% pre-built! Contains <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">index.html</code> right at the root, along with <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">assets/</code>, <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">404.html</code>, <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">_redirects</code>, <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">vercel.json</code>, <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">netlify.toml</code>, and <code className="px-1 py-0.5 rounded bg-neutral-200/80 dark:bg-neutral-800 text-[11px]">.htaccess</code>.
                </p>

                <div className="p-2.5 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-neutral-600 dark:text-neutral-400 space-y-1">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400">⚡ How to host in 30 seconds:</div>
                  <div>1. Download the ZIP file below.</div>
                  <div>2. Go to <span className="font-mono text-neutral-800 dark:text-neutral-200">app.netlify.com/drop</span> (or Cloudflare Pages / cPanel).</div>
                  <div>3. Drag & drop the ZIP directly into the page. Your site goes live instantly!</div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <a
                    href="/downloads/sundargram-ready-to-host.zip"
                    download="sundargram-ready-to-host.zip"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Ready-to-Host ZIP</span>
                  </a>
                  <a
                    href="/downloads/sundargram-deploy.zip"
                    download="sundargram-deploy.zip"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-xs font-medium rounded-xl transition"
                    title="Mirrors the same zero-npm hosting package"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>sundargram-deploy.zip</span>
                  </a>
                </div>
              </div>

              {/* Package 2: GitHub ZIP */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                      <Code className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
                        Clean GitHub Project ZIP
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Clean source repository for GitHub
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-md">
                    Source Code
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  Completely stripped of AI/Studio details. Includes MIT License, clean <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[11px]">package.json</code>, clean <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-[11px]">.env.example</code>, full TypeScript React source code, Supabase SQL migration, and a comprehensive GitHub README with feature showcase and badges.
                </p>
                <a
                  href="/downloads/sundargram-github.zip"
                  download="sundargram-github.zip"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-[#262626] dark:text-[#FAFAFA] text-xs font-semibold rounded-xl shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download sundargram-github.zip</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
