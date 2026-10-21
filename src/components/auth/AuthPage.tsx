import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/useAuthStore';
import { showToast } from '../../store/useModalStore';
import { Eye, EyeOff } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { refreshUser } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    try {
      setLoading(true);
      const res = await api.signIn(email.trim(), password);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Welcome back!', 'success');
        refreshUser();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim() || !email.trim() || !password.trim() || loading) return;

    try {
      setLoading(true);
      const res = await api.signUp(email.trim(), password, username.trim(), fullName.trim());
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Account created successfully!', 'success');
        refreshUser();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-neutral-50 dark:bg-black select-none">
      <div className="w-full max-w-4xl flex items-center justify-center gap-10">
        {/* Left Side: Instagram Phone Mockup (Desktop only) */}
        <div className="hidden md:block relative w-[380px] h-[580px] shrink-0">
          <div className="w-full h-full rounded-[45px] p-3 bg-neutral-900 border-4 border-neutral-700 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Phone notch */}
            <div className="w-32 h-4 bg-neutral-800 rounded-full mx-auto my-1 z-20" />

            {/* Inner Phone Screen Feed Showcase */}
            <div className="w-full h-full rounded-[35px] overflow-hidden bg-neutral-950 relative flex flex-col justify-between">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between text-white">
                <Logo size="sm" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="flex-1 p-2 space-y-2 overflow-hidden">
                <div className="w-full aspect-square rounded-2xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80"
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white">
                    #architecture
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500" />
                  <div className="h-2 w-20 bg-neutral-800 rounded-full" />
                </div>
              </div>

              <div className="p-2 border-t border-neutral-800 text-center text-[10px] text-neutral-400">
                Sundargram on Mobile Web & PWA
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="w-full max-w-[360px] flex flex-col gap-3">
          {/* Main Card */}
          <div className="w-full bg-white dark:bg-neutral-900 border border-[#DBDBDB] dark:border-neutral-800 rounded-2xl p-8 flex flex-col items-center shadow-sm">
            {/* Wordmark Logo */}
            <div className="pt-2 pb-6">
              <Logo size="lg" />
            </div>

            {mode === 'signup' && (
              <p className="text-xs font-semibold text-neutral-500 text-center mb-5 leading-relaxed">
                Sign up to see photos and videos from your friends.
              </p>
            )}

            {/* FORM */}
            <form
              onSubmit={mode === 'signup' ? handleSignUp : handleLogin}
              className="w-full flex flex-col gap-2.5 mt-1"
            >
              {mode === 'signup' && (
                <>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
                  />
                </>
              )}

              <input
                type={mode === 'signup' ? 'email' : 'text'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'signup' ? 'Email address' : 'Username or email'}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400"
              />

              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-[#262626] dark:text-[#FAFAFA] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2 bg-[#0095F6] hover:bg-[#1877F2] text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Log in'}
              </button>
            </form>
          </div>

          {/* Switch Mode Card */}
          <div className="w-full bg-white dark:bg-neutral-900 border border-[#DBDBDB] dark:border-neutral-800 rounded-2xl p-4 text-center text-xs">
            {mode === 'signup' ? (
              <p className="text-neutral-600 dark:text-neutral-300">
                Have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-bold text-[#0095F6] hover:underline"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p className="text-neutral-600 dark:text-neutral-300">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="font-bold text-[#0095F6] hover:underline"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
