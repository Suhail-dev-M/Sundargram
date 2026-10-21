import React, { useState } from 'react';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  isSupabaseConfigured,
} from '../../lib/supabase';
import { localStore } from '../../lib/localStore';
import { SUNDARGRAM_SCHEMA_SQL } from '../../lib/schemaSql';
import { showToast } from '../../store/useModalStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  X,
  Database,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Code,
} from 'lucide-react';

interface SupabaseConfigModalProps {
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ onClose }) => {
  const { refreshUser } = useAuthStore();
  const initial = getStoredSupabaseConfig();
  const [url, setUrl] = useState(initial.url);
  const [anonKey, setAnonKey] = useState(initial.anonKey);
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const isConnected = isSupabaseConfigured();

  const handleSave = () => {
    if (!url.trim() || !anonKey.trim()) {
      showToast('Please enter both Supabase URL and Anon Key', 'error');
      return;
    }
    if (!url.startsWith('http')) {
      showToast('Supabase URL must start with https://', 'error');
      return;
    }

    saveStoredSupabaseConfig(url.trim(), anonKey.trim());
    showToast('Supabase configuration saved! Refreshing session...', 'success');
    refreshUser();
    setTimeout(() => {
      window.location.reload();
    }, 700);
  };

  const handleClear = () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    showToast('Switched to Local Offline Mode', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUNDARGRAM_SCHEMA_SQL);
    setCopied(true);
    showToast('SQL Migration copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSeedData = () => {
    localStore.seedDemoData();
    showToast('Demo creators, stories, and reels loaded!', 'success');
    refreshUser();
    onClose();
  };

  const handleResetData = () => {
    const ok = window.confirm('Are you sure you want to reset all local data?');
    if (ok) {
      localStore.clearAllData();
      showToast('All local data cleared', 'info');
      refreshUser();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in select-none">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#262626] dark:text-[#FAFAFA]">
                Supabase Backend & Data Studio
              </h3>
              <p className="text-[11px] text-neutral-400">
                Postgres, Auth, Storage, and Realtime Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Badge */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div>
                <span className="font-bold">
                  {isConnected ? 'Connected to Live Supabase' : 'Offline Reactive Mode Active'}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {isConnected
                    ? 'All auth, posts, and real-time operations persist to your Supabase project.'
                    : 'App is running on the local reactive engine with full offline fidelity.'}
                </p>
              </div>
            </div>
          </div>

          {/* Connect Form */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#262626] dark:text-[#FAFAFA] uppercase tracking-wider">
              Supabase Project Credentials
            </h4>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-500">
                Anon Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#0095F6] text-white text-xs font-semibold rounded-lg hover:bg-[#1877F2] transition active:scale-95"
              >
                Save & Connect Supabase
              </button>

              {isConnected && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2 text-xs font-medium text-neutral-500 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {/* SQL Migration & Schema Setup */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-[#262626] dark:text-[#FAFAFA]">
                  Database Migration & SQL Script
                </h5>
                <p className="text-[11px] text-neutral-400">
                  18 tables, triggers, follower counters, RLS policies, and storage
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[#262626] dark:text-[#FAFAFA] hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-sm transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowSql(!showSql)}
              className="text-[11px] font-semibold text-[#0095F6] hover:underline flex items-center gap-1"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showSql ? 'Hide SQL Preview' : 'View SQL Schema'}</span>
            </button>

            {showSql && (
              <pre className="max-h-48 overflow-y-auto p-3 rounded-lg bg-neutral-900 text-neutral-200 text-[10px] font-mono leading-tight">
                {SUNDARGRAM_SCHEMA_SQL}
              </pre>
            )}
          </div>

          {/* Demo Content Utilities */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={handleSeedData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[#262626] dark:text-[#FAFAFA] transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Seed Demo Content (Stories, Reels & Posts)</span>
            </button>

            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
