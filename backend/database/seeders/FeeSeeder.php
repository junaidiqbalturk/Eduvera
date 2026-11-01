<?php

namespace Database\Seeders;

use App\Models\FeeCategory;
use App\Models\FeeDiscount;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class FeeSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Fee Categories
        $tuitionCat = FeeCategory::firstOrCreate(['name' => 'Tuition Fee'], ['description' => 'Core academic instruction and curriculum delivery', 'is_active' => true]);
        $labCat = FeeCategory::firstOrCreate(['name' => 'Laboratory & STEM'], ['description' => 'Science laboratories, robotics, and computing equipment', 'is_active' => true]);
        $transportCat = FeeCategory::firstOrCreate(['name' => 'Transportation'], ['description' => 'Campus bus transit and shuttle logistics', 'is_active' => true]);
        $libCat = FeeCategory::firstOrCreate(['name' => 'Library & Digital Resources'], ['description' => 'Digital media subscriptions, library books, and LMS', 'is_active' => true]);
        $examCat = FeeCategory::firstOrCreate(['name' => 'Examination & Assessment'], ['description' => 'Term evaluations, standardized test papers, and marksheets', 'is_active' => true]);

        // 2. Fee Structures
        FeeStructure::firstOrCreate(
            ['name' => 'Grade 10 Core Tuition', 'class_name' => 'Grade 10'],
            ['fee_category_id' => $tuitionCat->id, 'amount' => 900.00, 'frequency' => 'Term', 'academic_year' => '2024-2025']
        );
        FeeStructure::firstOrCreate(
            ['name' => 'Grade 10 Lab & Workshop', 'class_name' => 'Grade 10'],
            ['fee_category_id' => $labCat->id, 'amount' => 300.00, 'frequency' => 'Term', 'academic_year' => '2024-2025']
        );
        FeeStructure::firstOrCreate(
            ['name' => 'Grade 11 Core Tuition', 'class_name' => 'Grade 11'],
            ['fee_category_id' => $tuitionCat->id, 'amount' => 950.00, 'frequency' => 'Term', 'academic_year' => '2024-2025']
        );
        FeeStructure::firstOrCreate(
            ['name' => 'Grade 11 STEM & Tech', 'class_name' => 'Grade 11'],
            ['fee_category_id' => $labCat->id, 'amount' => 350.00, 'frequency' => 'Term', 'academic_year' => '2024-2025']
        );
        FeeStructure::firstOrCreate(
            ['name' => 'Grade 12 Core Tuition', 'class_name' => 'Grade 12'],
            ['fee_category_id' => $tuitionCat->id, 'amount' => 1000.00, 'frequency' => 'Term', 'academic_year' => '2024-2025']
        );
        FeeStructure::firstOrCreate(
            ['name' => 'Campus Bus Transit', 'class_name' => 'All Classes'],
            ['fee_category_id' => $transportCat->id, 'amount' => 450.00, 'frequency' => 'Annual', 'academic_year' => '2024-2025']
        );
        FeeStructure::firstOrCreate(
            ['name' => 'Digital Library & Research Access', 'class_name' => 'All Classes'],
            ['fee_category_id' => $libCat->id, 'amount' => 150.00, 'frequency' => 'Annual', 'academic_year' => '2024-2025']
        );

        // 3. Fee Discounts
        FeeDiscount::firstOrCreate(['name' => 'Academic Merit Scholarship'], ['code' => 'MERIT15', 'discount_type' => 'percentage', 'value' => 15.00, 'is_active' => true]);
        FeeDiscount::firstOrCreate(['name' => 'Sibling Sibling Concession'], ['code' => 'SIBLING100', 'discount_type' => 'fixed', 'value' => 100.00, 'is_active' => true]);
        FeeDiscount::firstOrCreate(['name' => 'Institutional Hardship Waiver'], ['code' => 'HARDSHIP200', 'discount_type' => 'fixed', 'value' => 200.00, 'is_active' => true]);

        // 4. Invoices & Payments Seed
        // Invoice 1: Alexander Wright - Paid in full
        $inv1 = FeeInvoice::firstOrCreate(
            ['invoice_number' => 'INV-2025-001'],
            [
                'student_name' => 'Alexander Wright',
                'student_roll' => 'G10-01',
                'student_email' => 'alexander.wright@eduvera.school',
                'student_phone' => '+1 (555) 432-1001',
                'class_name' => 'Grade 10',
                'academic_year' => '2024-2025',
                'subtotal' => 1200.00,
                'discount_amount' => 0.00,
                'total_amount' => 1200.00,
                'paid_amount' => 1200.00,
                'balance_amount' => 0.00,
                'due_date' => Carbon::now()->addDays(15),
                'status' => 'Paid',
                'notes' => 'Q1 Term 1 Academic and Laboratory fees',
            ]
        );
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv1->id, 'fee_category_name' => 'Tuition Fee'], ['description' => 'Term 1 Tuition', 'amount' => 900.00]);
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv1->id, 'fee_category_name' => 'Laboratory & STEM'], ['description' => 'Physics & Chemistry Lab Access', 'amount' => 300.00]);
        FeePayment::firstOrCreate(
            ['payment_number' => 'PAY-2025-001'],
            [
                'receipt_number' => 'RCP-2025-001',
                'invoice_id' => $inv1->id,
                'amount_paid' => 1200.00,
                'payment_date' => Carbon::now()->subDays(2),
                'payment_method' => 'Online',
                'transaction_reference' => 'STRIPE_CH_9823412',
                'collected_by_name' => 'Finance Department',
                'notes' => 'Settled in full via parent portal payment gateway',
            ]
        );

        // Invoice 2: Sophia Martinez - Partial payment
        $inv2 = FeeInvoice::firstOrCreate(
            ['invoice_number' => 'INV-2025-002'],
            [
                'student_name' => 'Sophia Martinez',
                'student_roll' => 'G10-02',
                'student_email' => 'sophia.martinez@eduvera.school',
                'student_phone' => '+1 (555) 432-1002',
                'class_name' => 'Grade 10',
                'academic_year' => '2024-2025',
                'subtotal' => 1200.00,
                'discount_amount' => 0.00,
                'total_amount' => 1200.00,
                'paid_amount' => 600.00,
                'balance_amount' => 600.00,
                'due_date' => Carbon::now()->addDays(20),
                'status' => 'Partial',
                'notes' => 'Installment plan: 50% initial payment received',
            ]
        );
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv2->id, 'fee_category_name' => 'Tuition Fee'], ['description' => 'Term 1 Tuition', 'amount' => 900.00]);
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv2->id, 'fee_category_name' => 'Laboratory & STEM'], ['description' => 'Science & IT Lab Access', 'amount' => 300.00]);
        FeePayment::firstOrCreate(
            ['payment_number' => 'PAY-2025-002'],
            [
                'receipt_number' => 'RCP-2025-002',
                'invoice_id' => $inv2->id,
                'amount_paid' => 600.00,
                'payment_date' => Carbon::now()->subDays(5),
                'payment_method' => 'Bank Transfer',
                'transaction_reference' => 'WIRE_REF_44109',
                'collected_by_name' => 'Marcus Sterling (Finance)',
                'notes' => '1st Installment of 2',
            ]
        );

        // Invoice 3: Liam Johnson - Unpaid
        $inv3 = FeeInvoice::firstOrCreate(
            ['invoice_number' => 'INV-2025-003'],
            [
                'student_name' => 'Liam Johnson',
                'student_roll' => 'G11-04',
                'student_email' => 'liam.johnson@eduvera.school',
                'student_phone' => '+1 (555) 432-1003',
                'class_name' => 'Grade 11',
                'academic_year' => '2024-2025',
                'subtotal' => 1300.00,
                'discount_amount' => 0.00,
                'total_amount' => 1300.00,
                'paid_amount' => 0.00,
                'balance_amount' => 1300.00,
                'due_date' => Carbon::now()->addDays(10),
                'status' => 'Unpaid',
                'notes' => 'Pending fee collection for Grade 11 Term 1',
            ]
        );
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv3->id, 'fee_category_name' => 'Tuition Fee'], ['description' => 'Grade 11 Core Tuition', 'amount' => 950.00]);
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv3->id, 'fee_category_name' => 'Laboratory & STEM'], ['description' => 'STEM & Tech Lab Access', 'amount' => 350.00]);

        // Invoice 4: Emma Watson - Paid with discount
        $inv4 = FeeInvoice::firstOrCreate(
            ['invoice_number' => 'INV-2025-004'],
            [
                'student_name' => 'Emma Watson',
                'student_roll' => 'G12-01',
                'student_email' => 'emma.watson@eduvera.school',
                'student_phone' => '+1 (555) 432-1004',
                'class_name' => 'Grade 12',
                'academic_year' => '2024-2025',
                'subtotal' => 1450.00,
                'discount_amount' => 100.00,
                'total_amount' => 1350.00,
                'paid_amount' => 1350.00,
                'balance_amount' => 0.00,
                'due_date' => Carbon::now()->addDays(5),
                'status' => 'Paid',
                'notes' => 'Includes $100 Sibling Concession applied',
            ]
        );
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv4->id, 'fee_category_name' => 'Tuition Fee'], ['description' => 'Grade 12 Senior Tuition', 'amount' => 1000.00]);
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv4->id, 'fee_category_name' => 'Transportation'], ['description' => 'Campus Bus Transit', 'amount' => 450.00]);
        FeePayment::firstOrCreate(
            ['payment_number' => 'PAY-2025-003'],
            [
                'receipt_number' => 'RCP-2025-003',
                'invoice_id' => $inv4->id,
                'amount_paid' => 1350.00,
                'payment_date' => Carbon::now()->subDays(1),
                'payment_method' => 'Card',
                'transaction_reference' => 'POS_TERM_7718',
                'collected_by_name' => 'Marcus Sterling (Finance)',
                'notes' => 'Point of sale terminal payment at Bursar counter',
            ]
        );

        // Invoice 5: Lucas Vance - Overdue Defaulter
        $inv5 = FeeInvoice::firstOrCreate(
            ['invoice_number' => 'INV-2025-005'],
            [
                'student_name' => 'Lucas Vance',
                'student_roll' => 'G10-09',
                'student_email' => 'lucas.vance@eduvera.school',
                'student_phone' => '+1 (555) 432-1005',
                'class_name' => 'Grade 10',
                'academic_year' => '2024-2025',
                'subtotal' => 1200.00,
                'discount_amount' => 0.00,
                'total_amount' => 1200.00,
                'paid_amount' => 0.00,
                'balance_amount' => 1200.00,
                'due_date' => Carbon::now()->subDays(12), // Overdue by 12 days
                'status' => 'Overdue',
                'notes' => 'Overdue fee alert sent to guardian',
            ]
        );
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv5->id, 'fee_category_name' => 'Tuition Fee'], ['description' => 'Term 1 Tuition', 'amount' => 900.00]);
        FeeInvoiceItem::firstOrCreate(['invoice_id' => $inv5->id, 'fee_category_name' => 'Laboratory & STEM'], ['description' => 'Science & Lab', 'amount' => 300.00]);
    }
}
