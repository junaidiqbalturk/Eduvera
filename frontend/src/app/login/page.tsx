'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { eduveraApi } from '../../lib/services/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AuthBackground } from '../../components/auth/SchoolVectorBackground';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Prefetch dashboard route in background for instant transition
  React.useEffect(() => {
    router.prefetch('/');
  }, [router]);

  // Quick fill helper for testing
  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await eduveraApi.login({ email, password });
      if (res.success) {
        const user = res.data?.user;
        setSuccessMsg(`Welcome back, ${user?.name || 'Administrator'}! Redirecting...`);
        // Fast instant transition
        router.push('/');
      } else {
        if (res.errors && typeof res.errors === 'object') {
          const detail = Object.entries(res.errors)
            .map(([field, msgs]) => Array.isArray(msgs) ? msgs.join('. ') : String(msgs))
            .join(' | ');
          setErrorMsg(detail || res.message || 'Invalid email or password.');
        } else {
          setErrorMsg(res.message || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        const detail = Object.entries(serverErrors)
          .map(([_, msgs]) => Array.isArray(msgs) ? msgs.join('. ') : String(msgs))
          .join(' | ');
        setErrorMsg(detail);
      } else {
        setErrorMsg(
          err.response?.data?.message ||
            'Unable to connect to the authentication server. Please check backend connection.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      {/* 1. Ambient Complementary Looping Background GIF & Cool Gradients */}
      <AuthBackground />

      {/* 2. Centered Minimalist Login Container */}
      <div className="w-full max-w-md relative z-10 my-auto">
        {/* Centered Brand & Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white p-2.5 shadow-lg shadow-sky-500/10 border border-slate-200/90 mb-3 flex items-center justify-center transition-transform hover:scale-105 duration-200">
            <Image
              src="/images/eduvera-icon-square.png"
              alt="Eduvera"
              width={52}
              height={52}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Eduvera</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/70">
              Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            School Management &amp; Institutional System
          </p>
        </div>

        {/* Clean, Minimalist High-Performance Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-7 sm:p-9 space-y-5">
          {/* Form Header */}
          <div className="text-center pb-1">
            <h2 className="text-base font-semibold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your institutional credentials below
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eduvera.school"
                  className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please reach out to your school super administrator to reset your password.');
                  }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500 transition"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-600">Remember this device</span>
              </label>
            </div>

            {/* Cooler Gradient Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Pills (Clean & Minimal) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
              <span className="flex items-center gap-1 font-medium text-slate-500">
                <Sparkles className="w-3 h-3 text-sky-500" />
                Quick demo fill:
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@eduvera.school')}
                className="py-1 px-1.5 text-center rounded-lg bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200/60 transition cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('academic@eduvera.school')}
                className="py-1 px-1.5 text-center rounded-lg bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200/60 transition cursor-pointer"
              >
                Academic
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('finance@eduvera.school')}
                className="py-1 px-1.5 text-center rounded-lg bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200/60 transition cursor-pointer"
              >
                Finance
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hr@eduvera.school')}
                className="py-1 px-1.5 text-center rounded-lg bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-medium text-slate-600 border border-slate-200/60 transition cursor-pointer"
              >
                HR
              </button>
            </div>
          </div>

          {/* Link to Signup */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-500">
              New school institution?{' '}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition underline underline-offset-2"
              >
                Register institution
              </Link>
            </p>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Eduvera Institutional Secure Authentication</span>
        </div>
      </div>
    </div>
  );
}
