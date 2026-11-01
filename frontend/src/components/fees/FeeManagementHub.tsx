'use client';

import React, { useState, useEffect } from 'react';
import { eduveraApi } from '../../lib/services/api';
import {
  FeeInvoice,
  FeeSummary,
  FeeStructure,
  FeeCategory,
  FeePaymentTransaction,
  FeeDefaulter,
  FeeReceiptData,
  FeeVoucherData,
  Student,
} from '../../types';
import { PrintableReceiptModal } from './PrintableReceiptModal';
import { PrintableFeeVoucherModal } from './PrintableFeeVoucherModal';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Building,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  X,
  Phone,
  Mail,
} from 'lucide-react';

interface FeeManagementHubProps {
  currentUser?: any;
}

export const FeeManagementHub: React.FC<FeeManagementHubProps> = ({ currentUser }) => {
  const [subTab, setSubTab] = useState<'invoices' | 'structures' | 'defaulters' | 'transactions'>('invoices');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [transactions, setTransactions] = useState<FeePaymentTransaction[]>([]);
  const [defaulters, setDefaulters] = useState<FeeDefaulter[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All Classes');

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Create Invoice Modal & Student Selection
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isManualStudentEntry, setIsManualStudentEntry] = useState(false);
  const [newInvStudentName, setNewInvStudentName] = useState('');
  const [newInvStudentRoll, setNewInvStudentRoll] = useState('');
  const [newInvStudentEmail, setNewInvStudentEmail] = useState('');
  const [newInvStudentPhone, setNewInvStudentPhone] = useState('');
  const [newInvClass, setNewInvClass] = useState('Grade 10');
  const [newInvDueDate, setNewInvDueDate] = useState('');
  const [newInvDiscount, setNewInvDiscount] = useState<number>(0);
  const [newInvNotes, setNewInvNotes] = useState('');
  const [newInvItems, setNewInvItems] = useState([
    { fee_category_name: 'Tuition Fee', description: 'Core Tuition Q1', amount: 900 },
  ]);
  const [createInvLoading, setCreateInvLoading] = useState(false);
  const [createInvError, setCreateInvError] = useState('');

  // Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<FeeReceiptData | null>(null);

  // Voucher Modal
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState<FeeVoucherData | null>(null);

  // Success Notification banner
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, invRes, structRes, txRes, defRes, studentsRes] = await Promise.all([
        eduveraApi.getFeeSummary(),
        eduveraApi.getFeeInvoices({
          status: statusFilter !== 'All' ? statusFilter : undefined,
          class_name: classFilter !== 'All Classes' ? classFilter : undefined,
          search: searchQuery || undefined,
        }),
        eduveraApi.getFeeStructures(),
        eduveraApi.getFeeTransactions(),
        eduveraApi.getFeeDefaulters(),
        eduveraApi.getStudents(),
      ]);

      setSummary(sumRes);
      setInvoices(invRes);
      setStructures(structRes.structures || []);
      setCategories(structRes.categories || []);
      setTransactions(txRes);
      setDefaulters(defRes);
      setAllStudents(studentsRes || []);
    } catch (err: any) {
      console.error('Failed to load fee management data:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewVoucher = async (invoiceIdOrNumber: string | number) => {
    try {
      const voucher = await eduveraApi.getFeeVoucher(invoiceIdOrNumber);
      setActiveVoucher(voucher);
      setVoucherModalOpen(true);
    } catch {
      showBanner('Failed to load fee voucher details', 'error');
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    if (!studentId) return;

    const s = allStudents.find((st) => String(st.id) === studentId);
    if (s) {
      setNewInvStudentName(`${s.first_name} ${s.last_name}`);
      setNewInvStudentRoll(s.roll_no || s.admission_no);
      setNewInvStudentPhone(s.guardian_phone || '');
      setNewInvStudentEmail(`${s.first_name.toLowerCase()}.${s.last_name.toLowerCase()}@eduvera.school`);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, classFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Open Collect Payment Modal
  const openCollectModal = (inv: FeeInvoice) => {
    setSelectedInvoice(inv);
    const bal = inv.balance_amount !== undefined ? inv.balance_amount : (inv.amount - inv.paid_amount);
    setPaymentAmount(bal);
    setPaymentMethod('Cash');
    setPaymentRef('');
    setPaymentNotes('');
    setPaymentError('');
    setIsCollectModalOpen(true);
  };

  // Submit Payment Collection
  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentError('');
    setPaymentLoading(true);

    try {
      const res = await eduveraApi.collectFeePayment(selectedInvoice.id, {
        amount_paid: Number(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: paymentRef,
        notes: paymentNotes,
      });

      if (res.success) {
        setIsCollectModalOpen(false);
        showBanner(`Payment of $${paymentAmount.toFixed(2)} recorded successfully for ${selectedInvoice.student_name}! Receipt issued.`);
        loadData();

        // Prompt user to view printable receipt
        if (res.data?.payment?.receipt_number) {
          viewReceipt(res.data.payment.receipt_number);
        }
      } else {
        setPaymentError(res.message || 'Failed to record payment.');
      }
    } catch (err: any) {
      setPaymentError(err.response?.data?.message || 'Server error recording payment.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Open Receipt Modal
  const viewReceipt = async (receiptNumberOrId: string) => {
    try {
      const receipt = await eduveraApi.getFeeReceipt(receiptNumberOrId);
      setActiveReceipt(receipt);
      setReceiptModalOpen(true);
    } catch {
      showBanner('Failed to load receipt details', 'error');
    }
  };

  // Add Item to New Invoice
  const handleAddItemToInvoice = () => {
    setNewInvItems([...newInvItems, { fee_category_name: 'Laboratory & STEM', description: '', amount: 150 }]);
  };

  // Remove Item from New Invoice
  const handleRemoveItem = (index: number) => {
    if (newInvItems.length <= 1) return;
    setNewInvItems(newInvItems.filter((_, idx) => idx !== index));
  };

  // Submit Create Invoice
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateInvError('');
    setCreateInvLoading(true);

    try {
      const res = await eduveraApi.createFeeInvoice({
        student_name: newInvStudentName,
        student_roll: newInvStudentRoll,
        student_email: newInvStudentEmail || undefined,
        student_phone: newInvStudentPhone || undefined,
        class_name: newInvClass,
        due_date: newInvDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        discount_amount: Number(newInvDiscount),
        notes: newInvNotes,
        items: newInvItems.map(it => ({
          fee_category_name: it.fee_category_name,
          description: it.description || undefined,
          amount: Number(it.amount),
        })),
      });

      if (res.success) {
        const invNum = res.data?.invoice_number || res.data?.id;
        setIsCreateInvoiceModalOpen(false);
        showBanner(`Invoice ${invNum || ''} created successfully! You can view and print the voucher now.`);
        // Reset form
        setSelectedStudentId('');
        setStudentSearchTerm('');
        setNewInvStudentName('');
        setNewInvStudentRoll('');
        setNewInvStudentEmail('');
        setNewInvStudentPhone('');
        setNewInvDiscount(0);
        setNewInvNotes('');
        setNewInvItems([{ fee_category_name: 'Tuition Fee', description: 'Core Tuition Q1', amount: 900 }]);
        loadData();

        // Immediately open fee voucher for viewing and printing
        if (invNum) {
          viewVoucher(invNum);
        }
      } else {
        setCreateInvError(res.message || 'Failed to create fee invoice.');
      }
    } catch (err: any) {
      setCreateInvError(err.response?.data?.message || 'Server error creating invoice.');
    } finally {
      setCreateInvLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {bannerMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{bannerMsg.text}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Institutional Fee Management</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              RBAC Guarded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time billing, multi-method payment collection, printable receipts, and financial audit logs
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsCreateInvoiceModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Invoice</span>
          </button>

          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Financial Overview KPI Cards with Card Hover Lift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoiced */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Invoiced</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              ${summary ? summary.total_invoiced.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-[11px] font-medium text-blue-600">Active Term</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Term 1 (2024–2025) Cycle</span>
        </div>

        {/* Card 2: Total Collected */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Revenue Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight font-mono">
              ${summary ? summary.total_collected.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> {summary?.collection_rate || '0%'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Real-time ledger sync</span>
        </div>

        {/* Card 3: Pending Receivables */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending Receivables</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
              ${summary ? summary.total_pending.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </span>
            <span className="text-[11px] font-medium text-amber-600">Pending</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Outstanding student dues</span>
        </div>

        {/* Card 4: Overdue Defaulters */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200 cursor-pointer">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Overdue Invoices</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600 tracking-tight font-mono">
              {summary?.overdue_count || 0}
            </span>
            <span className="text-[11px] font-medium text-rose-600">Follow-up</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires cashier follow-up</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('invoices')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            subTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices &amp; Billing Ledger</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px]">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('defaulters')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            subTab === 'defaulters'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Defaulters &amp; Dues</span>
          {defaulters.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
              {defaulters.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('transactions')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            subTab === 'transactions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Audit Ledger</span>
        </button>

        <button
          onClick={() => setSubTab('structures')}
          className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            subTab === 'structures'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Fee Structures &amp; Rates</span>
        </button>
      </div>

      {/* SUB-TAB 1: INVOICES & BILLING LEDGER */}
      {subTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll number, or invoice #..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </form>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
              >
                <option value="All Classes">All Classes</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Student Details</th>
                  <th className="p-3.5">Class</th>
                  <th className="p-3.5">Fee Category</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Paid Amount</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length > 0 ? (
                  invoices.map((inv) => {
                    const bal = inv.balance_amount !== undefined ? inv.balance_amount : (inv.amount - inv.paid_amount);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono font-bold text-blue-600">
                          {inv.invoice_number || `INV-00${inv.id}`}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{inv.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{inv.student_roll || 'ID: G10-01'}</p>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{inv.class}</td>
                        <td className="p-3.5 text-slate-600 max-w-xs truncate">{inv.fee_group}</td>
                        <td className="p-3.5 font-bold text-slate-900 font-mono">${inv.amount.toFixed(2)}</td>
                        <td className="p-3.5 font-semibold text-emerald-600 font-mono">${inv.paid_amount.toFixed(2)}</td>
                        <td className="p-3.5 font-bold font-mono">
                          <span className={bal > 0 ? 'text-amber-700' : 'text-slate-400'}>
                            ${bal.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                          {inv.due_date_formatted || inv.due_date}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inv.status === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : inv.status === 'Overdue'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* View & Print Fee Voucher Button for all invoices */}
                            <button
                              onClick={() => viewVoucher(inv.invoice_number || String(inv.id))}
                              title="View & Print Fee Voucher / Challan"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Voucher</span>
                            </button>

                            {bal > 0 && (
                              <button
                                onClick={() => openCollectModal(inv)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold shadow-2xs transition cursor-pointer"
                              >
                                Collect
                              </button>
                            )}

                            {inv.paid_amount > 0 && (
                              <button
                                onClick={() => viewReceipt(inv.invoice_number || String(inv.id))}
                                title="Print Payment Receipt"
                                className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <Printer className="w-4 h-4 text-emerald-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEFAULTERS & DUES */}
      {subTab === 'defaulters' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-rose-900">Immediate Action Required: Overdue Accounts</h4>
              <p className="text-rose-700 mt-0.5">
                Students listed below have unpaid balances past their grace periods. You can contact guardians directly or record collections.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Class</th>
                  <th className="p-3.5">Guardian Contact</th>
                  <th className="p-3.5">Total Dues</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Days Past Due</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {defaulters.length > 0 ? (
                  defaulters.map((def) => (
                    <tr key={def.invoice_id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-rose-600">{def.invoice_number}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{def.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{def.student_roll}</p>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">{def.class_name}</td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{def.student_phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{def.student_email}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-black text-rose-600 text-sm">
                        ${def.balance_amount.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">{def.due_date}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          {def.days_overdue} days overdue
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => viewVoucher(def.invoice_number || def.invoice_id)}
                            title="View Overdue Fee Voucher"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-rose-600" />
                            <span>Voucher</span>
                          </button>
                          <button
                            onClick={() => {
                              const match = invoices.find((inv) => inv.id === def.invoice_id);
                              if (match) openCollectModal(match);
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                          >
                            Collect Dues
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-emerald-600 font-medium">
                      ✓ No overdue accounts! All student fees are currently up to date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PAYMENT AUDIT LEDGER */}
      {subTab === 'transactions' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Financial Audit Trail &amp; Transaction Ledger
            </h3>
            <span className="text-xs text-slate-500 font-medium">All logged transactions are tamper-evident</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Payment #</th>
                <th className="p-3.5">Receipt #</th>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Amount Paid</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Transaction Ref</th>
                <th className="p-3.5">Cashier / Staff</th>
                <th className="p-3.5">Date &amp; Time</th>
                <th className="p-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{tx.payment_number}</td>
                    <td className="p-3.5 font-mono font-semibold text-blue-600">{tx.receipt_number}</td>
                    <td className="p-3.5 font-mono text-slate-600">{tx.invoice_number}</td>
                    <td className="p-3.5 font-semibold text-slate-900">{tx.student_name}</td>
                    <td className="p-3.5 font-mono font-bold text-emerald-600">${tx.amount_paid.toFixed(2)}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500 text-[11px]">{tx.transaction_reference}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{tx.collected_by}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">{tx.created_at}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => viewReceipt(tx.receipt_number)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SUB-TAB 4: FEE STRUCTURES & RATES */}
      {subTab === 'structures' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div key={cat.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-xs text-slate-500">{cat.description || 'Standard institutional fee category'}</p>
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Allocated Structures:</span>
                  <div className="mt-1.5 space-y-1.5">
                    {structures.filter((s) => s.fee_category_id === cat.id).map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                        <span className="text-slate-700 font-medium">{s.name} ({s.class_name})</span>
                        <span className="font-mono font-bold text-slate-900">${s.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: COLLECT PAYMENT */}
      {isCollectModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Collect Student Fee Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record official payment towards Invoice #{selectedInvoice.invoice_number || selectedInvoice.id}
                </p>
              </div>
              <button
                onClick={() => setIsCollectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {paymentError}
              </div>
            )}

            {/* Student & Balance Overview */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.student_name} ({selectedInvoice.class})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoice Amount:</span>
                <span className="font-mono text-slate-800">${selectedInvoice.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1 mt-1 text-slate-900">
                <span>Outstanding Balance:</span>
                <span className="font-mono text-amber-700">
                  ${(selectedInvoice.balance_amount !== undefined ? selectedInvoice.balance_amount : (selectedInvoice.amount - selectedInvoice.paid_amount)).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.balance_amount !== undefined ? selectedInvoice.balance_amount : (selectedInvoice.amount - selectedInvoice.paid_amount)}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer / Wire</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cheque">Cheque / Demand Draft</option>
                    <option value="Online">Online Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction / Bank Ref
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. TXN-89401"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cashier Notes / Receipt Remarks
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received full settlement at Bursar counter"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCollectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading || paymentAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer flex items-center gap-2"
                >
                  {paymentLoading ? 'Recording...' : 'Confirm & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE */}
      {isCreateInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 my-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Issue Student Fee Invoice</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate an itemized institutional fee bill for an individual student
                </p>
              </div>
              <button
                onClick={() => setIsCreateInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createInvError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {createInvError}
              </div>
            )}

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              {/* Step 1: Select Class / Grade */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    1. Select Class / Grade
                  </label>
                  <span className="text-[10px] text-slate-500">Filters enrolled students automatically</span>
                </div>
                <select
                  value={newInvClass}
                  onChange={(e) => {
                    const c = e.target.value;
                    setNewInvClass(c);
                    setSelectedStudentId('');
                    setStudentSearchTerm('');
                    setNewInvStudentName('');
                    setNewInvStudentRoll('');
                    setNewInvStudentEmail('');
                    setNewInvStudentPhone('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              {/* Step 2: Search & Pick Student in Selected Class */}
              <div className="p-3 bg-blue-50/40 border border-blue-100 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-blue-900">
                    2. Pick Enrolled Student in {newInvClass}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualStudentEntry(!isManualStudentEntry);
                      setSelectedStudentId('');
                    }}
                    className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer"
                  >
                    {isManualStudentEntry ? '← Select from roster' : '+ Or enter custom student'}
                  </button>
                </div>

                {!isManualStudentEntry && (
                  <div className="space-y-2">
                    {/* Student Dropdown Selector */}
                    <div>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => handleSelectStudent(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
                      >
                        <option value="">
                          -- Select student from {newInvClass} ({allStudents.filter((s) => s.class === newInvClass).length} found) --
                        </option>
                        {allStudents
                          .filter((s) => s.class === newInvClass)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} • Roll: {s.roll_no || s.admission_no} {s.section ? `(${s.section})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Instant Search Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={studentSearchTerm}
                        onChange={(e) => {
                          const term = e.target.value;
                          setStudentSearchTerm(term);
                          if (term.trim()) {
                            const found = allStudents.find(
                              (s) =>
                                s.class === newInvClass &&
                                (`${s.first_name} ${s.last_name}`.toLowerCase().includes(term.toLowerCase()) ||
                                  (s.roll_no && s.roll_no.toLowerCase().includes(term.toLowerCase())))
                            );
                            if (found) {
                              handleSelectStudent(String(found.id));
                            }
                          }
                        }}
                        placeholder={`Search student name or roll in ${newInvClass}...`}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Autofilled / Editable Student Information Details */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={newInvStudentName}
                      onChange={(e) => setNewInvStudentName(e.target.value)}
                      placeholder="e.g. Alexander Wright"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Roll Number / ID</label>
                    <input
                      type="text"
                      required
                      value={newInvStudentRoll}
                      onChange={(e) => setNewInvStudentRoll(e.target.value)}
                      placeholder="e.g. 1001"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Guardian Contact Phone</label>
                    <input
                      type="text"
                      value={newInvStudentPhone}
                      onChange={(e) => setNewInvStudentPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Student Email Address</label>
                    <input
                      type="email"
                      value={newInvStudentEmail}
                      onChange={(e) => setNewInvStudentEmail(e.target.value)}
                      placeholder="student@eduvera.school"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Date</label>
                <input
                  type="date"
                  required
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              {/* Dynamic Fee Items List */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Itemized Fee Heads</span>
                  <button
                    type="button"
                    onClick={handleAddItemToInvoice}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Fee Head
                  </button>
                </div>

                {newInvItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <select
                      value={item.fee_category_name}
                      onChange={(e) => {
                        const updated = [...newInvItems];
                        updated[idx].fee_category_name = e.target.value;
                        setNewInvItems(updated);
                      }}
                      className="w-1/3 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-medium"
                    >
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Laboratory & STEM">Lab &amp; STEM</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Library & Digital Resources">Library</option>
                      <option value="Examination & Assessment">Examination</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Description (Optional)"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...newInvItems];
                        updated[idx].description = e.target.value;
                        setNewInvItems(updated);
                      }}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                    />

                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => {
                        const updated = [...newInvItems];
                        updated[idx].amount = parseFloat(e.target.value) || 0;
                        setNewInvItems(updated);
                      }}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-mono font-bold"
                    />

                    {newInvItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Discount / Concession */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scholarship / Concession ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newInvDiscount}
                    onChange={(e) => setNewInvDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-emerald-600 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Guardian Phone (for reminders)
                  </label>
                  <input
                    type="tel"
                    value={newInvStudentPhone}
                    onChange={(e) => setNewInvStudentPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition cursor-pointer flex items-center gap-2"
                >
                  {createInvLoading ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINTABLE OFFICIAL RECEIPT */}
      <PrintableReceiptModal
        isOpen={receiptModalOpen}
        receiptData={activeReceipt}
        onClose={() => setReceiptModalOpen(false)}
      />

      {/* MODAL: PRINTABLE / VIEWABLE FEE VOUCHER (FOR ANY INVOICE) */}
      <PrintableFeeVoucherModal
        isOpen={voucherModalOpen}
        voucherData={activeVoucher}
        onClose={() => setVoucherModalOpen(false)}
        onPayNow={() => {
          setVoucherModalOpen(false);
          if (activeVoucher) {
            const match = invoices.find((inv) => inv.invoice_number === activeVoucher.voucher.voucher_number);
            if (match) openCollectModal(match);
          }
        }}
      />
    </div>
  );
};
