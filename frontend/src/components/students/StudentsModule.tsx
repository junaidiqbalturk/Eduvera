'use client';

import React, { useState, useEffect } from 'react';
import { Student, SchoolClass } from '../../types';
import { eduveraApi } from '../../lib/services/api';
import {
  Search,
  Filter,
  Eye,
  Users,
  CheckCircle2,
  Award,
  UserPlus,
  Sparkles,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface StudentsModuleProps {
  students: Student[];
  classes?: SchoolClass[];
  onOpenMarksheet: (studentId: number) => void;
  onRefresh?: () => void;
}

export const StudentsModule: React.FC<StudentsModuleProps> = ({
  students: initialStudents,
  classes: initialClasses = [],
  onOpenMarksheet,
  onRefresh,
}) => {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [classList, setClassList] = useState<SchoolClass[]>(initialClasses);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Form State for Student Admission
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    blood_group: 'O+',
    class_name: initialClasses[0]?.name || '',
    section: (initialClasses[0]?.sections && initialClasses[0].sections[0]) || 'Section A',
    roll_no: '',
    admission_date: new Date().toISOString().split('T')[0],
    guardian_name: '',
    guardian_relation: 'Father',
    guardian_phone: '',
    guardian_email: '',
    address: '',
    emergency_contact: '',
  });

  // Sync students when prop changes
  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Sync classes when prop changes or fetch from API if not loaded
  useEffect(() => {
    if (initialClasses && initialClasses.length > 0) {
      setClassList(initialClasses);
    } else {
      eduveraApi.getClasses().then((cls) => {
        if (cls && cls.length > 0) {
          setClassList(cls);
        }
      }).catch(console.error);
    }
  }, [initialClasses]);

  // When classList becomes available, select the first class and section if unassigned
  useEffect(() => {
    if (classList.length > 0 && !formData.class_name) {
      const firstCls = classList[0];
      const firstSec = (firstCls.sections && firstCls.sections.length > 0) ? firstCls.sections[0] : 'Section A';
      setFormData(prev => ({
        ...prev,
        class_name: prev.class_name || firstCls.name,
        section: prev.section || firstSec,
      }));
    }
  }, [classList, formData.class_name]);

  const loadStudents = async () => {
    try {
      const data = await eduveraApi.getStudents({
        search: searchTerm || undefined,
        class_name: classFilter !== 'All' ? classFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
      setStudents(data);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to reload students list', err);
    }
  };

  const filteredStudents = students.filter(st => {
    const matchesSearch = `${st.first_name} ${st.last_name} ${st.admission_no} ${st.roll_no} ${st.guardian_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass =
      classFilter === 'All' ||
      (st.class && st.class.toLowerCase().includes(classFilter.toLowerCase())) ||
      (st.class_name && st.class_name.toLowerCase().includes(classFilter.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || st.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const activeCount = students.filter(s => s.status?.toLowerCase() === 'active').length;

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await eduveraApi.enrollStudent({
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        dob: formData.dob,
        blood_group: formData.blood_group || undefined,
        class_name: formData.class_name,
        section: formData.section,
        roll_no: formData.roll_no || undefined,
        admission_date: formData.admission_date,
        guardian_name: formData.guardian_name,
        guardian_relation: formData.guardian_relation,
        guardian_phone: formData.guardian_phone,
        guardian_email: formData.guardian_email || undefined,
        address: formData.address || undefined,
      });

      if (res.success) {
        setIsEnrollModalOpen(false);
        setSuccessBanner(
          `Student ${formData.first_name} ${formData.last_name} enrolled successfully! Assigned ID: ${res.data.admission_no}`
        );
        setTimeout(() => setSuccessBanner(null), 6000);

        // Reset form
        const defaultCls = classList[0];
        const defaultSec = (defaultCls?.sections && defaultCls.sections.length > 0) ? defaultCls.sections[0] : 'Section A';
        setFormData({
          first_name: '',
          last_name: '',
          gender: 'Male',
          dob: '',
          blood_group: 'O+',
          class_name: defaultCls ? defaultCls.name : '',
          section: defaultSec,
          roll_no: '',
          admission_date: new Date().toISOString().split('T')[0],
          guardian_name: '',
          guardian_relation: 'Father',
          guardian_phone: '',
          guardian_email: '',
          address: '',
          emergency_contact: '',
        });

        // Refresh list
        loadStudents();
      } else {
        setFormError(res.message || 'Failed to enroll student.');
      }
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Server error while enrolling student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEnrollModal = () => {
    if (classList.length > 0) {
      const isValid = classList.some(c => c.name === formData.class_name);
      if (!formData.class_name || !isValid) {
        const firstCls = classList[0];
        const firstSec = (firstCls.sections && firstCls.sections.length > 0) ? firstCls.sections[0] : 'Section A';
        setFormData(prev => ({
          ...prev,
          class_name: firstCls.name,
          section: firstSec,
        }));
      }
    }
    setFormError('');
    setIsEnrollModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Metric Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Student Directory & Admissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional admissions, section rosters, and cumulative academic performance
          </p>
        </div>

        {/* Quick Filter, Search Bar & Enroll Button */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, roll, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 shadow-2xs w-48 sm:w-56 transition"
            />
          </div>

          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200/80 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="All">All Grades</option>
            {classList.map(cls => (
              <option key={cls.id || cls.name} value={cls.name}>
                {cls.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenEnrollModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Enroll Student</span>
          </button>
        </div>
      </div>

      {/* 3 Modern Summary Cards with Hover Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{students.length}</span>
            <span className="text-[11px] font-medium text-slate-400">Database Cohort</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">{activeCount}</span>
            <span className="text-[11px] font-medium text-emerald-600">100% In Good Standing</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Academic Standing</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {students.length > 0 ? '3.84' : 'N/A'}
            </span>
            <span className="text-[11px] font-medium text-amber-600">
              {students.length > 0 ? 'Standardized' : 'No records'}
            </span>
          </div>
        </div>
      </div>

      {/* Modern Student Ledger Table */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Registered Students</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600 font-semibold">
              {filteredStudents.length} Students
            </span>
          </div>

          <button
            onClick={loadStudents}
            title="Refresh from MySQL"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200/60 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class & Section</th>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Guardian Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Academic Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {students.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">No students enrolled yet</p>
                        <p className="text-[11px] text-slate-400">Click &quot;+ Enroll Student&quot; above to register your institution&apos;s first student.</p>
                      </div>
                    ) : (
                      'No students match the selected search or filter criteria.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 font-bold flex items-center justify-center text-slate-700 text-xs border border-slate-200/60">
                          {st.first_name[0]}
                          {st.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {st.first_name} {st.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{st.admission_no}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold text-slate-900">{st.class || st.class_name}</span>
                      <span className="text-[11px] text-slate-400 block">{st.section}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{st.roll_no}</td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 font-medium">{st.guardian_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{st.guardian_phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onOpenMarksheet(st.id)}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold inline-flex items-center gap-1.5 shadow-2xs hover:border-slate-300 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" /> Report Card
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT ENROLLMENT MODAL DIALOG */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-xl text-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
                  Admissions Office
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Enroll New Student</h3>
              </div>
              <button
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4 text-xs">
              {/* 1. Personal Details */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  1. Student Personal Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lucas"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mendoza"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Gender *</label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Blood Group</label>
                    <select
                      value={formData.blood_group}
                      onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Admission Date</label>
                    <input
                      type="date"
                      value={formData.admission_date}
                      onChange={e => setFormData({ ...formData, admission_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Academic Placement */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  2. Academic Placement
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Grade / Class *</label>
                    <select
                      value={formData.class_name}
                      onChange={e => {
                        const newClassName = e.target.value;
                        const targetClass = classList.find(c => c.name === newClassName);
                        const firstSec = (targetClass?.sections && targetClass.sections.length > 0)
                          ? targetClass.sections[0]
                          : 'Section A';
                        setFormData({
                          ...formData,
                          class_name: newClassName,
                          section: firstSec,
                        });
                      }}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    >
                      {classList.length === 0 ? (
                        <option value="">No classes configured</option>
                      ) : (
                        classList.map(cls => (
                          <option key={cls.id || cls.name} value={cls.name}>
                            {cls.name}
                          </option>
                        ))
                      )}
                    </select>
                    {classList.length === 0 && (
                      <p className="text-[10px] text-amber-600 mt-1 font-medium">Please create classes in Academics module first.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Section *</label>
                    <select
                      value={formData.section}
                      onChange={e => setFormData({ ...formData, section: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                    >
                      {(() => {
                        const currentClass = classList.find(c => c.name === formData.class_name);
                        const sections = (currentClass?.sections && currentClass.sections.length > 0)
                          ? currentClass.sections
                          : ['Section A'];
                        return sections.map(sec => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Roll Number <span className="text-slate-400 font-normal">(Auto if blank)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1015"
                      value={formData.roll_no}
                      onChange={e => setFormData({ ...formData, roll_no: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Guardian & Emergency Contact */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  3. Guardian & Contact Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Guardian Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Carlos Mendoza"
                      value={formData.guardian_name}
                      onChange={e => setFormData({ ...formData, guardian_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Relationship</label>
                    <select
                      value={formData.guardian_relation}
                      onChange={e => setFormData({ ...formData, guardian_relation: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Legal Guardian">Legal Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Guardian Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 999-8888"
                      value={formData.guardian_phone}
                      onChange={e => setFormData({ ...formData, guardian_phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Guardian Email</label>
                    <input
                      type="email"
                      placeholder="carlos.m@example.com"
                      value={formData.guardian_email}
                      onChange={e => setFormData({ ...formData, guardian_email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">Residential Address</label>
                    <input
                      type="text"
                      placeholder="Street address, City, Postal Code"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Registering...' : 'Complete Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
