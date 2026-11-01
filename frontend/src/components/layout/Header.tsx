'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Bell, Calendar, ShieldCheck, Palette } from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';

export const Header: React.FC = () => {
  const { schoolLogo, schoolProfile, currentTheme } = useTheme();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('eduvera_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const role = user?.role || 'Admin';

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/70 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Search Bar & Mobile Brand */}
      <div className="flex items-center gap-3 w-72 sm:w-96">
        <div className="flex lg:hidden items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-2xs overflow-hidden">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt="School Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <Image
                src="/images/eduvera-icon-square.png"
                alt="Eduvera Logo"
                width={26}
                height={26}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, staff, classes, fees..."
            className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200/80 rounded-xl pl-9 pr-12 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 focus:outline-hidden transition-all"
          />
          <span className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-medium font-mono text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
            ⌘K
          </span>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Workspace Mode Badge */}
        {user?.is_demo ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Demo Showcase Mode
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Live School Workspace
          </div>
        )}

        {/* Academic Session */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 text-xs font-medium text-slate-600 border border-slate-200/50">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>2026–2027 Academic Year</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
        </button>

        <div className="h-5 w-px bg-slate-200"></div>

        {/* User Profile Info */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs shadow-2xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-semibold text-slate-800">
              {user?.name || 'Administrator'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {role}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
