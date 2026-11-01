'use client';

import React, { useState } from 'react';
import { Staff } from '../../types';
import { Search, GraduationCap, Mail, Phone, Building, CheckCircle2, ShieldCheck } from 'lucide-react';

interface StaffModuleProps {
  staff: Staff[];
}

export const StaffModule: React.FC<StaffModuleProps> = ({ staff }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  const departments = ['All', ...Array.from(new Set(staff.map(s => s.department)))];

  const filteredStaff = staff.filter(s => {
    const matchesSearch = `${s.name} ${s.employee_id} ${s.email} ${s.designation}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Faculty & Staff Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Academic faculty, heads of department, and administrative personnel
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400 shadow-2xs w-48 sm:w-56 transition"
            />
          </div>

          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200/80 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Faculty</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{staff.length} Active</span>
            <span className="text-[11px] font-medium text-slate-400">Full-time Staff</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Departments</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">8 Divisions</span>
            <span className="text-[11px] font-medium text-emerald-600">Interdisciplinary</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Verification</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">100%</span>
            <span className="text-[11px] font-medium text-amber-600">Certified Credentials</span>
          </div>
        </div>
      </div>

      {/* Modern Faculty Cards Grid or Empty State */}
      {filteredStaff.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/70 shadow-xs flex flex-col items-center justify-center gap-2">
          <GraduationCap className="w-8 h-8 text-slate-300" />
          <p className="font-semibold text-slate-700 text-sm">No faculty members found</p>
          <p className="text-xs text-slate-400">Invite and add teachers, instructors, and departmental staff to your directory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((stf) => (
            <div
              key={stf.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-100">
                      {stf.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{stf.name}</h3>
                      <p className="text-xs text-blue-600 font-medium mt-0.5">{stf.designation}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                    {stf.employee_id}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Department</span>
                    <span className="font-semibold text-slate-800">{stf.department}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Email</span>
                    <span className="text-slate-600 truncate max-w-[160px] text-[11px]">{stf.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active On Duty
                </span>
                <span className="text-slate-400 font-medium">Full-time</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
