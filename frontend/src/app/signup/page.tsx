'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { eduveraApi, defaultPakistaniGradingScale, defaultGpaGradingScale } from '../../lib/services/api';
import { GradingScaleRule } from '../../types';
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Percent,
  Award,
} from 'lucide-react';
import { AuthBackground } from '../../components/auth/SchoolVectorBackground';

export default function SignupPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Configurable Grading System Setup
  const [gradingSystem, setGradingSystem] = useState<'percentage' | 'gpa'>('percentage');
  const [showCustomizeGrading, setShowCustomizeGrading] = useState(false);
  const [customScales, setCustomScales] = useState<GradingScaleRule[]>([
    { grade: 'A+', min_percentage: 80, max_percentage: 100, label: 'Outstanding (Over 80%)', is_pass: true },
    { grade: 'A', min_percentage: 70, max_percentage: 79.99, label: 'Excellent (70% - 79%)', is_pass: true },
    { grade: 'B', min_percentage: 60, max_percentage: 69.99, label: 'Very Good (60% - 69%)', is_pass: true },
    { grade: 'C', min_percentage: 50, max_percentage: 59.99, label: 'Good (50% - 59%)', is_pass: true },
    { grade: 'Fail', min_percentage: 0, max_percentage: 49.99, label: 'Fail (Below 50%)', is_pass: false },
  ]);

  // Prefetch dashboard route in background for instant transition
  React.useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const handleSystemChange = (sys: 'percentage' | 'gpa') => {
    setGradingSystem(sys);
    if (sys === 'percentage') {
      setCustomScales(defaultPakistaniGradingScale);
    } else {
      setCustomScales(defaultGpaGradingScale);
    }
  };

  const handleThresholdChange = (index: number, newMin: number) => {
    setCustomScales((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], min_percentage: newMin };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== passwordConfirmation) {
      setErrorMsg('Passwords do not match. Please verify confirmation password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the institutional terms of service.');
      return;
    }

    setLoading(true);

    try {
      const res = await eduveraApi.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        school_name: schoolName,
        phone: phone || undefined,
        grading_system: gradingSystem,
        grading_scales: customScales,
      });

      if (res.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('eduvera_grading_system', gradingSystem);
          localStorage.setItem('eduvera_school_name', schoolName);
        }
        setSuccessMsg('Institution and Super Admin created! Starting workspace personalization...');
        // Smooth transition to interactive onboarding wizard
        router.push('/onboarding');
      } else {
        if (res.errors && typeof res.errors === 'object') {
          const detail = Object.entries(res.errors)
            .map(([field, msgs]) => Array.isArray(msgs) ? msgs.join('. ') : String(msgs))
            .join(' | ');
          setErrorMsg(detail || res.message || 'Validation failed. Please verify your details.');
        } else {
          setErrorMsg(res.message || 'Failed to register institution. Please check your inputs.');
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
            'Server connection issue. Please ensure the backend database is reachable.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 font-sans antialiased text-slate-800">
      {/* 1. Ambient Looping Background GIF & Cool Gradients */}
      <AuthBackground />

      {/* 2. Centered Minimalist Registration Container */}
      <div className="w-full max-w-xl relative z-10 my-auto">
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
              Registration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Institutional Setup &amp; Super Administrator Account
          </p>
        </div>

        {/* Clean, Minimalist High-Performance Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-9 space-y-5">
          {/* Form Header */}
          <div className="text-center pb-1">
            <h2 className="text-base font-semibold text-slate-900">Register your institution</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set up your school profile and customize your academic grading scheme
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                School / Institution Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. St. Jude International Academy"
                  className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>

            {/* Admin Name & Work Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Super Admin Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Arthur Pendelton"
                    className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.edu"
                    className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Phone (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567 or +1 (555) 234-5678"
                  className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Configurable Academic Grading Scheme Card */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Academic Grading System</span>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60">
                  Configurable
                </span>
              </div>

              {/* Scheme Switcher Pills */}
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                <button
                  type="button"
                  onClick={() => handleSystemChange('percentage')}
                  className={`p-2.5 text-left rounded-xl border transition cursor-pointer ${
                    gradingSystem === 'percentage'
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 text-blue-900'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-blue-600" />
                      Percentage Scale
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                      Pakistani Standard
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    &ge;80% (A+), 70-79% (A), 60-69% (B), 50-59% (C), &lt;50% (Fail)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSystemChange('gpa')}
                  className={`p-2.5 text-left rounded-xl border transition cursor-pointer ${
                    gradingSystem === 'gpa'
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 text-blue-900'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      GPA 4.00 Scale
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700">
                      Collegiate / US
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Calculates Cumulative GPA points (4.00 max scale)
                  </p>
                </button>
              </div>

              {/* Thresholds Quick Customizer Accordion */}
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowCustomizeGrading(!showCustomizeGrading)}
                  className="w-full flex items-center justify-between font-semibold text-slate-700 hover:text-blue-600 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span>{showCustomizeGrading ? 'Hide Grade Thresholds' : 'Customize Grade Cutoffs & Thresholds'}</span>
                  </span>
                  {showCustomizeGrading ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showCustomizeGrading && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-2">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Fine-tune minimum passing percentages and grade cutoffs for your school board:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {customScales.map((rule, idx) => (
                        <div key={rule.grade} className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-blue-700">{rule.grade}</span>
                            <span className="text-[9px] text-slate-400">{rule.label}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Min %:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.min_percentage}
                              onChange={(e) => handleThresholdChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 rounded border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-slate-500">%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="pt-0.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I agree to Eduvera&apos;s Terms of Service and certify that I am authorized to register this educational institution.
                </span>
              </label>
            </div>

            {/* Submit Button with Cooler Gradient */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 active:scale-[0.99] text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition duration-150 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating institutional workspace...</span>
                </>
              ) : (
                <>
                  <span>Create School &amp; Super Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center pt-1 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an institutional account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-500 transition underline underline-offset-2"
              >
                Sign in to your portal
              </Link>
            </p>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Role-Based Access Control • Data Protection Guaranteed</span>
        </div>
      </div>
    </div>
  );
}
