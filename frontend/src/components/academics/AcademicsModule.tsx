'use client';

import React, { useState, useEffect } from 'react';
import { SchoolClass, Subject, ClassAssignedSubject } from '../../types';
import {
  BookOpen,
  Award,
  Users,
  ChevronRight,
  Plus,
  Layers,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  Search,
  Check,
  Clock,
  Sparkles,
  School,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { eduveraApi } from '../../lib/services/api';

interface AcademicsModuleProps {
  classes: SchoolClass[];
  subjects: Subject[];
  onDataUpdated?: () => void;
}

export const AcademicsModule: React.FC<AcademicsModuleProps> = ({
  classes,
  subjects,
  onDataUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'classes' | 'curriculum' | 'class_wise'>('classes');

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number>(classes[0]?.id || 1);

  // Modals
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isAssignCoursesModalOpen, setIsAssignCoursesModalOpen] = useState(false);

  // Loading & notification states
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Class Form State
  const [classForm, setClassForm] = useState({
    name: '',
    numeric_grade: 1,
    sections: 'Section A, Section B',
    class_teacher: '',
    capacity: 40,
    selected_subject_ids: [] as number[],
  });

  // Add Subject Form State
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    department: 'Sciences',
    credits: 3,
    type: 'Core' as 'Core' | 'Elective' | 'Optional',
    selected_class_ids: [] as number[],
  });

  // Class-Wise Courses Assignment State
  const [classWiseData, setClassWiseData] = useState<{
    class: { id: number; name: string; class_teacher: string };
    subjects: any[];
  } | null>(null);
  const [loadingClassWise, setLoadingClassWise] = useState(false);
  const [assignedSubjectConfigs, setAssignedSubjectConfigs] = useState<
    Array<{
      subject_id: number;
      teacher_name: string;
      periods_per_week: number;
      is_compulsory: boolean;
      selected: boolean;
    }>
  >([]);

  // Auto-sync selected class when classes change
  useEffect(() => {
    if (classes.length > 0 && !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Load Class-Wise Courses when selected class changes or when tab is class_wise
  const loadClassSubjects = async (classId: number) => {
    setLoadingClassWise(true);
    try {
      const data = await eduveraApi.getClassSubjects(classId);
      setClassWiseData(data);
    } catch (err) {
      console.warn('Could not load class subjects:', err);
    } finally {
      setLoadingClassWise(false);
    }
  };

  useEffect(() => {
    if (selectedClassId) {
      loadClassSubjects(selectedClassId);
    }
  }, [selectedClassId]);

  // Handle Class Creation
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) {
      setErrorMsg('Class name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const sectionsArray = classForm.sections
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await eduveraApi.createClass({
        name: classForm.name,
        numeric_grade: Number(classForm.numeric_grade) || 1,
        sections: sectionsArray.length > 0 ? sectionsArray : ['Section A'],
        class_teacher: classForm.class_teacher || undefined,
        capacity: Number(classForm.capacity) || 40,
        subject_ids: classForm.selected_subject_ids,
      });

      if (res.success) {
        setSuccessMsg(`Class "${classForm.name}" created successfully!`);
        setIsAddClassModalOpen(false);
        setClassForm({
          name: '',
          numeric_grade: 1,
          sections: 'Section A, Section B',
          class_teacher: '',
          capacity: 40,
          selected_subject_ids: [],
        });
        if (onDataUpdated) onDataUpdated();
      } else {
        setErrorMsg(res.message || 'Failed to create class.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error occurred while saving class.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Subject Creation
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      setErrorMsg('Course code and course name are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await eduveraApi.createSubject({
        code: subjectForm.code.toUpperCase(),
        name: subjectForm.name,
        department: subjectForm.department,
        credits: Number(subjectForm.credits) || 3,
        type: subjectForm.type,
        class_ids: subjectForm.selected_class_ids,
      });

      if (res.success) {
        setSuccessMsg(`Course "${subjectForm.name}" registered successfully!`);
        setIsAddSubjectModalOpen(false);
        setSubjectForm({
          code: '',
          name: '',
          department: 'Sciences',
          credits: 3,
          type: 'Core',
          selected_class_ids: [],
        });
        if (onDataUpdated) onDataUpdated();
      } else {
        setErrorMsg(res.message || 'Failed to create course.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error occurred while saving course.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Course Assignment Modal for Current Class
  const openAssignCoursesModal = () => {
    const currentClass = classes.find((c) => c.id === selectedClassId);
    const existingMapped = classWiseData?.subjects || [];

    const configs = subjects.map((sub) => {
      const existing = existingMapped.find((m: any) => m.subject_id === sub.id || m.id === sub.id);
      return {
        subject_id: sub.id,
        teacher_name: existing?.teacher_name || currentClass?.class_teacher || '',
        periods_per_week: existing?.periods_per_week || 5,
        is_compulsory: existing?.is_compulsory ?? (sub.type === 'Core'),
        selected: Boolean(existing),
      };
    });

    setAssignedSubjectConfigs(configs);
    setIsAssignCoursesModalOpen(true);
  };

  // Save Class-Wise Course Assignment
  const handleSaveClassCourses = async () => {
    if (!selectedClassId) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const activeAssignments = assignedSubjectConfigs
        .filter((c) => c.selected)
        .map((c) => ({
          subject_id: c.subject_id,
          teacher_name: c.teacher_name,
          periods_per_week: c.periods_per_week,
          is_compulsory: c.is_compulsory,
        }));

      const res = await eduveraApi.assignClassSubjects(selectedClassId, activeAssignments);
      if (res.success) {
        setSuccessMsg('Class curriculum & courses assigned successfully!');
        setIsAssignCoursesModalOpen(false);
        loadClassSubjects(selectedClassId);
        if (onDataUpdated) onDataUpdated();
      } else {
        setErrorMsg(res.message || 'Failed to assign courses.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error occurred while saving course assignments.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Class
  const handleDeleteClass = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await eduveraApi.deleteClass(id);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      alert('Failed to delete class.');
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete course "${name}"?`)) return;
    try {
      await eduveraApi.deleteSubject(id);
      if (onDataUpdated) onDataUpdated();
    } catch (err) {
      alert('Failed to delete course.');
    }
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Alert Notices */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="p-1 hover:text-emerald-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-2xs">
          <span className="font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="p-1 hover:text-rose-950">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Academic Classes &amp; Curriculum
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure school classes, curriculum courses, and map subjects class-wise
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action: Add Class Button */}
          <button
            onClick={() => {
              setErrorMsg('');
              setIsAddClassModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Class</span>
          </button>

          {/* Action: Add Course Button */}
          <button
            onClick={() => {
              setErrorMsg('');
              setIsAddSubjectModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span>Add Course</span>
          </button>

          {/* Segmented View Switcher */}
          <div className="flex items-center p-1 bg-slate-200/60 rounded-xl">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classes ({classes.length})
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Courses Catalog ({subjects.length})
            </button>
            <button
              onClick={() => setActiveTab('class_wise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'class_wise'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class-Wise Courses
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Configured Classes
            </span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {classes.length} Classes
            </span>
            <span className="text-[11px] font-medium text-slate-400">Junior to Senior</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Curriculum Courses
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {subjects.length} Courses
            </span>
            <span className="text-[11px] font-medium text-emerald-600">Active Syllabus</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Enrolled Students
            </span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {classes.reduce((acc, c) => acc + (c.student_count || 0), 0)}
            </span>
            <span className="text-[11px] font-medium text-slate-400">Class Roster Total</span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* TAB 1: CLASSES DIRECTORY */}
      {/* ================================================================ */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {classes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <School className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No School Classes Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Get started by creating your first grade or class cohort (e.g. Grade 1, Grade 9, O-Levels).
              </p>
              <button
                onClick={() => setIsAddClassModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Class</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {cls.name.replace('Grade ', 'G').slice(0, 4)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {cls.student_count || 0} Students
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete Class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3.5">
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">{cls.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mentor: {cls.class_teacher || 'Unassigned'}
                      </p>
                    </div>

                    {/* Assigned Sections */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block mb-1.5">
                        Active Sections
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(cls.sections || ['Section A']).map((sec) => (
                          <span
                            key={sec}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Courses Count */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span className="text-[11px] text-slate-500 font-medium">Assigned Courses:</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {cls.subjects_count || cls.subjects?.length || 0} Subjects
                      </span>
                    </div>
                  </div>

                  {/* Class Courses Quick Link */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setActiveTab('class_wise');
                      }}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Class Courses</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 2: COURSE / CURRICULUM CATALOG */}
      {/* ================================================================ */}
      {activeTab === 'curriculum' && (
        <div className="rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Curriculum &amp; Course Catalog</span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({subjects.length} Total Registered Courses)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddSubjectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Courses Registered Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add curriculum courses like Mathematics, Science, English, Computer Science, or Social Studies.
              </p>
              <button
                onClick={() => setIsAddSubjectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register First Course</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/60 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Course Code</th>
                    <th className="py-3.5 px-4">Course Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Credits</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Taught In</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{sub.code}</td>
                      <td className="py-3.5 px-4 text-slate-900 font-semibold">{sub.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{sub.department}</td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono font-bold">
                        {sub.credits} Units
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            sub.type === 'Core'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : sub.type === 'Elective'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {sub.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(sub.classes && sub.classes.length > 0) ? (
                            sub.classes.map((c) => (
                              <span
                                key={c.id}
                                className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-slate-100 text-slate-700"
                              >
                                {c.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400">All / Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(sub.id, sub.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* TAB 3: CLASS-WISE COURSES BREAKDOWN & ASSIGNMENT */}
      {/* ================================================================ */}
      {activeTab === 'class_wise' && (
        <div className="space-y-5">
          {/* Class Cohort Selector Strip */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Target Class
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.student_count || 0} Students)
                      </option>
                    ))}
                  </select>
                  {selectedClass && (
                    <span className="text-xs text-slate-500">
                      • Mentor: <span className="font-semibold text-slate-800">{selectedClass.class_teacher}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAssignCoursesModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Assign / Edit Class Courses</span>
              </button>
            </div>
          </div>

          {/* Class Courses Table */}
          <div className="rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {selectedClass?.name || 'Class'} Curriculum Breakdown
                </span>
                <span className="text-[11px] text-slate-500 ml-2">
                  ({classWiseData?.subjects?.length || 0} Active Courses)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Semester Active
              </span>
            </div>

            {loadingClassWise ? (
              <div className="p-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs">Loading class courses...</p>
              </div>
            ) : (!classWiseData?.subjects || classWiseData.subjects.length === 0) ? (
              <div className="p-12 text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  No Courses Assigned to {selectedClass?.name || 'this class'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click below to assign courses and subjects specifically to {selectedClass?.name}.
                </p>
                <button
                  type="button"
                  onClick={openAssignCoursesModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Courses Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/60 font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Course Name</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Assigned Teacher</th>
                      <th className="py-3.5 px-4 text-center">Periods / Wk</th>
                      <th className="py-3.5 px-4 text-center">Credits</th>
                      <th className="py-3.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {classWiseData.subjects.map((s) => (
                      <tr key={s.id || s.subject_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{s.code}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-semibold">{s.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.department}</td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {s.teacher_name || selectedClass?.class_teacher || 'Assigned Mentor'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                          {s.periods_per_week || 5} Periods
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                          {s.credits || 3}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              s.is_compulsory !== false
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {s.is_compulsory !== false ? 'Compulsory' : 'Elective'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: ADD NEW CLASS */}
      {/* ================================================================ */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Create New Class Cohort</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 1, Grade 9, Class 5, O-Levels"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numeric Grade Level (1–12)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={classForm.numeric_grade}
                    onChange={(e) => setClassForm({ ...classForm, numeric_grade: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Sections (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Section A, Section B, Section C"
                  value={classForm.sections}
                  onChange={(e) => setClassForm({ ...classForm, sections: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Mentor / In-charge Teacher
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mr. Robert Vance"
                  value={classForm.class_teacher}
                  onChange={(e) => setClassForm({ ...classForm, class_teacher: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Initial Courses Checklist */}
              {subjects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assign Initial Courses to this Class
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                    {subjects.map((sub) => {
                      const isChecked = classForm.selected_subject_ids.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setClassForm({
                                  ...classForm,
                                  selected_subject_ids: [...classForm.selected_subject_ids, sub.id],
                                });
                              } else {
                                setClassForm({
                                  ...classForm,
                                  selected_subject_ids: classForm.selected_subject_ids.filter((id) => id !== sub.id),
                                });
                              }
                            }}
                            className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-mono text-blue-600 font-bold text-[11px]">{sub.code}</span>
                          <span className="font-semibold text-slate-800">{sub.name}</span>
                          <span className="text-slate-400 text-[10px] ml-auto">({sub.department})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: ADD NEW COURSE / SUBJECT */}
      {/* ================================================================ */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Register New Curriculum Course</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH-101"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Algebra, General Physics, Urdu Literature"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={subjectForm.department}
                    onChange={(e) => setSubjectForm({ ...subjectForm, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Sciences">Sciences</option>
                    <option value="Languages">Languages</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Arts & Humanities">Arts &amp; Humanities</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Type
                  </label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Core">Core (Mandatory)</option>
                    <option value="Elective">Elective</option>
                    <option value="Optional">Optional</option>
                  </select>
                </div>
              </div>

              {/* Class Enrollment Assignment */}
              {classes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assign this Course to Classes
                  </label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1">
                    {classes.map((cls) => {
                      const isChecked = subjectForm.selected_class_ids.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSubjectForm({
                                  ...subjectForm,
                                  selected_class_ids: [...subjectForm.selected_class_ids, cls.id],
                                });
                              } else {
                                setSubjectForm({
                                  ...subjectForm,
                                  selected_class_ids: subjectForm.selected_class_ids.filter((id) => id !== cls.id),
                                });
                              }
                            }}
                            className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-slate-900">{cls.name}</span>
                          <span className="text-slate-400 text-[10px] ml-auto">
                            ({cls.student_count || 0} students)
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Register Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 3: ASSIGN COURSES TO CLASS (CLASS-WISE) */}
      {/* ================================================================ */}
      {isAssignCoursesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in text-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Assign Courses to {selectedClass?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Select curriculum courses and designate weekly periods and subject teachers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignCoursesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="text-xs text-slate-600 bg-blue-50 border border-blue-200 p-3 rounded-xl">
                Check the courses that should be taught in <strong>{selectedClass?.name}</strong>. You can customize the subject instructor and weekly class periods.
              </div>

              <div className="space-y-2">
                {assignedSubjectConfigs.map((cfg, idx) => {
                  const subObj = subjects.find((s) => s.id === cfg.subject_id);
                  if (!subObj) return null;

                  return (
                    <div
                      key={cfg.subject_id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        cfg.selected
                          ? 'bg-white border-blue-200 shadow-2xs ring-1 ring-blue-500/10'
                          : 'bg-slate-50/70 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={cfg.selected}
                            onChange={(e) => {
                              const updated = [...assignedSubjectConfigs];
                              updated[idx].selected = e.target.checked;
                              setAssignedSubjectConfigs(updated);
                            }}
                            className="w-4 h-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600 text-xs">
                                {subObj.code}
                              </span>
                              <span className="font-bold text-slate-900 text-xs">{subObj.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {subObj.department}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {subObj.credits} Credit Units • Category: {subObj.type}
                            </span>
                          </div>
                        </label>

                        {/* Compulsory vs Elective Pill */}
                        {cfg.selected && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...assignedSubjectConfigs];
                              updated[idx].is_compulsory = !updated[idx].is_compulsory;
                              setAssignedSubjectConfigs(updated);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer ${
                              cfg.is_compulsory
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {cfg.is_compulsory ? 'Compulsory' : 'Elective'}
                          </button>
                        )}
                      </div>

                      {/* Config inputs when selected */}
                      {cfg.selected && (
                        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Subject Teacher
                            </label>
                            <input
                              type="text"
                              placeholder="Assigned Faculty / Mentor"
                              value={cfg.teacher_name}
                              onChange={(e) => {
                                const updated = [...assignedSubjectConfigs];
                                updated[idx].teacher_name = e.target.value;
                                setAssignedSubjectConfigs(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Weekly Periods
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="15"
                              value={cfg.periods_per_week}
                              onChange={(e) => {
                                const updated = [...assignedSubjectConfigs];
                                updated[idx].periods_per_week = Number(e.target.value);
                                setAssignedSubjectConfigs(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:bg-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">
                {assignedSubjectConfigs.filter((c) => c.selected).length} courses selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignCoursesModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveClassCourses}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Class Courses'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
