'use client';

import React from 'react';
import Image from 'next/image';
import { FeeReceiptData } from '../../types';
import { Printer, X, CheckCircle2, Building, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

interface PrintableReceiptModalProps {
  isOpen: boolean;
  receiptData: FeeReceiptData | null;
  onClose: () => void;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  isOpen,
  receiptData,
  onClose,
}) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const { institution, receipt, student, invoice } = receiptData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-fade-in">
        {/* Top Control Bar (Screen only, hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold text-slate-800">Official Fee Receipt Voucher</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-8 sm:p-10 font-sans text-slate-800 space-y-6" id="printable-voucher">
          {/* Institution Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                  <Image
                    src="/images/eduvera-icon-square.png"
                    alt="Eduvera"
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    {institution.name}
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">{institution.tagline}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                {institution.address} • Tel: {institution.phone} • {institution.email}
              </p>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-0 border-slate-200">
              <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold text-xs uppercase tracking-wider mb-1">
                Payment Receipt
              </span>
              <p className="text-xs font-mono font-bold text-slate-900">#{receipt.receipt_number}</p>
              <p className="text-[10px] text-slate-500">Date: {receipt.date}</p>
            </div>
          </div>

          {/* Student & Invoice Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Student Name</span>
              <span className="font-bold text-slate-900">{student.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Roll No / ID</span>
              <span className="font-bold text-slate-900 font-mono">{student.roll_number}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Class / Grade</span>
              <span className="font-bold text-slate-900">{student.class}</span>
            </div>
            <div>
              <span className="text-[10px] font-medium text-slate-500 block uppercase tracking-wider">Academic Year</span>
              <span className="font-bold text-slate-900 font-mono">{student.academic_year}</span>
            </div>
          </div>

          {/* Payment Method & Reference Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs border-y border-slate-100 py-3">
            <div>
              <span className="text-[10px] text-slate-500 block">Payment Mode</span>
              <span className="font-semibold text-slate-900">{receipt.payment_method}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Transaction Reference</span>
              <span className="font-mono text-slate-800">{receipt.transaction_reference}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Collected By</span>
              <span className="font-medium text-slate-800">{receipt.collected_by}</span>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Fee Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{item.category}</td>
                      <td className="p-3 text-slate-600">{item.description || 'Standard Assessment'}</td>
                      <td className="p-3 text-right font-mono font-medium text-slate-900">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-slate-500">
                      Standard tuition and academic fees
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700">Remarks &amp; Notes:</p>
              <p className="italic text-[11px]">{receipt.notes}</p>
              <p className="text-[10px] text-slate-400 pt-2">
                This is a computer-generated institutional fee acknowledgment. Official receipt of payment.
              </p>
            </div>

            <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Gross Subtotal:</span>
                <span className="font-mono">${invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Concession / Discount:</span>
                  <span className="font-mono">-${invoice.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Net Total Due:</span>
                <span className="font-mono">${invoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700 bg-emerald-100/60 p-2 rounded-lg border border-emerald-200">
                <span>Amount Paid This Txn:</span>
                <span className="font-mono">${receiptData.invoice.amount_paid_this_txn.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 text-[11px]">
                <span>Remaining Balance:</span>
                <span className={`font-mono font-bold ${invoice.remaining_balance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                  ${invoice.remaining_balance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Official Stamp */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div>
              <div className="w-32 border-b border-slate-400 mb-1"></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Student / Guardian Sign</p>
            </div>

            <div className="text-right">
              <div className="inline-block border-2 border-emerald-600 text-emerald-700 px-3 py-1 rounded-lg font-black tracking-widest text-[10px] uppercase rotate-[-4deg] mb-2">
                ✓ VERIFIED PAID
              </div>
              <div className="w-36 border-b border-slate-400 mb-1 ml-auto"></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Bursar / Cashier Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
