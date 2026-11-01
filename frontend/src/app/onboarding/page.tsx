'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Palette,
  Upload,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  School,
  Phone,
  Mail,
  MapPin,
  Globe,
  Award,
  Eye,
  Check,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { OFFICE_365_THEMES, ColorTheme, applyThemeToDocument } from '@/lib/theme';
import { useTheme } from '@/lib/context/ThemeContext';
import { eduveraApi } from '@/lib/services/api';

export default function OnboardingWizardPage() {
  const router = useRouter();
  const {
    currentTheme,
    setTheme,
    schoolLogo,
    setSchoolLogo,
    schoolProfile,
    setSchoolProfile,
  } = useTheme();

  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [selectedThemeId, setSelectedThemeId] = useState<string>(currentTheme.id || 'word-blue');
  const [logoPreview, setLogoPreview] = useState<string | null>(schoolLogo || null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // School profile form
  const [formData, setFormData] = useState({
    name: schoolProfile.name || 'Eduvera International Academy',
    tagline: schoolProfile.tagline || 'Excellence in Academic Governance & Leadership',
    address: schoolProfile.address || '450 University Way, Suite 100, Academic District',
    phone: schoolProfile.phone || '+92 (021) 3582-9011',
    email: schoolProfile.email || 'admissions@eduvera.school',
    website: schoolProfile.website || 'https://eduvera.school',
    affiliation: schoolProfile.affiliation || 'Federal Board of Intermediate and Secondary Education (FBISE)',
  });

  // Sample quick preset logos for instant testing
  const sampleLogos = [
    {
      id: 'crest',
      name: 'Academic Crest',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%232563eb"><path d="M50 5 L85 20 V50 C85 70 50 95 50 95 C50 95 15 70 15 50 V20 Z" fill="%232563eb" opacity="0.9"/><path d="M50 25 L65 35 V55 C65 67 50 78 50 78 C50 78 35 67 35 55 V35 Z" fill="%23ffffff"/><circle cx="50" cy="46" r="6" fill="%232563eb"/></svg>`,
    },
    {
      id: 'beacon',
      name: 'Torch of Wisdom',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23059669"><circle cx="50" cy="50" r="42" fill="%23059669"/><path d="M50 20 L58 42 H42 Z" fill="%23facc15"/><rect x="46" y="44" width="8" height="32" rx="4" fill="%23ffffff"/><circle cx="50" cy="22" r="5" fill="%23ef4444"/></svg>`,
    },
    {
      id: 'tree',
      name: 'Royal Monogram',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%237c3aed"/><circle cx="50" cy="40" r="22" fill="%23ffffff"/><rect x="46" y="45" width="8" height="35" rx="3" fill="%23ede9fe"/><circle cx="42" cy="35" r="7" fill="%23c4b5fd"/><circle cx="58" cy="35" r="7" fill="%23c4b5fd"/></svg>`,
    },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('eduvera_school_name');
      if (storedName) {
        setFormData((prev) => ({ ...prev, name: storedName }));
      }
      const storedLogo = localStorage.getItem('eduvera_school_logo');
      if (storedLogo) {
        setLogoPreview(storedLogo);
      }
      const storedTheme = localStorage.getItem('eduvera_theme');
      if (storedTheme) {
        setSelectedThemeId(storedTheme);
        applyThemeToDocument(storedTheme);
      }
    }
  }, []);

  const handleSelectTheme = (tId: string) => {
    setSelectedThemeId(tId);
    setTheme(tId);
    applyThemeToDocument(tId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size exceeds 3MB limit. Please choose a smaller image.');
        return;
      }
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
        setSchoolLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    setDirection('forward');
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setDirection('backward');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setIsSaving(true);

    // 1. Update Context and LocalStorage
    setTheme(selectedThemeId);
    applyThemeToDocument(selectedThemeId);
    if (logoPreview) {
      setSchoolLogo(logoPreview);
    }
    setSchoolProfile(formData);

    // 2. Persist to Laravel backend via /settings API
    try {
      await eduveraApi.updateSettings({
        theme_id: selectedThemeId,
        school_logo: logoPreview,
        school_name: formData.name,
        school_tagline: formData.tagline,
        school_address: formData.address,
        school_phone: formData.phone,
        school_email: formData.email,
        school_website: formData.website,
        school_affiliation: formData.affiliation,
      });
    } catch (err) {
      console.warn('Backend sync fallback to localStorage:', err);
    }

    setIsSaving(false);
    setSaveSuccess(true);

    setTimeout(() => {
      router.push('/');
    }, 700);
  };

  const currentThemeObj =
    OFFICE_365_THEMES.find((t) => t.id === selectedThemeId) || OFFICE_365_THEMES[0];

  const stepsConfig = [
    { num: 1, title: 'Color Themes', desc: 'Office 365 Palette', icon: Palette },
    { num: 2, title: 'School Logo', desc: 'Official Emblem', icon: Upload },
    { num: 3, title: 'Campus Profile', desc: 'Contact & Details', icon: Building2 },
    { num: 4, title: 'Launch', desc: 'Ready for Workspace', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between font-sans">
      {/* Top Header - Matching Eduvera Dashboard Header Style */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src="/images/eduvera-icon-square.png"
                alt="Eduvera"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-900 tracking-tight">
                {formData.name.split(' ')[0] || 'Eduvera'}
              </h1>
              <span
                className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border transition-colors"
                style={{
                  backgroundColor: currentThemeObj.badgeBg,
                  color: currentThemeObj.badgeText,
                  borderColor: currentThemeObj.primaryBorder,
                }}
              >
                Onboarding Setup
              </span>
            </div>
            <p className="text-[11px] text-slate-500">School Identity &amp; Workspace Customizer</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition cursor-pointer"
        >
          Skip to Dashboard
        </button>
      </header>

      {/* Multi-Step Horizontal Stepper */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {stepsConfig.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;

            return (
              <div
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2.5 p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-white border-slate-300 shadow-sm ring-2 ring-offset-1'
                    : isCompleted
                    ? 'bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300'
                    : 'bg-white/40 border-slate-200/60 text-slate-400 opacity-60'
                }`}
                style={isCurrent ? { '--tw-ring-color': currentThemeObj.primary } as any : undefined}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    isCurrent
                      ? 'text-white shadow-2xs'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                  style={isCurrent ? { backgroundColor: currentThemeObj.primary } : undefined}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <div
                    className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar line */}
        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${(step / 4) * 100}%`,
              backgroundColor: currentThemeObj.primary,
            }}
          ></div>
        </div>
      </div>

      {/* Main Interactive Step Container */}
      <main className="max-w-4xl mx-auto w-full px-6 py-6 flex-1 flex flex-col justify-center">
        <div
          key={step}
          className={`bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${
            direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'
          }`}
        >
          {/* STEP 1: OFFICE 365 COLOR THEMES */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <Palette className="w-3.5 h-3.5" style={{ color: currentThemeObj.primary }} />
                  <span>Step 1 of 4 • Visual Branding</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Select Your Office 365 Inspired Theme
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Choose a signature color scheme inspired by Microsoft 365 applications (Word, Excel,
                  PowerPoint, OneNote, Outlook, Teams). Selecting any theme instantly replaces all website
                  buttons, badges, active tabs, and accents across every page in real time.
                </p>
              </div>

              {/* Grid of 6 Office 365 Themes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {OFFICE_365_THEMES.map((t) => {
                  const isSelected = selectedThemeId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTheme(t.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative group text-left ${
                        isSelected
                          ? 'bg-white shadow-md ring-2 ring-offset-1'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                      style={{
                        borderColor: isSelected ? t.primary : undefined,
                        '--tw-ring-color': isSelected ? t.primary : undefined,
                      } as any}
                    >
                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div
                          className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: t.primary }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Header with App Chip & Name */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-2xs shrink-0"
                          style={{ backgroundColor: t.primary }}
                        >
                          {t.officeApp.charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {t.name}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            MS {t.officeApp} Inspired
                          </span>
                        </div>
                      </div>

                      {/* Color Palette Preview Swatches */}
                      <div className="flex items-center gap-1.5 my-3">
                        <div
                          className="h-4 flex-1 rounded-sm shadow-2xs"
                          style={{ backgroundColor: t.primary }}
                          title="Primary Brand Accent"
                        ></div>
                        <div
                          className="h-4 w-7 rounded-sm shadow-2xs"
                          style={{ backgroundColor: t.primaryHover }}
                          title="Hover State"
                        ></div>
                        <div
                          className="h-4 w-7 rounded-sm shadow-2xs"
                          style={{ backgroundColor: t.accent }}
                          title="Secondary Accent"
                        ></div>
                        <div
                          className="h-4 w-7 rounded-sm border border-slate-200"
                          style={{ backgroundColor: t.badgeBg }}
                          title="Soft Surface / Badge"
                        ></div>
                      </div>

                      {/* Micro Component Simulation */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: t.badgeBg,
                            color: t.badgeText,
                            borderColor: t.primaryBorder,
                          }}
                        >
                          Active Badge
                        </span>
                        <button
                          type="button"
                          className="text-[9px] font-bold px-2 py-0.5 rounded-md text-white shadow-2xs"
                          style={{ backgroundColor: t.primary }}
                        >
                          Button
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {t.tagline}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Live Feedback Banner */}
              <div
                className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                style={{
                  backgroundColor: currentThemeObj.primaryLight,
                  borderColor: currentThemeObj.primaryBorder,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-2xs"
                    style={{ backgroundColor: currentThemeObj.primary }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Live Color Active: {currentThemeObj.name}
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      All portal buttons, icons, and badges are dynamically updating right now.
                    </p>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-lg text-xs font-bold border shadow-2xs"
                  style={{
                    backgroundColor: currentThemeObj.badgeBg,
                    color: currentThemeObj.badgeText,
                    borderColor: currentThemeObj.primaryBorder,
                  }}
                >
                  Theme Applied
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: SCHOOL LOGO UPLOADER */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <Upload className="w-3.5 h-3.5" style={{ color: currentThemeObj.primary }} />
                  <span>Step 2 of 4 • Official Emblem</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Upload Your Official School Logo
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Upload your school's official crest or emblem. This logo will automatically replace
                  the default logo across all printable Fee Challans &amp; Vouchers, Student Marksheets,
                  navigation headers, and the sidebar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Upload Area */}
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-50 flex flex-col items-center justify-center min-h-[200px]"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 shadow-sm transition-transform hover:scale-105"
                      style={{ backgroundColor: currentThemeObj.primary }}
                    >
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Click or drag &amp; drop school logo here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      PNG, JPG, SVG, or WEBP (up to 3MB)
                    </p>
                    {logoFileName && (
                      <span className="mt-3 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        Selected: {logoFileName}
                      </span>
                    )}
                  </div>

                  {/* Or select a preset */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Or Choose a Quick Preset Crest:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {sampleLogos.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setLogoPreview(s.svg);
                            setSchoolLogo(s.svg);
                            setLogoFileName(`${s.name} (Preset)`);
                          }}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer ${
                            logoPreview === s.svg
                              ? 'bg-white border-slate-900 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 p-1 flex items-center justify-center overflow-hidden">
                            <img src={s.svg} alt={s.name} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-[10px] font-semibold truncate w-full text-center">
                            {s.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Split-Screen Preview on Fee Voucher & Marksheet */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" style={{ color: currentThemeObj.primary }} />
                      <span>Live Logo Propagation Preview</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Dynamic Rendering</span>
                  </div>

                  {/* Fee Voucher Mock Card */}
                  <div className="bg-white rounded-xl p-3.5 shadow-2xs space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Image
                              src="/images/eduvera-icon-square.png"
                              alt="Eduvera"
                              width={28}
                              height={28}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black leading-tight text-slate-900 truncate max-w-[160px]">
                            {formData.name}
                          </div>
                          <div className="text-[9px] text-slate-500">Official Fee Challan</div>
                        </div>
                      </div>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded text-white shadow-2xs"
                        style={{ backgroundColor: currentThemeObj.primary }}
                      >
                        VOUCHER #2026-09
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 pt-0.5 font-mono">
                      <span>Tuition Fee • Term 1</span>
                      <span className="font-bold text-slate-900">PKR 45,000</span>
                    </div>
                  </div>

                  {/* Marksheet Mock Card */}
                  <div className="bg-white rounded-xl p-3.5 shadow-2xs space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Image
                              src="/images/eduvera-icon-square.png"
                              alt="Eduvera"
                              width={28}
                              height={28}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            Student Marksheet Report
                          </div>
                          <div className="text-[9px] text-slate-500">Certified Academic Record</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Grade A+ (94%)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
                      <span>Student: Ayan Zahid (Roll #102)</span>
                      <span className="font-bold" style={{ color: currentThemeObj.primary }}>
                        Passed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SCHOOL INFORMATION & CONTACT DETAILS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <Building2 className="w-3.5 h-3.5" style={{ color: currentThemeObj.primary }} />
                  <span>Step 3 of 4 • Institutional Identity</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Campus Information &amp; Official Contact
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your school's physical address, institutional phone, and affiliation board.
                  These details will be printed on all vouchers, marksheets, receipts, and parent notices.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* School Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    School / Institution Full Name *
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Eduvera Model School & College"
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Campus Tagline */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motto / Institutional Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Inspiring Minds, Building Leaders"
                    className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Campus Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus Address *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Plot 42-B, Sector 5, Clifton, Karachi, Pakistan"
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Official Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+92 (021) 3582-9011"
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Official Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bursar / Admissions Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="admissions@school.edu.pk"
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Official Website */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Institutional Website
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://myschool.edu.pk"
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Affiliation Board */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Board / Affiliation
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.affiliation}
                      onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                      placeholder="Federal Board (FBISE) / CAIE / Aga Khan Board"
                      className="w-full bg-slate-50/80 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: EXECUTIVE REVIEW & LAUNCH */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: currentThemeObj.primary }} />
                  <span>Step 4 of 4 • Ready for Deployment</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Review &amp; Launch Eduvera Workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Everything is configured! Your institution's branding, color palette, and campus
                  details will now be saved and activated across the management system.
                </p>
              </div>

              {/* Summary Dashboard Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image
                          src="/images/eduvera-icon-square.png"
                          alt="Eduvera"
                          width={40}
                          height={40}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{formData.name}</h3>
                      <p className="text-xs text-slate-500">{formData.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold border shadow-2xs"
                      style={{
                        backgroundColor: currentThemeObj.badgeBg,
                        color: currentThemeObj.badgeText,
                        borderColor: currentThemeObj.primaryBorder,
                      }}
                    >
                      {currentThemeObj.name}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Campus Location
                    </span>
                    <span className="text-slate-800 font-medium mt-0.5 block">{formData.address}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Affiliation Board
                    </span>
                    <span className="text-slate-800 font-medium mt-0.5 block">{formData.affiliation}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Official Phone
                    </span>
                    <span className="text-slate-800 font-medium mt-0.5 block font-mono">{formData.phone}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Bursar Email
                    </span>
                    <span className="text-slate-800 font-medium mt-0.5 block font-mono">{formData.email}</span>
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Settings saved successfully! Redirecting you into your customized school
                    workspace...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 cursor-pointer"
                style={{ backgroundColor: currentThemeObj.primary }}
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isSaving || saveSuccess}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                style={{ backgroundColor: currentThemeObj.primary }}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Institutional Profile...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Eduvera Workspace</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-200/80 text-center text-[11px] text-slate-500 bg-white">
        Eduvera School ERP System • Compliant with Federal Board &amp; CAIE Educational Standards
      </footer>
    </div>
  );
}
