'use client';

import React, { useState, useMemo } from 'react';
import { Notice } from '../../types';
import { eduveraApi } from '../../lib/services/api';
import {
  Bell,
  AlertTriangle,
  Calendar,
  User,
  Plus,
  Trash2,
  Search,
  Filter,
  Megaphone,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  Users,
  Sparkles,
} from 'lucide-react';

interface NoticeboardModuleProps {
  notices: Notice[];
  currentUser?: any;
  onNoticeUpdated?: () => void;
}

export const NoticeboardModule: React.FC<NoticeboardModuleProps> = ({
  notices: initialNotices,
  currentUser,
  onNoticeUpdated,
}) => {
  const [localNotices, setLocalNotices] = useState<Notice[]>(initialNotices || []);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [urgentOnly, setUrgentOnly] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Academics',
    target_audience: 'All Students & Staff',
    posted_by: currentUser?.name || 'Administration Office',
    date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    is_urgent: false,
    content: '',
  });

  // Synchronize when initialNotices updates from parent
  React.useEffect(() => {
    if (initialNotices) {
      setLocalNotices(initialNotices);
    }
  }, [initialNotices]);

  // Categories list
  const categories = ['All', 'Academics', 'Events', 'Administrative', 'General', 'Examination'];
  const audiences = [
    'All',
    'All Students & Staff',
    'Parents & Guardians',
    'Teaching Staff',
    'High School Students (Grades 9-12)',
    'Primary School Students',
  ];

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return (localNotices || []).filter((nt) => {
      // Category filter
      if (activeCategory !== 'All' && nt.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
      // Audience filter
      if (selectedAudience !== 'All' && !nt.target_audience.toLowerCase().includes(selectedAudience.toLowerCase())) {
        return false;
      }
      // Urgent only filter
      if (urgentOnly && !nt.is_urgent) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = nt.title.toLowerCase().includes(query);
        const matchesContent = nt.content.toLowerCase().includes(query);
        const matchesPoster = nt.posted_by.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesPoster) {
          return false;
        }
      }
      return true;
    });
  }, [localNotices, activeCategory, selectedAudience, urgentOnly, searchQuery]);

  // Category Color Badge Helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'academics':
        return 'bg-blue-50 text-blue-700 border-blue-200/70';
      case 'events':
        return 'bg-amber-50 text-amber-700 border-amber-200/70';
      case 'administrative':
        return 'bg-purple-50 text-purple-700 border-purple-200/70';
      case 'examination':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/70';
    }
  };

  // Handle Form Submit
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setAlertMessage({ type: 'error', text: 'Please fill in both the announcement title and body content.' });
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await eduveraApi.createNotice({
        title: formData.title.trim(),
        category: formData.category,
        target_audience: formData.target_audience,
        posted_by: formData.posted_by.trim() || 'Administration Office',
        date: formData.date || undefined,
        expiry_date: formData.expiry_date || undefined,
        is_urgent: formData.is_urgent,
        content: formData.content.trim(),
      });

      if (res && res.data) {
        setLocalNotices([res.data, ...localNotices]);
      } else {
        // Fallback optimistic update
        const newNotice: Notice = {
          id: Date.now(),
          title: formData.title.trim(),
          category: formData.category,
          target_audience: formData.target_audience,
          posted_by: formData.posted_by.trim() || 'Administration Office',
          date: formData.date,
          expiry_date: formData.expiry_date || null,
          is_urgent: formData.is_urgent,
          content: formData.content.trim(),
        };
        setLocalNotices([newNotice, ...localNotices]);
      }

      setAlertMessage({ type: 'success', text: 'Announcement published successfully to the campus board!' });
      setIsModalOpen(false);
      setFormData({
        title: '',
        category: 'Academics',
        target_audience: 'All Students & Staff',
        posted_by: currentUser?.name || 'Administration Office',
        date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        is_urgent: false,
        content: '',
      });

      if (onNoticeUpdated) {
        onNoticeUpdated();
      }
    } catch (err: any) {
      console.error('Failed to create notice', err);
      setAlertMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to publish announcement. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Notice
  const handleDeleteNotice = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this announcement from the noticeboard?')) {
      return;
    }

    try {
      setDeletingId(id);
      await eduveraApi.deleteNotice(id);
      setLocalNotices((prev) => prev.filter((n) => n.id !== id));
      setAlertMessage({ type: 'success', text: 'Announcement removed successfully.' });

      if (onNoticeUpdated) {
        onNoticeUpdated();
      }
    } catch (err: any) {
      console.error('Failed to delete notice', err);
      setAlertMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to remove announcement.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Campus Noticeboard</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official circulars, academic notices, event bulletins, and administrative advisories
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 shadow-2xs">
            {filteredNotices.length} of {localNotices.length} Active Circulars
          </span>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Post Announcement</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search circulars, keywords, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Audience Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 rounded-xl px-2.5 py-1 text-xs text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 border-none outline-hidden cursor-pointer"
              >
                {audiences.map((aud) => (
                  <option key={aud} value={aud}>
                    {aud === 'All' ? 'All Audiences' : aud}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgent Filter Toggle */}
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                urgentOnly
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${urgentOnly ? 'text-rose-600' : 'text-slate-400'}`} />
              <span>Urgent Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Announcements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No circulars match the selected filter criteria. Try adjusting the category or search keywords.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setActiveCategory('All');
                setSelectedAudience('All');
                setSearchQuery('');
                setUrgentOnly(false);
              }}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((nt) => (
            <div
              key={nt.id}
              className={`p-5 rounded-2xl bg-white border shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 space-y-3 ${
                nt.is_urgent ? 'border-rose-200/90' : 'border-slate-200/70'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
                      nt.category
                    )}`}
                  >
                    {nt.category}
                  </span>

                  {nt.is_urgent && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Priority Urgent
                    </span>
                  )}

                  {nt.expiry_date && (
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      <Clock className="w-3 h-3 text-slate-400" /> Expires: {nt.expiry_date}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {nt.date}
                  </span>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteNotice(nt.id)}
                    disabled={deletingId === nt.id}
                    title="Remove announcement"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    {deletingId === nt.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{nt.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal mt-1.5 whitespace-pre-line">
                  {nt.content}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-2">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Issued by: <strong className="text-slate-700">{nt.posted_by}</strong>
                </span>

                <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Audience: <span className="text-slate-700 font-semibold">{nt.target_audience}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUBLISH ANNOUNCEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Publish Campus Announcement</h3>
                  <p className="text-xs text-slate-500">Post circular to students, teachers, or parents</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePublishNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Circular Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Exhibition & Annual Sports Meet Schedule"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Events">Events</option>
                    <option value="Administrative">Administrative</option>
                    <option value="General">General</option>
                    <option value="Examination">Examination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Audience <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="All Students & Staff">All Students & Staff</option>
                    <option value="Parents & Guardians">Parents & Guardians</option>
                    <option value="Teaching Staff">Teaching Staff</option>
                    <option value="High School Students (Grades 9-12)">High School (Grades 9-12)</option>
                    <option value="Primary School Students">Primary School Students</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issued By / Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Principal Office"
                    value={formData.posted_by}
                    onChange={(e) => setFormData({ ...formData, posted_by: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Circular Content / Announcement Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the complete announcement, schedule, instructions, or venue details..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Urgent Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${formData.is_urgent ? 'text-rose-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Mark as Urgent Notice</p>
                    <p className="text-[11px] text-slate-500">Highlights this circular with a priority warning banner</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_urgent}
                  onChange={(e) => setFormData({ ...formData, is_urgent: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publish Announcement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
