'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  CalendarCheck,
  Award,
  CreditCard,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Palette,
} from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();
  const { schoolLogo, schoolProfile, currentTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('eduvera_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eduvera_token');
      localStorage.removeItem('eduvera_user');
    }
    router.push('/login');
  };

  const allMenuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['Admin', 'Super Admin', 'Finance', 'HR', 'Academic'] },
    { id: 'academics', label: 'Academics & Classes', icon: BookOpen, roles: ['Admin', 'Super Admin', 'Academic'] },
    { id: 'students', label: 'Students Directory', icon: Users, roles: ['Admin', 'Super Admin', 'Academic'] },
    { id: 'staff', label: 'Faculty & Staff', icon: UserCheck, roles: ['Admin', 'Super Admin', 'HR'] },
    { id: 'attendance', label: 'Attendance Hub', icon: CalendarCheck, roles: ['Admin', 'Super Admin', 'HR', 'Academic'] },
    { id: 'examinations', label: 'Exams & Grading', icon: Award, roles: ['Admin', 'Super Admin', 'Academic'] },
    { id: 'fees', label: 'Fee Management', icon: CreditCard, roles: ['Admin', 'Super Admin', 'Finance'] },
    { id: 'notices', label: 'Announcements', icon: Bell, badge: '2', roles: ['Admin', 'Super Admin', 'Finance', 'HR', 'Academic'] },
  ];

  const userRole = currentUser?.role || 'Admin';
  const menuItems = allMenuItems.filter((item) => item.roles.includes(userRole));
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  return (
    <aside className="w-64 bg-[#0B0F19] text-slate-300 flex flex-col border-r border-slate-800/60 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800/60">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt={schoolProfile?.name || 'School Logo'}
              className="w-full h-full object-contain"
            />
          ) : (
            <Image
              src="/images/eduvera-icon-square.png"
              alt="Eduvera"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-sm text-white tracking-tight truncate">
              {schoolProfile?.name ? schoolProfile.name.split(' ')[0] : 'Eduvera'}
            </h1>
            <span
              className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-sm border shrink-0"
              style={{
                backgroundColor: 'var(--theme-primary-light, rgba(37,99,235,0.15))',
                color: 'var(--theme-primary, #3b82f6)',
                borderColor: 'var(--theme-primary-border, rgba(59,130,246,0.3))',
              }}
            >
              {currentTheme?.officeApp || 'Pro'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-normal truncate">
            {schoolProfile?.name || 'School ERP Portal'}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition cursor-pointer ${
                isActive
                  ? 'bg-theme-primary text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={isActive ? { backgroundColor: 'var(--theme-primary)' } : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Admin Console Shortcut */}
        {isAdmin && (
          <div className="pt-3 mt-3 border-t border-slate-800/60 px-1 space-y-1">
            <button
              onClick={() => router.push('/onboarding')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                <span>Themes & Identity</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                <span>Security & Roles</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-semibold text-slate-200 text-xs shrink-0">
              {currentUser?.name
                ? currentUser.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                : 'AD'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-200 truncate">{currentUser?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate leading-tight">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-md transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
