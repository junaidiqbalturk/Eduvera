'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Exam, MarksEntrySheetData, MarksEntryRow } from '../../types';
import { eduveraApi, evaluateGradeByScale } from '../../lib/services/api';
import {
  Award,
  Calendar,
  FileText,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  Save,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  X,
  BookOpen,
  Users,
  Percent,
} from 'lucide-react';

interface ExaminationsModuleProps {
  exams: Exam[];
  onOpenMarksheet: (studentId: number) => void;
}

export const ExaminationsModule: React.FC<ExaminationsModuleProps> = ({ exams, onOpenMarksheet }) => {
  const [activeView, setActiveView] = useState<'sessions' | 'gradebook'>('sessions');
  const [gradingSystem, setGradingSystem] = useState<'percentage' | 'gpa'>('percentage');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = (localStorage.getItem('eduvera_grading_system') || 'percentage') as 'percentage' | 'gpa';
      setGradingSystem(stored);
    }
  }, []);

  const handleToggleGradingSystem = (sys: 'percentage' | 'gpa') => {
    setGradingSystem(sys);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eduvera_grading_system', sys);
    }
    setRoster(prev => prev.map(r => {
      const calc = evaluateGradeByScale(r.marks_obtained, r.max_marks || 100, sys);
      return {
        ...r,
        grade: calc.grade,
        gpa_point: calc.gpa_point,
      };
    }));
  };

  // Gradebook Filter State
  const [selectedExamId, setSelectedExamId] = useState<number>(exams[0]?.id || 2);
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('Section A');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>('MATH-101');

  // Sheet Data State
  const [sheetData, setSheetData] = useState<MarksEntrySheetData | null>(null);
  const [roster, setRoster] = useState<MarksEntryRow[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const subjectOptions = [
    { code: 'MATH-101', name: 'Mathematics' },
    { code: 'PHYS-101', name: 'Physics' },
    { code: 'CHEM-101', name: 'Chemistry' },
    { code: 'ENG-101', name: 'English Literature' },
    { code: 'CS-101', name: 'Computer Science' },
  ];

  const currentSubject = subjectOptions.find(s => s.code === selectedSubjectCode);

  const loadMarksSheet = useCallback(async () => {
    if (!selectedExamId) return;
    try {
      setLoadingSheet(true);
      const data = await eduveraApi.getMarksEntrySheet({
        exam_id: selectedExamId,
        class_name: selectedClass,
        section: selectedSection,
        subject_code: selectedSubjectCode,
        subject_name: currentSubject?.name,
      });

      setSheetData(data);
      setRoster(data.roster || []);
    } catch (err: any) {
      console.error('Failed to load marks entry sheet', err);
    } finally {
      setLoadingSheet(false);
    }
  }, [selectedExamId, selectedClass, selectedSection, selectedSubjectCode, currentSubject]);

  useEffect(() => {
    if (activeView === 'gradebook') {
      loadMarksSheet();
    }
  }, [activeView, loadMarksSheet]);

  // Live dynamic calculation of letter grade & GPA on keystroke
  const handleMarkChange = (studentId: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const boundedVal = Math.min(100, Math.max(0, val));

    setRoster(prev =>
      prev.map(row => {
        if (row.student_id !== studentId) return row;

        const calc = evaluateGradeByScale(boundedVal, row.max_marks || 100, gradingSystem);

        return {
          ...row,
          marks_obtained: boundedVal,
          grade: calc.grade,
          gpa_point: calc.gpa_point,
        };
      })
    );
  };

  const handleSaveMarks = async () => {
    setSavingMarks(true);
    setNotification(null);

    try {
      const res = await eduveraApi.saveMarks({
        exam_id: selectedExamId,
        class_name: selectedClass,
        section: selectedSection,
        subject_code: selectedSubjectCode,
        subject_name: currentSubject?.name || selectedSubjectCode,
        records: roster.map(r => ({
          student_id: r.student_id,
          marks_obtained: r.marks_obtained,
          max_marks: r.max_marks,
          remarks: r.remarks,
        })),
      });

      if (res.success) {
        setNotification({ text: res.message || 'Marks successfully computed and saved to database.', type: 'success' });
        loadMarksSheet();
      } else {
        setNotification({ text: res.message || 'Failed to save marks.', type: 'error' });
      }
    } catch (err: any) {
      setNotification({
        text: err?.response?.data?.message || err?.message || 'Server error while saving marks.',
        type: 'error',
      });
    } finally {
      setSavingMarks(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  // Quick fill helper (e.g. set full marks or passing marks)
  const handleQuickGrade = (targetPct: number) => {
    setRoster(prev =>
      prev.map(row => {
        const val = Math.round((row.max_marks || 100) * (targetPct / 100));
        const calc = evaluateGradeByScale(val, row.max_marks || 100, gradingSystem);

        return {
          ...row,
          marks_obtained: val,
          grade: calc.grade,
          gpa_point: calc.gpa_point,
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-2xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Examinations & Gradebook Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional assessment schedules, teacher marks entry, and standardized GPA report cards
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setActiveView('sessions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === 'sessions'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exam Terms ({exams.length})
          </button>
          <button
            onClick={() => setActiveView('gradebook')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeView === 'gradebook'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Teacher Marks Entry
          </button>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Exam Sessions</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{exams.length} Terms</span>
            <span className="text-[11px] font-medium text-slate-400">Academic Year</span>
          </div>
        </div>

        <div 
          onClick={() => handleToggleGradingSystem(gradingSystem === 'percentage' ? 'gpa' : 'percentage')}
          className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 transition-all duration-200 cursor-pointer"
          title="Click to toggle between Percentage and GPA systems"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Grading Scheme</span>
            {gradingSystem === 'percentage' ? (
              <Percent className="w-4 h-4 text-blue-600" />
            ) : (
              <Award className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 tracking-tight">
              {gradingSystem === 'percentage' ? 'Percentage %' : 'GPA 4.00'}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/50">
              {gradingSystem === 'percentage' ? 'Pakistani Standard' : 'Collegiate / US'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Gradebook Status</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Active Sync</span>
            <span className="text-[11px] font-medium text-amber-600">MySQL Database</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: EXAM SESSIONS OVERVIEW */}
      {activeView === 'sessions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map(ex => (
            <div
              key={ex.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 font-mono px-2.5 py-0.5 bg-blue-50 border border-blue-100 rounded-lg">
                    {ex.academic_year}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {ex.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-3">{ex.name}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {ex.start_date} &rarr; {ex.end_date}
                  </span>
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedExamId(ex.id);
                    setActiveView('gradebook');
                  }}
                  className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Grade Students
                </button>
                <button
                  onClick={() => onOpenMarksheet(1)}
                  className="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Report Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: TEACHER MARKS ENTRY & DYNAMIC GRADEBOOK */}
      {activeView === 'gradebook' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Exam Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Exam Term</label>
                <select
                  value={selectedExamId}
                  onChange={e => setSelectedExamId(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Class</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Section A">Section A</option>
                  <option value="Section B">Section B</option>
                  <option value="Science">Science</option>
                  <option value="Science-A">Science-A</option>
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</label>
                <select
                  value={selectedSubjectCode}
                  onChange={e => setSelectedSubjectCode(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/60 border border-blue-200 rounded-xl"
                >
                  {subjectOptions.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Actions & Auto-fill */}
            <div className="flex flex-wrap items-center gap-1.5">
              {gradingSystem === 'percentage' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickGrade(85)}
                    className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                    title="Populate test scores at 85% (Grade A+)"
                  >
                    Set A+ (85%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGrade(75)}
                    className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                    title="Populate test scores at 75% (Grade A)"
                  >
                    Set A (75%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGrade(65)}
                    className="px-2 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition cursor-pointer"
                    title="Populate test scores at 65% (Grade B)"
                  >
                    Set B (65%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGrade(55)}
                    className="px-2 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition cursor-pointer"
                    title="Populate test scores at 55% (Grade C)"
                  >
                    Set C (55%)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleQuickGrade(92)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                    title="Populate test scores at 92%"
                  >
                    Set All A+ (92)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGrade(82)}
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                    title="Populate test scores at 82%"
                  >
                    Set All A (82)
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={loadMarksSheet}
                title="Reload"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 bg-slate-100 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSheet ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Roster & Marks Table */}
          <div className="rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {currentSubject?.name} ({selectedSubjectCode}) Gradebook
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                  Max Marks: 100.00
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60">
                  {gradingSystem === 'percentage' ? 'Percentage Scheme (FBISE/BISE)' : 'GPA 4.00 Scheme'}
                </span>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                {roster.length} Students in Cohort
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/60 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Roll #</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4 text-center">Score (Max: 100)</th>
                    <th className="py-3 px-4 text-center">Letter Grade</th>
                    <th className="py-3 px-4 text-center">
                      {gradingSystem === 'percentage' ? 'Percentage %' : 'GPA Point'}
                    </th>
                    <th className="py-3 px-4">Teacher Notes</th>
                    <th className="py-3 px-4 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingSheet ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading gradebook records...
                      </td>
                    </tr>
                  ) : roster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No students enrolled in this section.
                      </td>
                    </tr>
                  ) : (
                    roster.map(r => (
                      <tr key={r.student_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{r.student_roll}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{r.student_name}</td>

                        {/* Interactive Score Input with Live Preview */}
                        <td className="py-3 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={r.marks_obtained}
                            onChange={e => handleMarkChange(r.student_id, e.target.value)}
                            className="w-20 px-2 py-1 text-center font-mono font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          />
                        </td>

                        {/* Live Letter Grade Badge */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              r.grade === 'A+' || r.grade === 'A'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : r.grade === 'B'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : r.grade === 'C'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {r.grade}
                          </span>
                        </td>

                        {/* Live Percentage or GPA */}
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                          {gradingSystem === 'percentage'
                            ? `${((r.marks_obtained / (r.max_marks || 100)) * 100).toFixed(0)}%`
                            : r.gpa_point.toFixed(2)}
                        </td>

                        {/* Remarks */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            placeholder="Optional feedback..."
                            value={r.remarks || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setRoster(prev =>
                                prev.map(row => (row.student_id === r.student_id ? { ...row, remarks: val } : row))
                              );
                            }}
                            className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </td>

                        {/* 1-Click Report Card */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenMarksheet(r.student_id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Marksheet
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Save & Sync Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Evaluation: <span className="font-bold text-slate-900">{roster.length}</span> Students | Subject:{' '}
                <span className="font-semibold text-blue-600">{currentSubject?.name}</span>
              </div>

              <button
                type="button"
                disabled={savingMarks || roster.length === 0}
                onClick={handleSaveMarks}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingMarks ? 'Saving & Calculating GPA...' : 'Save & Publish Marks'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
