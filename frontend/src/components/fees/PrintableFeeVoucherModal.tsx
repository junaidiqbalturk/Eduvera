'use client';

import React from 'react';
import Image from 'next/image';
import { FeeVoucherData } from '../../types';
import { Printer, X, Building, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useTheme } from '@/lib/context/ThemeContext';

interface PrintableFeeVoucherModalProps {
  isOpen: boolean;
  voucherData: FeeVoucherData | null;
  onClose: () => void;
  onPayNow?: () => void;
}

export const PrintableFeeVoucherModal: React.FC<PrintableFeeVoucherModalProps> = ({
  isOpen,
  voucherData,
  onClose,
  onPayNow,
}) => {
  const { schoolLogo, schoolProfile } = useTheme();
  if (!isOpen || !voucherData) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const { institution, bank_details, voucher, student, financials } = voucherData;
  const activeLogo = institution?.logo || schoolLogo;
  const activeName = institution?.name || schoolProfile?.name || 'Eduvera International Academy';
  const activeTagline = institution?.tagline || schoolProfile?.tagline || 'Excellence in Academic Governance & Leadership';
  const activeAddress = institution?.address || schoolProfile?.address || '450 University Way, Suite 100, Academic District';
  const activePhone = institution?.phone || schoolProfile?.phone || '+92 (021) 3582-9011';
  const activeEmail = institution?.email || schoolProfile?.email || 'bursar@eduvera.school';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade-in">
        {/* Top Screen Control Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                voucher.status === 'Paid'
                  ? 'bg-emerald-500'
                  : voucher.status === 'Partial'
                  ? 'bg-amber-500'
                  : voucher.status === 'Overdue'
                  ? 'bg-rose-500'
                  : 'bg-blue-500'
              }`}
            ></span>
            <span className="text-xs font-bold text-slate-800">
              Institutional Fee Challan &amp; Voucher — #{voucher.voucher_number}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {onPayNow && financials.balance_amount > 0 && (
              <button
                onClick={onPayNow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Voucher</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="p-8 sm:p-10 font-sans text-slate-800 space-y-6" id="printable-fee-voucher">
          {/* Institution Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                  {activeLogo ? (
                    <img
                      src={activeLogo}
                      alt={activeName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Image
                      src="/images/eduvera-icon-square.png"
                      alt="Eduvera"
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    {activeName}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">{activeTagline}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                {activeAddress} • Tel: {activePhone} • {activeEmail}
              </p>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-slate-200">
              <span
                className={`inline-block px-3 py-1 rounded-md font-mono font-bold text-xs uppercase tracking-wider mb-1 border ${
                  voucher.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : voucher.status === 'Partial'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : voucher.status === 'Overdue'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-blue-50 text-blue-800 border-blue-300'
                }`}
              >
                FEE VOUCHER • {voucher.status}
              </span>
              <p className="text-xs font-mono font-bold text-slate-900">#{voucher.voucher_number}</p>
              <p className="text-[10px] text-slate-500">Issue Date: {voucher.issue_date}</p>
              <p className="text-[10px] font-bold text-rose-600">Due Date: {voucher.due_date}</p>
            </div>
          </div>

          {/* Student Identification Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Student Full Name</span>
              <span className="font-bold text-slate-900">{student.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Roll No / Student ID</span>
              <span className="font-bold text-slate-900 font-mono">{student.roll_number}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Class / Grade</span>
              <span className="font-bold text-slate-900">{student.class}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Academic Year</span>
              <span className="font-bold text-slate-900 font-mono">{voucher.academic_year}</span>
            </div>
          </div>

          {/* Bank Deposit Account Information */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Building className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-900">{bank_details.bank_name}</p>
                <p className="text-[11px] text-slate-600">
                  Account: <strong className="font-mono">{bank_details.account_number}</strong> ({bank_details.account_name})
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono sm:text-right">
              <p>Branch: {bank_details.branch}</p>
              <p>Routing/SWIFT: {bank_details.routing_swift}</p>
            </div>
          </div>

          {/* Itemized Fee Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Fee Head / Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Payable Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financials.items && financials.items.length > 0 ? (
                  financials.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.description || item.category}</td>
                      <td className="p-3 text-slate-600">{item.category}</td>
                      <td className="p-3 text-right font-mono font-medium text-slate-900">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-slate-500">
                      Standard academic tuition fees
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
            <div className="text-xs text-slate-500 max-w-sm space-y-1.5">
              <p className="font-semibold text-slate-700">Payment Instructions &amp; Policies:</p>
              <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-0.5">
                <li>Fees must be deposited on or before <strong>{voucher.due_date}</strong>.</li>
                <li>Online payments can be made via student portal with reference #{voucher.voucher_number}.</li>
                <li>Late payment fee of $25 per week applies after the specified due date.</li>
              </ul>
              {voucher.notes && (
                <p className="italic text-[11px] text-slate-600 pt-1">Note: {voucher.notes}</p>
              )}
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Gross Subtotal:</span>
                <span className="font-mono">${financials.subtotal.toFixed(2)}</span>
              </div>

              {financials.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Concession / Scholarship:</span>
                  <span className="font-mono">-${financials.discount_amount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Net Total Billed:</span>
                <span className="font-mono">${financials.total_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-emerald-600">
                <span>Total Paid to Date:</span>
                <span className="font-mono font-semibold">${financials.paid_amount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-sm">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">${financials.balance_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History if any payments recorded */}
          {financials.payments && financials.payments.length > 0 && (
            <div className="border-t border-slate-200 pt-4 text-xs">
              <span className="font-bold text-slate-700 block mb-2">Recorded Payment Receipts:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {financials.payments.map((p, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex justify-between items-center text-[11px]">
                    <div>
                      <span className="font-mono font-bold text-emerald-900">Receipt #{p.receipt_number}</span>
                      <span className="block text-slate-500">{p.payment_date} • {p.payment_method}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700">+${p.amount_paid.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification & Signatures */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div>
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Student / Guardian Signature</p>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-mono">Voucher Valid for Academic Session</p>
            </div>

            <div className="text-right">
              <div className="w-36 border-b border-slate-400 mb-1 ml-auto"></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Authorized Bursar Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
