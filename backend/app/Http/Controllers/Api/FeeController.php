<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeCategory;
use App\Models\FeeDiscount;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class FeeController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get Real-time Fee Collection Summary & Financial Analytics
     */
    public function getFeeSummary(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([
                'total_invoiced' => 0,
                'total_collected' => 0,
                'total_pending' => 0,
                'overdue_count' => 0,
                'collection_rate' => '0%',
                'recent_transactions' => [],
            ], 'Fee summary analytics loaded');
        }

        $totalInvoiced = (float) FeeInvoice::where('status', '!=', 'Cancelled')->sum('total_amount');
        $totalCollected = (float) FeePayment::sum('amount_paid');
        $totalPending = (float) FeeInvoice::where('status', '!=', 'Cancelled')->sum('balance_amount');
        $overdueCount = FeeInvoice::where('status', 'Overdue')->count();

        $collectionRate = $totalInvoiced > 0 
            ? round(($totalCollected / $totalInvoiced) * 100, 1) . '%' 
            : '0%';

        $recentPayments = FeePayment::with('invoice')
            ->orderBy('id', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($payment) {
                return [
                    'tx_id' => $payment->payment_number,
                    'receipt_number' => $payment->receipt_number,
                    'student' => $payment->invoice ? $payment->invoice->student_name : 'N/A',
                    'class' => $payment->invoice ? $payment->invoice->class_name : 'N/A',
                    'amount' => '$' . number_format($payment->amount_paid, 2),
                    'method' => $payment->payment_method,
                    'date' => Carbon::parse($payment->payment_date)->format('M d, Y'),
                    'status' => 'Cleared',
                ];
            });

        $summary = [
            'total_invoiced' => $totalInvoiced,
            'total_collected' => $totalCollected,
            'total_pending' => $totalPending,
            'overdue_count' => $overdueCount,
            'collection_rate' => $collectionRate,
            'recent_transactions' => $recentPayments,
        ];

        return $this->successResponse($summary, 'Fee summary analytics loaded');
    }

    /**
     * Get Fee Invoices list with filtering and search
     */
    public function getInvoices(Request $request): JsonResponse
    {
        $user = $this->resolveAuthUser($request);
        $isDemo = $user && $user->is_demo;

        if (!$isDemo) {
            return $this->successResponse([], 'Fee invoices retrieved');
        }

        $query = FeeInvoice::with(['items', 'payments'])->orderBy('id', 'desc');

        // Status filter
        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('status', $request->status);
        }

        // Class filter
        if ($request->filled('class_name') && $request->class_name !== 'All Classes') {
            $query->where('class_name', $request->class_name);
        }

        // Search by student name, roll, or invoice number
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('student_name', 'like', "%{$search}%")
                  ->orWhere('student_roll', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%");
            });
        }

        $invoices = $query->get()->map(function ($inv) {
            $dueDate = Carbon::parse($inv->due_date);
            $isOverdue = $dueDate->isPast() && $inv->balance_amount > 0;

            return [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'student_name' => $inv->student_name,
                'student_roll' => $inv->student_roll,
                'student_email' => $inv->student_email,
                'student_phone' => $inv->student_phone,
                'class' => $inv->class_name,
                'academic_year' => $inv->academic_year,
                'subtotal' => (float) $inv->subtotal,
                'discount_amount' => (float) $inv->discount_amount,
                'amount' => (float) $inv->total_amount,
                'paid_amount' => (float) $inv->paid_amount,
                'balance_amount' => (float) $inv->balance_amount,
                'due_date' => $dueDate->format('Y-m-d'),
                'due_date_formatted' => $dueDate->format('M d, Y'),
                'is_overdue' => $isOverdue,
                'days_overdue' => $isOverdue ? Carbon::now()->diffInDays($dueDate) : 0,
                'status' => $inv->status,
                'fee_group' => $inv->items->pluck('fee_category_name')->unique()->join(', ') ?: 'Standard Fee',
                'payment_method' => $inv->payments->last() ? $inv->payments->last()->payment_method : '-',
                'items_count' => $inv->items->count(),
                'payments_count' => $inv->payments->count(),
            ];
        });

        return $this->successResponse($invoices, 'Fee invoices list loaded');
    }

    /**
     * Show single invoice with full details
     */
    public function showInvoice(int $id): JsonResponse
    {
        $invoice = FeeInvoice::with(['items', 'payments'])->find($id);

        if (!$invoice) {
            return $this->errorResponse('Invoice not found', 404);
        }

        return $this->successResponse($invoice, 'Invoice loaded successfully');
    }

    /**
     * Create a new student fee invoice
     */
    public function createInvoice(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'student_name' => 'required|string|max:255',
            'student_roll' => 'required|string|max:50',
            'class_name' => 'required|string|max:100',
            'due_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.fee_category_name' => 'required|string|max:150',
            'items.*.amount' => 'required|numeric|min:0.01',
            'discount_amount' => 'nullable|numeric|min:0',
            'student_email' => 'nullable|email',
            'student_phone' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $items = $request->items;
        $subtotal = collect($items)->sum('amount');
        $discount = (float) ($request->discount_amount ?? 0);
        $total = max(0, $subtotal - $discount);

        $nextId = (FeeInvoice::max('id') ?? 0) + 1;
        $invoiceNumber = 'INV-2025-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

        DB::beginTransaction();
        try {
            $invoice = FeeInvoice::create([
                'invoice_number' => $invoiceNumber,
                'student_name' => $request->student_name,
                'student_roll' => $request->student_roll,
                'student_email' => $request->student_email,
                'student_phone' => $request->student_phone,
                'class_name' => $request->class_name,
                'academic_year' => $request->academic_year ?? '2024-2025',
                'subtotal' => $subtotal,
                'discount_amount' => $discount,
                'total_amount' => $total,
                'paid_amount' => 0.00,
                'balance_amount' => $total,
                'due_date' => $request->due_date,
                'status' => 'Unpaid',
                'notes' => $request->notes,
            ]);

            foreach ($items as $item) {
                FeeInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_category_name' => $item['fee_category_name'],
                    'description' => $item['description'] ?? null,
                    'amount' => $item['amount'],
                ]);
            }

            DB::commit();

            return $this->successResponse(
                $invoice->load('items'),
                "Invoice {$invoiceNumber} created successfully",
                201
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create invoice: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Collect full or partial payment on an invoice
     */
    public function collectPayment(Request $request, int $id): JsonResponse
    {
        $invoice = FeeInvoice::find($id);
        if (!$invoice) {
            return $this->errorResponse('Invoice not found', 404);
        }

        if ($invoice->balance_amount <= 0 || $invoice->status === 'Paid') {
            return $this->errorResponse('This invoice is already fully paid.', 400);
        }

        $validator = Validator::make($request->all(), [
            'amount_paid' => 'required|numeric|min:0.01|max:' . $invoice->balance_amount,
            'payment_method' => 'required|string|in:Cash,Bank Transfer,Card,Cheque,Online',
            'payment_date' => 'nullable|date',
            'transaction_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $nextPayId = (FeePayment::max('id') ?? 0) + 1;
        $paymentNumber = 'PAY-2025-' . str_pad($nextPayId, 4, '0', STR_PAD_LEFT);
        $receiptNumber = 'RCP-2025-' . str_pad($nextPayId, 4, '0', STR_PAD_LEFT);

        // Determine cashier from user token or default
        $user = $request->user();
        $cashierName = $user ? $user->name : 'Finance Department';

        DB::beginTransaction();
        try {
            $payment = FeePayment::create([
                'payment_number' => $paymentNumber,
                'receipt_number' => $receiptNumber,
                'invoice_id' => $invoice->id,
                'amount_paid' => $request->amount_paid,
                'payment_date' => $request->payment_date ?? Carbon::now()->toDateString(),
                'payment_method' => $request->payment_method,
                'transaction_reference' => $request->transaction_reference,
                'collected_by_name' => $cashierName,
                'notes' => $request->notes,
            ]);

            $invoice->recalculateStatus();

            DB::commit();

            return $this->successResponse([
                'payment' => $payment,
                'invoice' => $invoice->fresh(['items', 'payments']),
            ], "Payment recorded successfully. Receipt {$receiptNumber} issued.");
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to record payment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get Printable / Viewable Fee Voucher payload for ANY invoice (Unpaid, Partial, or Paid)
     */
    public function getVoucher(string $idOrInvoiceNumber): JsonResponse
    {
        $invoice = FeeInvoice::with(['items', 'payments'])
            ->where('invoice_number', $idOrInvoiceNumber)
            ->orWhere('id', is_numeric($idOrInvoiceNumber) ? (int) $idOrInvoiceNumber : 0)
            ->first();

        if (!$invoice) {
            return $this->errorResponse('Invoice voucher not found', 404);
        }

        $schoolName = \App\Models\SchoolSetting::get('school_name', 'Eduvera International Academy');
        $schoolTagline = \App\Models\SchoolSetting::get('school_tagline', 'Excellence in Academic Governance & Leadership');
        $schoolAddress = \App\Models\SchoolSetting::get('school_address', '450 University Way, Suite 100, Academic District');
        $schoolPhone = \App\Models\SchoolSetting::get('school_phone', '+92 (021) 3582-9011');
        $schoolEmail = \App\Models\SchoolSetting::get('school_email', 'bursar@eduvera.school');
        $schoolLogo = \App\Models\SchoolSetting::get('school_logo', null);

        $voucherData = [
            'institution' => [
                'name' => $schoolName,
                'tagline' => $schoolTagline,
                'address' => $schoolAddress,
                'phone' => $schoolPhone,
                'email' => $schoolEmail,
                'logo' => $schoolLogo,
                'tax_id' => 'EDU-TX-984210',
            ],
            'bank_details' => [
                'bank_name' => 'First National Institutional Bank',
                'account_name' => 'Eduvera International Academy - Tuition Ledger',
                'account_number' => '9042-8819-2041',
                'routing_swift' => 'FNIBUS33',
                'branch' => 'Campus Branch #04',
            ],
            'voucher' => [
                'voucher_number' => $invoice->invoice_number,
                'issue_date' => Carbon::parse($invoice->created_at)->format('F d, Y'),
                'due_date' => Carbon::parse($invoice->due_date)->format('F d, Y'),
                'is_overdue' => Carbon::parse($invoice->due_date)->isPast() && $invoice->balance_amount > 0,
                'status' => $invoice->status,
                'academic_year' => $invoice->academic_year,
                'notes' => $invoice->notes ?: 'Please deposit before the due date to avoid late clearance charges.',
            ],
            'student' => [
                'name' => $invoice->student_name,
                'roll_number' => $invoice->student_roll,
                'class' => $invoice->class_name,
                'email' => $invoice->student_email ?: 'N/A',
                'phone' => $invoice->student_phone ?: 'N/A',
            ],
            'financials' => [
                'subtotal' => (float) $invoice->subtotal,
                'discount_amount' => (float) $invoice->discount_amount,
                'total_amount' => (float) $invoice->total_amount,
                'paid_amount' => (float) $invoice->paid_amount,
                'balance_amount' => (float) $invoice->balance_amount,
                'items' => $invoice->items->map(fn($item) => [
                    'category' => $item->fee_category_name,
                    'description' => $item->description,
                    'amount' => (float) $item->amount,
                ]),
                'payments' => $invoice->payments->map(fn($p) => [
                    'payment_number' => $p->payment_number,
                    'receipt_number' => $p->receipt_number,
                    'amount_paid' => (float) $p->amount_paid,
                    'payment_method' => $p->payment_method,
                    'payment_date' => Carbon::parse($p->payment_date)->format('M d, Y'),
                    'transaction_reference' => $p->transaction_reference,
                ]),
            ],
        ];

        return $this->successResponse($voucherData, 'Fee voucher retrieved successfully');
    }

    /**
     * Get Printable Official Receipt payload
     */
    public function getReceipt(string $receiptOrPaymentNumber): JsonResponse
    {
        $payment = FeePayment::with(['invoice.items'])
            ->where('receipt_number', $receiptOrPaymentNumber)
            ->orWhere('payment_number', $receiptOrPaymentNumber)
            ->orWhere('id', is_numeric($receiptOrPaymentNumber) ? (int) $receiptOrPaymentNumber : 0)
            ->first();

        if (!$payment) {
            return $this->errorResponse('Payment receipt not found', 404);
        }

        $invoice = $payment->invoice;

        $schoolName = \App\Models\SchoolSetting::get('school_name', 'Eduvera International Academy');
        $schoolTagline = \App\Models\SchoolSetting::get('school_tagline', 'Excellence in Academic Governance & Leadership');
        $schoolAddress = \App\Models\SchoolSetting::get('school_address', '450 University Way, Suite 100, Academic District');
        $schoolPhone = \App\Models\SchoolSetting::get('school_phone', '+92 (021) 3582-9011');
        $schoolEmail = \App\Models\SchoolSetting::get('school_email', 'bursar@eduvera.school');
        $schoolLogo = \App\Models\SchoolSetting::get('school_logo', null);

        $receiptData = [
            'institution' => [
                'name' => $schoolName,
                'tagline' => $schoolTagline,
                'address' => $schoolAddress,
                'phone' => $schoolPhone,
                'email' => $schoolEmail,
                'logo' => $schoolLogo,
                'tax_id' => 'EDU-TX-984210',
            ],
            'receipt' => [
                'receipt_number' => $payment->receipt_number,
                'payment_number' => $payment->payment_number,
                'date' => Carbon::parse($payment->payment_date)->format('F d, Y'),
                'payment_method' => $payment->payment_method,
                'transaction_reference' => $payment->transaction_reference ?: 'N/A',
                'collected_by' => $payment->collected_by_name,
                'notes' => $payment->notes ?: 'Official institutional payment acknowledgment',
            ],
            'student' => [
                'name' => $invoice->student_name,
                'roll_number' => $invoice->student_roll,
                'class' => $invoice->class_name,
                'academic_year' => $invoice->academic_year,
                'email' => $invoice->student_email,
                'phone' => $invoice->student_phone,
            ],
            'invoice' => [
                'invoice_number' => $invoice->invoice_number,
                'due_date' => Carbon::parse($invoice->due_date)->format('F d, Y'),
                'subtotal' => (float) $invoice->subtotal,
                'discount_amount' => (float) $invoice->discount_amount,
                'total_amount' => (float) $invoice->total_amount,
                'amount_paid_this_txn' => (float) $payment->amount_paid,
                'cumulative_paid' => (float) $invoice->paid_amount,
                'remaining_balance' => (float) $invoice->balance_amount,
                'status' => $invoice->status,
                'items' => $invoice->items->map(fn($item) => [
                    'category' => $item->fee_category_name,
                    'description' => $item->description,
                    'amount' => (float) $item->amount,
                ]),
            ],
        ];

        return $this->successResponse($receiptData, 'Receipt details retrieved');
    }

    /**
     * Get Fee Structures and Categories
     */
    public function getStructures(): JsonResponse
    {
        $categories = FeeCategory::where('is_active', true)->get();
        $structures = FeeStructure::with('category')->get();
        $discounts = FeeDiscount::where('is_active', true)->get();

        return $this->successResponse([
            'categories' => $categories,
            'structures' => $structures,
            'discounts' => $discounts,
        ], 'Fee structures and categories loaded');
    }

    /**
     * Create Fee Structure
     */
    public function createStructure(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'fee_category_id' => 'required|exists:fee_categories,id',
            'name' => 'required|string|max:200',
            'class_name' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'frequency' => 'required|string|in:Monthly,Quarterly,Term,Annual,One-time',
            'academic_year' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first(), 422);
        }

        $structure = FeeStructure::create([
            'fee_category_id' => $request->fee_category_id,
            'name' => $request->name,
            'class_name' => $request->class_name,
            'amount' => $request->amount,
            'frequency' => $request->frequency,
            'academic_year' => $request->academic_year ?? '2024-2025',
        ]);

        return $this->successResponse($structure->load('category'), 'Fee structure created successfully', 201);
    }

    /**
     * Get Payment Transactions audit ledger
     */
    public function getTransactions(): JsonResponse
    {
        $payments = FeePayment::with('invoice')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'receipt_number' => $payment->receipt_number,
                    'invoice_number' => $payment->invoice ? $payment->invoice->invoice_number : 'N/A',
                    'student_name' => $payment->invoice ? $payment->invoice->student_name : 'N/A',
                    'student_roll' => $payment->invoice ? $payment->invoice->student_roll : 'N/A',
                    'class_name' => $payment->invoice ? $payment->invoice->class_name : 'N/A',
                    'amount_paid' => (float) $payment->amount_paid,
                    'payment_method' => $payment->payment_method,
                    'payment_date' => Carbon::parse($payment->payment_date)->format('Y-m-d'),
                    'transaction_reference' => $payment->transaction_reference ?: '-',
                    'collected_by' => $payment->collected_by_name,
                    'notes' => $payment->notes,
                    'created_at' => $payment->created_at->format('M d, Y h:i A'),
                ];
            });

        return $this->successResponse($payments, 'Payment transactions ledger loaded');
    }

    /**
     * Get Defaulters (Overdue student invoices)
     */
    public function getDefaulters(): JsonResponse
    {
        $defaulters = FeeInvoice::where('balance_amount', '>', 0)
            ->where(function ($q) {
                $q->where('status', 'Overdue')
                  ->orWhere('due_date', '<', Carbon::now()->startOfDay());
            })
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($inv) {
                $dueDate = Carbon::parse($inv->due_date);
                return [
                    'invoice_id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'student_name' => $inv->student_name,
                    'student_roll' => $inv->student_roll,
                    'class_name' => $inv->class_name,
                    'student_phone' => $inv->student_phone ?: 'No phone registered',
                    'student_email' => $inv->student_email ?: 'No email registered',
                    'total_amount' => (float) $inv->total_amount,
                    'paid_amount' => (float) $inv->paid_amount,
                    'balance_amount' => (float) $inv->balance_amount,
                    'due_date' => $dueDate->format('M d, Y'),
                    'days_overdue' => Carbon::now()->diffInDays($dueDate),
                    'status' => $inv->status,
                ];
            });

        return $this->successResponse($defaulters, 'Overdue defaulters list loaded');
    }
}
