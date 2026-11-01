'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import { FeeManagementHub } from '../components/fees/FeeManagementHub';
import { AttendanceManagementHub } from '../components/attendance/AttendanceManagementHub';
import { StudentsModule } from '../components/students/StudentsModule';
import { AcademicsModule } from '../components/academics/AcademicsModule';
import { StaffModule } from '../components/staff/StaffModule';
import { ExaminationsModule } from '../components/examinations/ExaminationsModule';
import { NoticeboardModule } from '../components/notices/NoticeboardModule';
import { eduveraApi } from '../lib/services/api';
import { useTheme } from '../lib/context/ThemeContext';
import {
  DashboardOverview,
  Student,
  Staff,
  SchoolClass,
  Subject,
  AttendanceSummary,
  FeeInvoice,
  Notice,
  Exam,
  Marksheet,
} from '../types';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  BookOpen,
  Award,
  AlertTriangle,
  FileText,
  ChevronRight,
  TrendingUp,
  Search,
  Bell,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { schoolLogo, schoolProfile } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedMarksheet, setSelectedMarksheet] = useState<Marksheet | null>(null);
  const [isMarksheetModalOpen, setIsMarksheetModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const loadData = async () => {
    try {
      // 1. Fetch overview immediately for instant screen render
      const overviewData = await eduveraApi.getDashboardOverview();
      setOverview(overviewData);
      setLoading(false);

      // 2. Fetch module datasets concurrently in the background without blocking the UI
      Promise.allSettled([
        eduveraApi.getStudents(),
        eduveraApi.getStaff(),
        eduveraApi.getClasses(),
        eduveraApi.getSubjects(),
        eduveraApi.getAttendance(),
        eduveraApi.getFeeInvoices(),
        eduveraApi.getNotices(),
        eduveraApi.getExams(),
      ]).then(([studentsRes, staffRes, classesRes, subjectsRes, attendanceRes, invoiceRes, noticeRes, examRes]) => {
        if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value);
        if (staffRes.status === 'fulfilled') setStaff(staffRes.value);
        if (classesRes.status === 'fulfilled') setClasses(classesRes.value);
        if (subjectsRes.status === 'fulfilled') setSubjects(subjectsRes.value);
        if (attendanceRes.status === 'fulfilled') setAttendance(attendanceRes.value);
        if (invoiceRes.status === 'fulfilled') setInvoices(invoiceRes.value);
        if (noticeRes.status === 'fulfilled') setNotices(noticeRes.value);
        if (examRes.status === 'fulfilled') setExams(examRes.value);
      });
    } catch (error) {
      console.error('Error fetching Eduvera API data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('eduvera_token');
      const stored = localStorage.getItem('eduvera_user');

      if (!token || !stored) {
        setIsAuthenticated(false);
        router.replace('/login');
        return;
      }

      try {
        const user = JSON.parse(stored);
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadData();
      } catch {
        localStorage.removeItem('eduvera_token');
        localStorage.removeItem('eduvera_user');
        setIsAuthenticated(false);
        router.replace('/login');
      }
    }
  }, [router]);

  const openMarksheetModal = async (studentId: number) => {
    const data = await eduveraApi.getMarksheet(studentId);
    setSelectedMarksheet(data);
    setIsMarksheetModalOpen(true);
  };

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center gap-3 text-slate-400 text-xs select-none">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/60 p-2 flex items-center justify-center shadow-xl">
          <Image
            src="/images/eduvera-icon-square.png"
            alt="Eduvera"
            width={36}
            height={36}
            className="w-full h-full object-contain"
            priority
          />
        </div>
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-slate-400 font-medium">Redirecting to Eduvera Login...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden font-sans">
      {/* Sleek Minimalist Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Loading workspace...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* TAB 1: EXECUTIVE OVERVIEW (MINIMALIST & CLEAN) */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Clean Page Title Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Operational summary, daily metrics, and academic health
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl transition cursor-pointer shadow-2xs"
                      >
                        Daily Roll Call
                      </button>
                      <button
                        onClick={() => setActiveTab('fees')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-2xs"
                      >
                        Fee Ledger
                      </button>
                    </div>
                  </div>

                  {/* 4 Minimalist KPI Cards with Modern Hover Lift */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Students */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Total Students</span>
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">
                          {currentUser?.is_demo ? (overview?.metrics.total_students ?? 1248) : (overview?.metrics.total_students ?? 0)}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                          {currentUser?.is_demo ? <><TrendingUp className="w-3 h-3" /> +12%</> : <span className="text-slate-400">Enrolled</span>}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {currentUser?.is_demo ? 'Active across 32 class sections' : (overview?.metrics.total_students ? `${overview.metrics.total_students} students registered` : 'No students enrolled yet')}
                      </span>
                    </div>

                    {/* Attendance */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Attendance Rate</span>
                        <CalendarCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">
                          {currentUser?.is_demo ? (overview?.metrics.attendance_today_rate ?? '94.8%') : (overview?.metrics.attendance_today_rate ?? '0%')}
                        </span>
                        <span className="text-[11px] font-semibold text-blue-600">Today</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {currentUser?.is_demo ? '1,183 students checked in' : 'Daily attendance not recorded'}
                      </span>
                    </div>

                    {/* Faculty */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Faculty & Staff</span>
                        <GraduationCap className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">
                          {currentUser?.is_demo ? (overview?.metrics.total_teachers ?? 84) : (overview?.metrics.total_teachers ?? 0)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {currentUser?.is_demo ? '8 Depts' : 'Faculty'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {currentUser?.is_demo ? '98% on-duty compliance' : 'No staff members added'}
                      </span>
                    </div>

                    {/* Fee Collection */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">Term Collections</span>
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold text-slate-900 tracking-tight">
                          {currentUser?.is_demo ? (overview?.metrics.monthly_fee_collected ?? '$124,300') : (overview?.metrics.monthly_fee_collected ?? '$0')}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {currentUser?.is_demo ? '82%' : '0%'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {currentUser?.is_demo ? '38 invoices awaiting payment' : 'No pending invoices'}
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Balanced Workspace Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 7 Columns: Weekly Attendance & Class Pulse */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Weekly Attendance Rhythm */}
                      <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Weekly Attendance Trend</h3>
                            <p className="text-xs text-slate-500">Daily student present rate for active school week</p>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                            Current Week
                          </span>
                        </div>

                        {/* Bar visualizer with clean subtle styling */}
                        <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
                          {overview?.attendance_chart.labels.map((day, idx) => {
                            const presentVal = overview.attendance_chart.present[idx];
                            return (
                              <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                                <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition">
                                  {presentVal}%
                                </span>
                                <div className="w-full bg-slate-100 rounded-lg h-28 relative flex items-end overflow-hidden">
                                  <div
                                    className="w-full bg-blue-600 rounded-lg transition-all duration-300 group-hover:bg-blue-700"
                                    style={{ height: `${presentVal}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-semibold text-slate-600">{day}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>Weekly Average: <strong className="text-slate-800">94.2%</strong></span>
                          <span>Highest Day: <strong className="text-emerald-700">Wednesday (96.8%)</strong></span>
                        </div>
                      </div>

                      {/* Grade Classes Roster Overview */}
                      <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">Academic Cohorts & Class Load</h3>
                            <p className="text-xs text-slate-500">Enrolled count and class teacher assignments</p>
                          </div>
                          <button
                            onClick={() => setActiveTab('academics')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                          >
                            View All Classes &rarr;
                          </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {classes.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              <p className="font-semibold text-slate-600">No classes configured yet</p>
                              <p className="text-[11px] text-slate-400 mt-1">Set up your school grades and sections under Academics.</p>
                            </div>
                          ) : (
                            classes.slice(0, 4).map((cls) => (
                              <div key={cls.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 font-bold text-slate-700 text-xs flex items-center justify-center">
                                    {cls.name.replace('Grade ', 'G')}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">{cls.name}</h4>
                                    <p className="text-[11px] text-slate-500">Mentor: {cls.class_teacher}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div className="hidden sm:flex items-center gap-1.5">
                                    {cls.sections.map(sec => (
                                      <span key={sec} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/50">
                                        {sec}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                    {cls.student_count} Enrolled
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right 5 Columns: Financial Health, Activity & Shortcuts */}
                    <div className="lg:col-span-5 space-y-6">
                      {/* Financial Collection Efficiency Card */}
                      <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">Term Revenue Snapshot</h3>
                          <button
                            onClick={() => setActiveTab('fees')}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                          >
                            Open Ledger &rarr;
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs mb-1.5 font-medium">
                              <span className="text-slate-500">Collection Target Progress</span>
                              <span className="text-slate-900 font-bold">
                                {currentUser?.is_demo ? '82.4%' : '0%'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: currentUser?.is_demo ? '82.4%' : '0%' }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-semibold uppercase text-slate-600 block">Total Invoiced</span>
                              <span className="text-base font-bold text-slate-900 mt-0.5 block">
                                {currentUser?.is_demo ? '$345,000' : '$0'}
                              </span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-semibold uppercase text-slate-600 block">Outstanding Dues</span>
                              <span className="text-base font-bold text-slate-700 mt-0.5 block">
                                {currentUser?.is_demo ? '$60,500' : '$0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Real-time Institutional Activity Stream */}
                      <div className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">Activity Stream</h3>
                          <span className="text-[11px] font-medium text-slate-400">Live feed</span>
                        </div>

                        <div className="space-y-3">
                          {overview?.recent_activities.slice(0, 4).map((act) => (
                            <div key={act.id} className="flex items-start gap-3 text-xs">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 leading-snug font-medium truncate">{act.text}</p>
                                <span className="text-[10px] text-slate-400 mt-0.5 block">{act.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Institutional Quick Shortcuts */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setActiveTab('students')}
                          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-left transition shadow-2xs cursor-pointer group"
                        >
                          <Users className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition" />
                          <span className="text-xs font-bold text-slate-900 mt-2 block">Student Directory</span>
                          <span className="text-[10px] text-slate-400">Admissions & Profiles</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('attendance')}
                          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-left transition shadow-2xs cursor-pointer group"
                        >
                          <CalendarCheck className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition" />
                          <span className="text-xs font-bold text-slate-900 mt-2 block">Monthly Register</span>
                          <span className="text-[10px] text-slate-400">1–31 Grid Matrix</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('fees')}
                          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-left transition shadow-2xs cursor-pointer group"
                        >
                          <CreditCard className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition" />
                          <span className="text-xs font-bold text-slate-900 mt-2 block">Fee Vouchers</span>
                          <span className="text-[10px] text-slate-400">Invoices & Receipts</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('notices')}
                          className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/70 text-left transition shadow-2xs cursor-pointer group"
                        >
                          <Bell className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition" />
                          <span className="text-xs font-bold text-slate-900 mt-2 block">Announcements</span>
                          <span className="text-[10px] text-slate-400">Campus Circulars</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACADEMICS & ROUTINE */}
              {activeTab === 'academics' && (
                <AcademicsModule
                  classes={classes}
                  subjects={subjects}
                  onDataUpdated={loadData}
                />
              )}

              {/* TAB 3: STUDENT DIRECTORY (CLEAN MINIMAL TABLE & ADMISSION SUITE) */}
              {activeTab === 'students' && (
                <StudentsModule
                  students={students}
                  classes={classes}
                  onOpenMarksheet={openMarksheetModal}
                  onRefresh={loadData}
                />
              )}

              {/* TAB 4: FACULTY & STAFF */}
              {activeTab === 'staff' && (
                <StaffModule staff={staff} />
              )}

              {/* TAB 5: ATTENDANCE & TIMESHEET MANAGEMENT (ENTERPRISE SUITE) */}
              {activeTab === 'attendance' && (
                <AttendanceManagementHub currentUser={currentUser} />
              )}

              {/* TAB 6: EXAMINATIONS & MARKSHEETS */}
              {activeTab === 'examinations' && (
                <ExaminationsModule exams={exams} onOpenMarksheet={openMarksheetModal} />
              )}

              {/* TAB 7: COMPLETE FEE MANAGEMENT SYSTEM */}
              {activeTab === 'fees' && (
                <FeeManagementHub currentUser={currentUser} />
              )}

              {/* TAB 8: NOTICEBOARD */}
              {activeTab === 'notices' && (
                <NoticeboardModule
                  notices={notices}
                  currentUser={currentUser}
                  onNoticeUpdated={loadData}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* MARKSHEET MODAL DIALOG */}
      {isMarksheetModalOpen && selectedMarksheet && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  {(selectedMarksheet as any).institution?.logo || schoolLogo ? (
                    <img
                      src={(selectedMarksheet as any).institution?.logo || schoolLogo!}
                      alt={(selectedMarksheet as any).institution?.name || schoolProfile?.name || 'School Logo'}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src="/images/eduvera-icon-square.png"
                      alt="Eduvera"
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                    {(selectedMarksheet as any).institution?.name || schoolProfile?.name || 'Official Academic Record'}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedMarksheet.exam_name}</h3>
                </div>
              </div>
              <button
                onClick={() => setIsMarksheetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Dynamic System Type Awareness: Percentage vs GPA */}
            {(() => {
              const activeSystem = (typeof window !== 'undefined'
                ? (localStorage.getItem('eduvera_grading_system') || selectedMarksheet.system_type || 'percentage')
                : (selectedMarksheet.system_type || 'percentage')) as 'percentage' | 'gpa';
              const isPercentage = activeSystem === 'percentage';
              const percentage = selectedMarksheet.percentage ?? 
                Number(((selectedMarksheet.total_marks / (selectedMarksheet.max_marks || 1)) * 100).toFixed(1));
              const isPass = selectedMarksheet.is_pass ?? (percentage >= 50);

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Student Name</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedMarksheet.student_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Class & Roll</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedMarksheet.class} ({selectedMarksheet.roll_no})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        {isPercentage ? 'Aggregate Percentage' : 'Cumulative GPA'}
                      </span>
                      <span className={`font-bold text-base ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPercentage ? `${percentage}%` : `${selectedMarksheet.gpa} / 4.00`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        {isPercentage ? 'Grade & Result' : 'Grade Score'}
                      </span>
                      <span className="font-bold text-blue-600 text-base">
                        Grade {selectedMarksheet.overall_grade}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium">
                        {selectedMarksheet.total_marks} / {selectedMarksheet.max_marks} marks
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                        Subject Performance Breakdown
                      </h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                        {isPercentage ? 'Percentage Scheme (Pakistani BISE/FBISE)' : 'GPA 4.00 Scheme'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <tr>
                            <th className="p-3">Subject</th>
                            <th className="p-3">Marks Obtained</th>
                            <th className="p-3 text-center">{isPercentage ? 'Percentage' : 'Max Marks'}</th>
                            <th className="p-3 text-center">Grade</th>
                            <th className="p-3 text-right">{isPercentage ? 'Status' : 'GPA'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedMarksheet.subjects.map((sub) => {
                            const subPct = sub.percentage ?? Number(((sub.marks_obtained / (sub.max_marks || 1)) * 100).toFixed(1));
                            const subPass = isPercentage ? (subPct >= 50) : (sub.grade !== 'F' && sub.grade !== 'Fail');

                            return (
                              <tr key={sub.subject_code}>
                                <td className="p-3 font-semibold text-slate-900">{sub.subject}</td>
                                <td className="p-3 text-slate-600">{sub.marks_obtained} / {sub.max_marks}</td>
                                <td className="p-3 text-center font-mono font-semibold text-slate-700">
                                  {isPercentage ? `${subPct}%` : sub.max_marks}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    sub.grade === 'A+' || sub.grade === 'A'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : sub.grade === 'B'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : sub.grade === 'C'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {sub.grade}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  {isPercentage ? (
                                    <span className={`text-[11px] font-bold ${subPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {subPass ? 'PASS' : 'FAIL'}
                                    </span>
                                  ) : (
                                    <span className="font-mono font-bold text-emerald-600">
                                      {sub.gpa_point.toFixed(1)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsMarksheetModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
