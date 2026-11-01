'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { eduveraApi } from '../../lib/services/api';
import {
  AttendanceSummary,
  AttendanceSheetData,
  StudentSheetRecord,
  AttendanceMatrixData,
  ChronicAbsentee,
  StaffAttendanceSheetData,
  StaffAttendanceRecord,
  LeaveRequestItem,
  HolidayItem,
} from '../../types';
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Search,
  Filter,
  Users,
  Briefcase,
  Layers,
  Send,
  Plus,
  RefreshCw,
  Info,
  Lock,
  ChevronRight,
  X,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Award,
} from 'lucide-react';

interface AttendanceManagementHubProps {
  currentUser?: any;
}

export const AttendanceManagementHub: React.FC<AttendanceManagementHubProps> = ({ currentUser }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'daily' | 'matrix' | 'chronic' | 'staff' | 'leaves'>('daily');

  // Today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Global KPI Summary state
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true);

  // 1. Daily Student Sheet state
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('Section A');
  const [sheetData, setSheetData] = useState<AttendanceSheetData | null>(null);
  const [sheetRecords, setSheetRecords] = useState<StudentSheetRecord[]>([]);
  const [isMakeupSession, setIsMakeupSession] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [sheetLoading, setSheetLoading] = useState<boolean>(false);
  const [savingAttendance, setSavingAttendance] = useState<boolean>(false);
  const [sheetSuccessMessage, setSheetSuccessMessage] = useState<string | null>(null);
  const [sheetErrorMessage, setSheetErrorMessage] = useState<string | null>(null);

  // 2. Monthly Matrix state
  const [matrixMonth, setMatrixMonth] = useState<number>(new Date().getMonth() + 1);
  const [matrixYear, setMatrixYear] = useState<number>(new Date().getFullYear());
  const [matrixClass, setMatrixClass] = useState<string>('Grade 10');
  const [matrixSection, setMatrixSection] = useState<string>('Section A');
  const [matrixData, setMatrixData] = useState<AttendanceMatrixData | null>(null);
  const [matrixLoading, setMatrixLoading] = useState<boolean>(false);
  const [showPrintMatrix, setShowPrintMatrix] = useState<boolean>(false);

  // 3. Chronic Absentees state
  const [chronicList, setChronicList] = useState<ChronicAbsentee[]>([]);
  const [chronicLoading, setChronicLoading] = useState<boolean>(false);
  const [alertSentFor, setAlertSentFor] = useState<number | null>(null);

  // 4. Staff Timesheet state
  const [staffDate, setStaffDate] = useState<string>(todayStr);
  const [staffDept, setStaffDept] = useState<string>('All');
  const [staffSheet, setStaffSheet] = useState<StaffAttendanceSheetData | null>(null);
  const [staffRecords, setStaffRecords] = useState<StaffAttendanceRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);
  const [savingStaff, setSavingStaff] = useState<boolean>(false);
  const [staffSuccessMsg, setStaffSuccessMsg] = useState<string | null>(null);

  // 5. Leave Requests state
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [leaveFilterType, setLeaveFilterType] = useState<string>('All');
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<string>('All');
  const [leavesLoading, setLeavesLoading] = useState<boolean>(false);
  const [showNewLeaveModal, setShowNewLeaveModal] = useState<boolean>(false);
  const [newLeaveForm, setNewLeaveForm] = useState({
    applicant_type: 'Student' as 'Student' | 'Staff',
    applicant_id: 1,
    applicant_name: 'Alexander Wright',
    identifier: '1001',
    class_or_department: 'Grade 10 - Section A',
    start_date: todayStr,
    end_date: todayStr,
    leave_type: 'Sick / Medical',
    reason: '',
  });

  // Load KPI Summary
  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await eduveraApi.getAttendance(selectedDate, selectedClass);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load summary', err);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedDate, selectedClass]);

  // Load Daily Student Sheet
  const loadDailySheet = useCallback(async () => {
    try {
      setSheetLoading(true);
      setSheetSuccessMessage(null);
      setSheetErrorMessage(null);
      const data = await eduveraApi.getStudentAttendanceSheet(selectedDate, selectedClass, selectedSection);
      setSheetData(data);
      setSheetRecords(data.roster || []);
      // Reset makeup session toggle unless date is weekend/holiday
      if (!data.is_holiday && !data.is_weekend) {
        setIsMakeupSession(false);
      }
    } catch (err: any) {
      setSheetErrorMessage(err?.response?.data?.message || 'Failed to load attendance sheet');
    } finally {
      setSheetLoading(false);
    }
  }, [selectedDate, selectedClass, selectedSection]);

  // Load Monthly Matrix
  const loadMatrix = useCallback(async () => {
    try {
      setMatrixLoading(true);
      const data = await eduveraApi.getStudentAttendanceMatrix(matrixMonth, matrixYear, matrixClass, matrixSection);
      setMatrixData(data);
    } catch (err) {
      console.error('Failed to load matrix', err);
    } finally {
      setMatrixLoading(false);
    }
  }, [matrixMonth, matrixYear, matrixClass, matrixSection]);

  // Load Chronic Absentees
  const loadChronic = useCallback(async () => {
    try {
      setChronicLoading(true);
      const data = await eduveraApi.getChronicAbsentees(selectedClass);
      setChronicList(data);
    } catch (err) {
      console.error('Failed to load chronic absentees', err);
    } finally {
      setChronicLoading(false);
    }
  }, [selectedClass]);

  // Load Staff Attendance Sheet
  const loadStaffSheet = useCallback(async () => {
    try {
      setStaffLoading(true);
      setStaffSuccessMsg(null);
      const data = await eduveraApi.getStaffAttendanceSheet(staffDate, staffDept);
      setStaffSheet(data);
      setStaffRecords(data.roster || []);
    } catch (err) {
      console.error('Failed to load staff sheet', err);
    } finally {
      setStaffLoading(false);
    }
  }, [staffDate, staffDept]);

  // Load Leave Requests
  const loadLeaves = useCallback(async () => {
    try {
      setLeavesLoading(true);
      const data = await eduveraApi.getLeaveRequests({
        applicant_type: leaveFilterType,
        status: leaveFilterStatus,
      });
      setLeaves(data);
    } catch (err) {
      console.error('Failed to load leaves', err);
    } finally {
      setLeavesLoading(false);
    }
  }, [leaveFilterType, leaveFilterStatus]);

  // Initial and reactive effects
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (activeTab === 'daily') loadDailySheet();
    else if (activeTab === 'matrix') loadMatrix();
    else if (activeTab === 'chronic') loadChronic();
    else if (activeTab === 'staff') loadStaffSheet();
    else if (activeTab === 'leaves') loadLeaves();
  }, [activeTab, loadDailySheet, loadMatrix, loadChronic, loadStaffSheet, loadLeaves]);

  // 1. Bulk action: Mark All Present
  const handleMarkAllPresent = () => {
    setSheetRecords(prev =>
      prev.map(st => {
        if (st.is_leave_locked) return st; // protect approved leaves
        return { ...st, status: 'Present', arrival_time: '07:55 AM', minutes_late: 0 };
      })
    );
  };

  // Bulk action: Mark All Absent
  const handleMarkAllAbsent = () => {
    setSheetRecords(prev =>
      prev.map(st => {
        if (st.is_leave_locked) return st; // protect approved leaves
        return { ...st, status: 'Absent', arrival_time: null, minutes_late: 0 };
      })
    );
  };

  // Change individual student status
  const handleStatusChange = (studentId: number, newStatus: StudentSheetRecord['status']) => {
    setSheetRecords(prev =>
      prev.map(st => {
        if (st.student_id !== studentId) return st;
        if (st.is_leave_locked) return st; // locked due to approved leave

        let arrivalTime = st.arrival_time;
        let minutesLate = st.minutes_late;

        if (newStatus === 'Present') {
          arrivalTime = arrivalTime || '07:55 AM';
          minutesLate = 0;
        } else if (newStatus === 'Late') {
          arrivalTime = arrivalTime || '08:20 AM';
          minutesLate = 20;
        } else if (newStatus === 'Absent') {
          arrivalTime = null;
          minutesLate = 0;
        }

        return {
          ...st,
          status: newStatus,
          arrival_time: arrivalTime,
          minutes_late: minutesLate,
        };
      })
    );
  };

  // Save student attendance to MySQL
  const handleSaveStudentAttendance = async () => {
    setSavingAttendance(true);
    setSheetSuccessMessage(null);
    setSheetErrorMessage(null);

    try {
      const payload = {
        attendance_date: selectedDate,
        class_name: selectedClass,
        section: selectedSection,
        is_makeup_session: isMakeupSession,
        override_reason: overrideReason,
        records: sheetRecords.map(r => ({
          student_id: r.student_id,
          student_name: r.name,
          student_roll: r.roll_no,
          status: r.status,
          arrival_time: r.arrival_time,
          minutes_late: r.minutes_late,
          half_day_session: r.half_day_session,
          remarks: r.remarks,
        })),
      };

      const res = await eduveraApi.markStudentAttendance(payload);
      if (res.success) {
        setSheetSuccessMessage(res.message || 'Attendance records synchronized successfully.');
        loadSummary();
        loadDailySheet();
      } else {
        setSheetErrorMessage(res.message || 'Failed to save attendance.');
      }
    } catch (err: any) {
      setSheetErrorMessage(err?.message || 'Server error while saving attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  // Save staff attendance to MySQL
  const handleSaveStaffAttendance = async () => {
    setSavingStaff(true);
    setStaffSuccessMsg(null);
    try {
      const payload = {
        attendance_date: staffDate,
        records: staffRecords.map(s => ({
          staff_id: s.staff_id,
          staff_name: s.name,
          employee_id: s.employee_id,
          department: s.department,
          status: s.status,
          punch_in: s.punch_in,
          punch_out: s.punch_out,
          work_hours: s.work_hours,
          remarks: s.remarks,
        })),
      };

      const res = await eduveraApi.markStaffAttendance(payload);
      if (res.success) {
        setStaffSuccessMsg('Staff attendance updated and timesheets synced successfully.');
        loadStaffSheet();
        loadSummary();
      }
    } catch (err: any) {
      console.error('Failed to save staff attendance', err);
    } finally {
      setSavingStaff(false);
    }
  };

  // Handle Leave Status Update (Approve / Reject)
  const handleUpdateLeaveStatus = async (id: number, status: 'Approved' | 'Rejected') => {
    try {
      const notes = prompt(`Enter optional note for ${status.toLowerCase()}ing this request:`) || undefined;
      const res = await eduveraApi.updateLeaveStatus(id, { status, admin_notes: notes });
      if (res.success) {
        loadLeaves();
        loadDailySheet();
        loadSummary();
      }
    } catch (err) {
      console.error('Failed to update leave status', err);
    }
  };

  // Handle Create New Leave
  const handleCreateLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await eduveraApi.submitLeaveRequest(newLeaveForm);
      if (res.success) {
        setShowNewLeaveModal(false);
        setNewLeaveForm({
          applicant_type: 'Student',
          applicant_id: 1,
          applicant_name: 'Alexander Wright',
          identifier: '1001',
          class_or_department: 'Grade 10 - Section A',
          start_date: todayStr,
          end_date: todayStr,
          leave_type: 'Sick / Medical',
          reason: '',
        });
        loadLeaves();
      } else {
        alert(res.message || 'Failed to submit leave request');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating leave application');
    }
  };

  // Simulate Guardian Alert Notification
  const handleSendGuardianAlert = (studentId: number, guardianPhone: string) => {
    setAlertSentFor(studentId);
    setTimeout(() => {
      alert(`Automated SMS Alert dispatched to Guardian at ${guardianPhone}: Attendance threshold violation reported.`);
      setAlertSentFor(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Enterprise Attendance Suite
            </span>
            <span className="text-xs text-slate-500 font-medium">Session 2025–2026</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Attendance & Faculty Timesheet Hub
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Automated roll-call, biometric sync, chronic absence alerts, and approved leave lock
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadSummary();
              if (activeTab === 'daily') loadDailySheet();
              else if (activeTab === 'matrix') loadMatrix();
              else if (activeTab === 'chronic') loadChronic();
              else if (activeTab === 'staff') loadStaffSheet();
              else if (activeTab === 'leaves') loadLeaves();
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Data
          </button>

          <button
            onClick={() => setShowPrintMatrix(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs hover:shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print Register
          </button>
        </div>
      </div>

      {/* 2. Modern Top Metric KPI Strip with Hover Lift */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Attendance Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Attendance Rate</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {summaryLoading ? '...' : summary?.attendance_rate || '0.0%'}
          </p>
          <span className="text-[10px] font-medium text-emerald-600 mt-1 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Roll Call
          </span>
        </div>

        {/* Present Today */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Present</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {summaryLoading ? '...' : summary?.present ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">
            of {summary?.total_students ?? 8} enrolled
          </span>
        </div>

        {/* Unexcused Absences */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Absent</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 mt-2">
            {summaryLoading ? '...' : summary?.absent ?? 0}
          </p>
          <span className="text-[10px] text-rose-600/80 font-medium mt-1 block">Unexcused</span>
        </div>

        {/* Late / Half-Day */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Late / Half-Day</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {summaryLoading ? '...' : (summary?.late ?? 0) + (summary?.half_day ?? 0)}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Past Grace</span>
        </div>

        {/* Approved Leave */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Excused Leave</span>
            <Award className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {summaryLoading ? '...' : summary?.excused_leave ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Approved</span>
        </div>

        {/* Chronic Alert */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chronic Risk</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {summaryLoading ? '...' : summary?.chronic_absentees_count ?? 0}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">&lt; 75% Attendance</span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Daily Student Sheet
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Monthly Register (1–31 Grid)
        </button>

        <button
          onClick={() => setActiveTab('chronic')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'chronic'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-500" /> Chronic Absenteeism & Alerts
          {summary && summary.chronic_absentees_count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
              {summary.chronic_absentees_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Faculty Timesheet & Biometrics
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'leaves'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Leave Applications
          {summary && summary.pending_leaves_count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
              {summary.pending_leaves_count} Pending
            </span>
          )}
        </button>
      </div>

      {/* 4. Tab 1: Daily Student Marking Sheet */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date selector with max=today */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Attendance Date (Max: Today)
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Class selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Grade 9">Grade 9</option>
                </select>
              </div>

              {/* Section selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Science">Science</option>
                </select>
              </div>
            </div>

            {/* Quick Bulk Marking Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleMarkAllAbsent}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Holiday / Weekend Warning Banner */}
          {sheetData && (sheetData.is_holiday || sheetData.is_weekend) && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {sheetData.is_holiday ? 'Scheduled Academic Holiday' : 'Scheduled Weekend Break'}
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {sheetData.holiday_title || 'Weekend'}. Regular attendance recording is normally disabled.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMakeupSession}
                    onChange={e => setIsMakeupSession(e.target.checked)}
                    className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  Authorize Special Make-up Session
                </label>
              </div>
            </div>
          )}

          {/* Success / Error Messages */}
          {sheetSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {sheetSuccessMessage}
            </div>
          )}
          {sheetErrorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              {sheetErrorMessage}
            </div>
          )}

          {/* Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Roll #</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Class / Section</th>
                    <th className="py-3 px-4 text-center">Status Action</th>
                    <th className="py-3 px-4">Arrival / Notes</th>
                    <th className="py-3 px-4">Leave Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sheetLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Loading roster...
                      </td>
                    </tr>
                  ) : sheetRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No students enrolled in this section.
                      </td>
                    </tr>
                  ) : (
                    sheetRecords.map(record => (
                      <tr key={record.student_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-700 font-mono">
                          {record.roll_no}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{record.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Guardian: {record.guardian_name} ({record.guardian_phone})
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {record.class_name} • {record.section}
                        </td>

                        {/* Interactive Status Selector - Sleek Minimalist Segmented Pill */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/70">
                            {/* Present */}
                            <button
                              type="button"
                              disabled={record.is_leave_locked}
                              onClick={() => handleStatusChange(record.student_id, 'Present')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                record.status === 'Present'
                                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              } ${record.is_leave_locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              Present
                            </button>

                            {/* Late */}
                            <button
                              type="button"
                              disabled={record.is_leave_locked}
                              onClick={() => handleStatusChange(record.student_id, 'Late')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                record.status === 'Late'
                                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              } ${record.is_leave_locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              Late
                            </button>

                            {/* Half-Day */}
                            <button
                              type="button"
                              disabled={record.is_leave_locked}
                              onClick={() => handleStatusChange(record.student_id, 'Half-day')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                record.status === 'Half-day'
                                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              } ${record.is_leave_locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              Half-Day
                            </button>

                            {/* Absent */}
                            <button
                              type="button"
                              disabled={record.is_leave_locked}
                              onClick={() => handleStatusChange(record.student_id, 'Absent')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                record.status === 'Absent'
                                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              } ${record.is_leave_locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              Absent
                            </button>

                            {/* Excused Leave */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(record.student_id, 'Excused Leave')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                                record.status === 'Excused Leave'
                                  ? 'bg-white text-sky-700 shadow-2xs font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Leave
                            </button>
                          </div>
                        </td>

                        {/* Arrival / Notes */}
                        <td className="py-3 px-4">
                          {record.status === 'Late' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="08:25 AM"
                                value={record.arrival_time || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setSheetRecords(prev =>
                                    prev.map(st =>
                                      st.student_id === record.student_id
                                        ? { ...st, arrival_time: val }
                                        : st
                                    )
                                  );
                                }}
                                className="w-20 px-2 py-1 text-xs border border-amber-300 bg-amber-50/50 rounded-md font-mono"
                              />
                              <span className="text-[11px] text-amber-700 font-semibold">
                                +{record.minutes_late || 20}m
                              </span>
                            </div>
                          )}

                          {record.status !== 'Late' && (
                            <input
                              type="text"
                              placeholder="Add optional note..."
                              value={record.remarks || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setSheetRecords(prev =>
                                  prev.map(st =>
                                    st.student_id === record.student_id ? { ...st, remarks: val } : st
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 bg-slate-50/50 rounded-md"
                            />
                          )}
                        </td>

                        {/* Leave Locking Status */}
                        <td className="py-3 px-4">
                          {record.is_leave_locked ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-lg text-sky-800 text-xs font-bold w-fit">
                              <Lock className="w-3.5 h-3.5 text-sky-600" />
                              <span>Approved Leave</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Regular Roll</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Save Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Total Roster: <span className="font-bold text-slate-900">{sheetRecords.length}</span> |
                Present:{' '}
                <span className="font-bold text-emerald-700">
                  {sheetRecords.filter(r => r.status === 'Present').length}
                </span>{' '}
                | Absent:{' '}
                <span className="font-bold text-rose-700">
                  {sheetRecords.filter(r => r.status === 'Absent').length}
                </span>{' '}
                | Late:{' '}
                <span className="font-bold text-amber-700">
                  {sheetRecords.filter(r => r.status === 'Late').length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingAttendance}
                  onClick={handleSaveStudentAttendance}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {savingAttendance ? 'Saving to Database...' : 'Save & Sync Attendance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Monthly Matrix (1–31 Grid) */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Matrix Header Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Month</label>
                <select
                  value={matrixMonth}
                  onChange={e => setMatrixMonth(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {[
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ].map((m, idx) => (
                    <option key={m} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Year</label>
                <select
                  value={matrixYear}
                  onChange={e => setMatrixYear(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Class</label>
                <select
                  value={matrixClass}
                  onChange={e => setMatrixClass(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Grade 9">Grade 9</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Section</label>
                <select
                  value={matrixSection}
                  onChange={e => setMatrixSection(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                </select>
              </div>
            </div>

            {/* Legend Pills */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> P = Present
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> A = Absent
              </span>
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> L = Late
              </span>
              <span className="flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> E = Leave
              </span>
              <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                W = Weekend / HD = Holiday
              </span>
            </div>
          </div>

          {/* 1–31 Grid Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-3 text-left sticky left-0 bg-slate-50/95 z-10 w-44">
                      Student Name
                    </th>
                    {matrixData?.days_meta.map(d => (
                      <th
                        key={d.day}
                        className={`py-2 px-1 min-w-[28px] border-l border-slate-100 ${
                          d.is_weekend ? 'bg-slate-100 text-slate-400' : d.is_holiday ? 'bg-amber-50 text-amber-600' : ''
                        }`}
                      >
                        <div className="text-[9px] font-medium">{d.day_name.slice(0, 1)}</div>
                        <div className="font-bold">{d.day}</div>
                      </th>
                    ))}
                    <th className="py-3 px-2 border-l border-slate-200 bg-slate-50/95">P</th>
                    <th className="py-3 px-2 bg-slate-50/95">A</th>
                    <th className="py-3 px-2 bg-slate-50/95">L</th>
                    <th className="py-3 px-3 bg-slate-50/95 font-bold">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {matrixLoading ? (
                    <tr>
                      <td colSpan={36} className="py-8 text-center text-slate-500">
                        Generating monthly register matrix...
                      </td>
                    </tr>
                  ) : !matrixData || matrixData.students.length === 0 ? (
                    <tr>
                      <td colSpan={36} className="py-8 text-center text-slate-500">
                        No attendance records available for this month.
                      </td>
                    </tr>
                  ) : (
                    matrixData.students.map(st => (
                      <tr key={st.student_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-2.5 px-3 text-left sticky left-0 bg-white z-10 font-bold text-slate-900 border-r border-slate-100 shadow-xs">
                          <div>{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Roll: {st.roll_no}</div>
                        </td>

                        {matrixData.days_meta.map(d => {
                          const status = st.daily_statuses[d.day];
                          const code = status?.code || '-';

                          let badgeClass = 'text-slate-400';
                          if (code === 'P') badgeClass = 'text-emerald-700 bg-emerald-50 font-bold';
                          else if (code === 'A') badgeClass = 'text-rose-700 bg-rose-100 font-bold';
                          else if (code === 'L') badgeClass = 'text-amber-700 bg-amber-50 font-bold';
                          else if (code === 'E') badgeClass = 'text-sky-700 bg-sky-50 font-bold';
                          else if (code === 'H') badgeClass = 'text-indigo-700 bg-indigo-50 font-bold';
                          else if (code === 'W' || code === 'HD') badgeClass = 'text-slate-300 bg-slate-50';

                          return (
                            <td
                              key={d.day}
                              className={`py-1.5 px-0.5 border-l border-slate-100 ${badgeClass}`}
                            >
                              {code}
                            </td>
                          );
                        })}

                        <td className="py-2.5 px-2 border-l border-slate-200 font-bold text-emerald-700">
                          {st.present_days}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-rose-700">
                          {st.absent_days}
                        </td>
                        <td className="py-2.5 px-2 font-bold text-amber-700">
                          {st.late_days}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] ${
                              st.is_chronic
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {st.attendance_pct}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Chronic Absenteeism & Alert Center */}
      {activeTab === 'chronic' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Chronic Absenteeism Surveillance & Guardian Alert Center
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated detection of students falling below 75% attendance threshold or having &ge; 3 consecutive unexcused absences.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Threshold: &lt; 75% | 3+ Days Absent
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chronicLoading ? (
              <div className="col-span-2 py-12 text-center text-slate-500">
                Scanning attendance records for chronic flags...
              </div>
            ) : chronicList.length === 0 ? (
              <div className="col-span-2 bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-900">No Chronic Absentees Detected</h4>
                <p className="text-xs text-emerald-700 mt-1">
                  All active students in this cohort maintain satisfactory attendance above institutional thresholds.
                </p>
              </div>
            ) : (
              chronicList.map(st => (
                <div
                  key={st.student_id}
                  className={`p-5 rounded-2xl border transition shadow-xs ${
                    st.severity === 'Critical'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            st.severity === 'Critical'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {st.severity} Priority
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-500">
                          Roll: {st.roll_no}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{st.name}</h4>
                      <p className="text-xs text-slate-500">
                        {st.class_name} • {st.section}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-rose-700">{st.attendance_rate}</div>
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        30-Day Evaluation
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white/80 rounded-xl border border-slate-200/60 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Consecutive Unexcused Days:</span>
                      <span className="font-bold text-rose-700">{st.consecutive_absent_days} Days</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Registered Guardian:</span>
                      <span className="font-semibold text-slate-900">{st.guardian_name}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Contact Telephone:</span>
                      <span className="font-mono text-slate-800">{st.guardian_phone}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {st.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-100 text-rose-800"
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50">
                    <button
                      type="button"
                      disabled={alertSentFor === st.student_id}
                      onClick={() => handleSendGuardianAlert(st.student_id, st.guardian_phone)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {alertSentFor === st.student_id ? 'Sending Alert...' : 'Dispatch Guardian SMS Warning'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Staff Timesheet & Biometrics */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Timesheet Date
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={staffDate}
                  onChange={e => setStaffDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Department
                </label>
                <select
                  value={staffDept}
                  onChange={e => setStaffDept(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="All">All Departments</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Biology">Biology</option>
                  <option value="Administration">Administration</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={savingStaff}
              onClick={handleSaveStaffAttendance}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {savingStaff ? 'Saving Timesheet...' : 'Save Staff Timesheet'}
            </button>
          </div>

          {staffSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {staffSuccessMsg}
            </div>
          )}

          {/* Staff Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Department / Role</th>
                    <th className="py-3 px-4">Punch In</th>
                    <th className="py-3 px-4">Punch Out</th>
                    <th className="py-3 px-4">Total Hours</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {staffLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading faculty timesheet...
                      </td>
                    </tr>
                  ) : staffRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No staff members found for selected department.
                      </td>
                    </tr>
                  ) : (
                    staffRecords.map(staff => (
                      <tr key={staff.staff_id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {staff.employee_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{staff.name}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {staff.department} • <span className="text-slate-400">{staff.role}</span>
                        </td>

                        {/* Punch In */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="07:45 AM"
                            disabled={staff.is_leave_locked}
                            value={staff.punch_in || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setStaffRecords(prev =>
                                prev.map(s =>
                                  s.staff_id === staff.staff_id ? { ...s, punch_in: val } : s
                                )
                              );
                            }}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 bg-slate-50 rounded-md font-mono"
                          />
                        </td>

                        {/* Punch Out */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="04:15 PM"
                            disabled={staff.is_leave_locked}
                            value={staff.punch_out || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setStaffRecords(prev =>
                                prev.map(s =>
                                  s.staff_id === staff.staff_id ? { ...s, punch_out: val } : s
                                )
                              );
                            }}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 bg-slate-50 rounded-md font-mono"
                          />
                        </td>

                        {/* Work Hours */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {staff.work_hours.toFixed(2)} hrs
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {staff.is_leave_locked ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1 w-fit">
                              <Lock className="w-3 h-3" /> Approved Leave
                            </span>
                          ) : (
                            <select
                              value={staff.status}
                              onChange={e => {
                                const val = e.target.value as any;
                                setStaffRecords(prev =>
                                  prev.map(s =>
                                    s.staff_id === staff.staff_id ? { ...s, status: val } : s
                                  )
                                );
                              }}
                              className="px-2 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-md"
                            >
                              <option value="Present">Present</option>
                              <option value="Late">Late</option>
                              <option value="Absent">Absent</option>
                              <option value="Half-day">Half-day</option>
                              <option value="On Duty">On Duty</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 5: Leave Requests & Approvals */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Applicant Type
                </label>
                <select
                  value={leaveFilterType}
                  onChange={e => setLeaveFilterType(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="All">All Applicants</option>
                  <option value="Student">Students Only</option>
                  <option value="Staff">Faculty / Staff Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Status Filter
                </label>
                <select
                  value={leaveFilterStatus}
                  onChange={e => setLeaveFilterStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowNewLeaveModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Apply for Leave
            </button>
          </div>

          {/* Leaves Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Type / Entity</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Leave Category</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leavesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading leave applications...
                      </td>
                    </tr>
                  ) : leaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No leave applications match current filters.
                      </td>
                    </tr>
                  ) : (
                    leaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{l.applicant_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {l.identifier}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              l.applicant_type === 'Student'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {l.applicant_type}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">{l.class_or_department}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-semibold">
                            {l.start_date} – {l.end_date}
                          </div>
                          <div className="text-[11px] text-slate-400">{l.days_count} Calendar Day(s)</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{l.leave_type}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={l.reason}>
                          {l.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              l.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : l.status === 'Rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {l.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateLeaveStatus(l.id, 'Approved')}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateLeaveStatus(l.id, 'Rejected')}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              By {l.approved_by_name || 'System'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: Apply for Leave Application */}
      {showNewLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Submit New Leave Request</h3>
              <button
                type="button"
                onClick={() => setShowNewLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLeaveSubmit} className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Applicant Type</label>
                  <select
                    value={newLeaveForm.applicant_type}
                    onChange={e => {
                      const type = e.target.value as 'Student' | 'Staff';
                      setNewLeaveForm(prev => ({
                        ...prev,
                        applicant_type: type,
                        applicant_name: type === 'Student' ? 'Alexander Wright' : 'Dr. Robert Vance',
                        identifier: type === 'Student' ? '1001' : 'EMP-101',
                        class_or_department: type === 'Student' ? 'Grade 10 - Section A' : 'Mathematics',
                      }));
                    }}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="Student">Student</option>
                    <option value="Staff">Faculty / Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Leave Category</label>
                  <select
                    value={newLeaveForm.leave_type}
                    onChange={e => setNewLeaveForm(prev => ({ ...prev, leave_type: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="Sick / Medical">Sick / Medical</option>
                    <option value="Casual">Casual</option>
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="Academic / Sports Event">Academic / Sports Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Applicant Name</label>
                <input
                  type="text"
                  required
                  value={newLeaveForm.applicant_name}
                  onChange={e => setNewLeaveForm(prev => ({ ...prev, applicant_name: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.start_date}
                    onChange={e => setNewLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={newLeaveForm.end_date}
                    onChange={e => setNewLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Justification / Stated Medical Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide verifiable reason for absence..."
                  value={newLeaveForm.reason}
                  onChange={e => setNewLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLeaveModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Printable Official Monthly Register Modal */}
      {showPrintMatrix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 print:hidden">
              <h3 className="text-sm font-bold text-slate-900">
                Official Monthly Register — {matrixClass} ({matrixData?.month_name} {matrixYear})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Media
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintMatrix(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 print:p-0">
              {/* Institution Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  Eduvera Grammar & STEM Collegiate
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Institutional Academic Attendance Register • Official Form AC-4
                </p>
                <div className="mt-2 text-xs font-semibold text-slate-700 flex justify-center gap-6">
                  <span>Class: <strong>{matrixClass} - {matrixSection}</strong></span>
                  <span>Month: <strong>{matrixData?.month_name} {matrixYear}</strong></span>
                  <span>Total Teaching Days: <strong>{matrixData?.total_school_days}</strong></span>
                </div>
              </div>

              {/* Roster Summary Table */}
              <table className="w-full text-left border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[11px]">
                    <th className="p-2 border-r border-slate-300">Roll #</th>
                    <th className="p-2 border-r border-slate-300">Student Name</th>
                    <th className="p-2 border-r border-slate-300 text-center">Days Present</th>
                    <th className="p-2 border-r border-slate-300 text-center">Days Absent</th>
                    <th className="p-2 border-r border-slate-300 text-center">Late Marks</th>
                    <th className="p-2 border-r border-slate-300 text-center">Approved Leaves</th>
                    <th className="p-2 text-center">Final Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matrixData?.students.map(s => (
                    <tr key={s.student_id}>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold">{s.roll_no}</td>
                      <td className="p-2 border-r border-slate-300 font-bold text-slate-900">{s.name}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-semibold text-emerald-700">
                        {s.present_days}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-semibold text-rose-700">
                        {s.absent_days}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-semibold text-amber-700">
                        {s.late_days}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-center font-semibold text-sky-700">
                        {s.leave_days}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900">{s.attendance_pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signature Blocks */}
              <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-700">
                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold">Class Teacher Signature</div>
                  <div className="text-[10px] text-slate-400">Prof. Harrison</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold">Academic Registrar</div>
                  <div className="text-[10px] text-slate-400">Verified & Reconciled</div>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 font-bold">Head of School Seal</div>
                  <div className="text-[10px] text-slate-400">Dr. Sarah Jenkins</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
