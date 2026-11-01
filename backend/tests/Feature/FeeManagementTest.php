<?php

namespace Tests\Feature;

use App\Models\FeeCategory;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\User;
use Carbon\Carbon;
use Tests\TestCase;

class FeeManagementTest extends TestCase
{
    protected string $adminToken;
    protected string $financeToken;
    protected string $academicToken;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::where('email', 'admin@eduvera.school')->first();
        $this->adminToken = $admin ? $admin->api_token : '';

        $finance = User::where('email', 'finance@eduvera.school')->first();
        $this->financeToken = $finance ? $finance->api_token : '';

        $academic = User::where('email', 'academic@eduvera.school')->first();
        $this->academicToken = $academic ? $academic->api_token : '';
    }

    /**
     * Test Fee Summary returns real-time metrics
     */
    public function test_fee_summary_returns_aggregated_metrics(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->financeToken)
            ->getJson('/api/v1/fees/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_invoiced',
                    'total_collected',
                    'total_pending',
                    'overdue_count',
                    'collection_rate',
                    'recent_transactions',
                ],
            ]);

        $this->assertGreaterThan(0, $response->json('data.total_invoiced'));
    }

    /**
     * Test Fee Invoices list returns records from MySQL
     */
    public function test_fee_invoices_listing(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->financeToken)
            ->getJson('/api/v1/fees/invoices');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'invoice_number',
                        'student_name',
                        'class',
                        'amount',
                        'paid_amount',
                        'balance_amount',
                        'status',
                    ],
                ],
            ]);
    }

    /**
     * Test Finance user can create an invoice with itemized breakdown
     */
    public function test_finance_user_can_create_invoice(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->financeToken)
            ->postJson('/api/v1/fees/invoices', [
                'student_name' => 'Nathan Drake',
                'student_roll' => 'G10-99',
                'student_email' => 'nathan.drake@eduvera.school',
                'student_phone' => '+1 555-900-9999',
                'class_name' => 'Grade 10',
                'academic_year' => '2024-2025',
                'due_date' => Carbon::now()->addDays(30)->toDateString(),
                'items' => [
                    ['fee_category_name' => 'Tuition Fee', 'description' => 'Tuition Q1', 'amount' => 800.00],
                    ['fee_category_name' => 'Laboratory & STEM', 'description' => 'Robotics Lab', 'amount' => 200.00],
                ],
                'discount_amount' => 50.00,
                'notes' => 'Test student invoice with $50 concession',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'invoice_number', 'total_amount', 'balance_amount'],
            ]);

        $this->assertEquals(950.00, $response->json('data.total_amount'));
        $this->assertEquals(950.00, $response->json('data.balance_amount'));
        $this->assertEquals('Unpaid', $response->json('data.status'));
    }

    /**
     * Test payment collection records payment, generates receipt, and updates invoice
     */
    public function test_payment_collection_and_receipt_generation(): void
    {
        // 1. Create a test invoice
        $invoice = FeeInvoice::create([
            'invoice_number' => 'INV-TEST-' . time(),
            'student_name' => 'Test Student',
            'student_roll' => 'ROLL-TEST-1',
            'class_name' => 'Grade 11',
            'subtotal' => 1000.00,
            'discount_amount' => 0.00,
            'total_amount' => 1000.00,
            'paid_amount' => 0.00,
            'balance_amount' => 1000.00,
            'due_date' => Carbon::now()->addDays(15),
            'status' => 'Unpaid',
        ]);

        // 2. Make a partial payment of $400
        $payResponse = $this->withHeader('Authorization', 'Bearer ' . $this->financeToken)
            ->postJson("/api/v1/fees/invoices/{$invoice->id}/pay", [
                'amount_paid' => 400.00,
                'payment_method' => 'Cash',
                'transaction_reference' => 'CASH-REF-01',
                'notes' => 'Partial cash payment at counter',
            ]);

        $payResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'payment' => ['id', 'payment_number', 'receipt_number', 'amount_paid'],
                    'invoice' => ['id', 'paid_amount', 'balance_amount', 'status'],
                ],
            ]);

        $this->assertEquals(400.00, $payResponse->json('data.invoice.paid_amount'));
        $this->assertEquals(600.00, $payResponse->json('data.invoice.balance_amount'));
        $this->assertEquals('Partial', $payResponse->json('data.invoice.status'));

        $receiptNumber = $payResponse->json('data.payment.receipt_number');

        // 3. Verify printable receipt payload
        $receiptResponse = $this->withHeader('Authorization', 'Bearer ' . $this->financeToken)
            ->getJson("/api/v1/fees/receipts/{$receiptNumber}");

        $receiptResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'institution' => ['name', 'address', 'phone'],
                    'receipt' => ['receipt_number', 'payment_method', 'date'],
                    'student' => ['name', 'roll_number', 'class'],
                    'invoice' => ['invoice_number', 'total_amount', 'remaining_balance'],
                ],
            ]);

        // 4. Pay the remaining $600 to clear the invoice
        $clearResponse = $this->withHeader('Authorization', 'Bearer ' . $this->financeToken)
            ->postJson("/api/v1/fees/invoices/{$invoice->id}/pay", [
                'amount_paid' => 600.00,
                'payment_method' => 'Bank Transfer',
                'transaction_reference' => 'WIRE-FINAL-99',
            ]);

        $clearResponse->assertStatus(200);
        $this->assertEquals(1000.00, $clearResponse->json('data.invoice.paid_amount'));
        $this->assertEquals(0.00, $clearResponse->json('data.invoice.balance_amount'));
        $this->assertEquals('Paid', $clearResponse->json('data.invoice.status'));

        // Clean up
        $invoice->delete();
    }

    /**
     * Test RBAC: Academic role cannot access fees module
     */
    public function test_academic_role_forbidden_from_fee_management(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->academicToken)
            ->getJson('/api/v1/fees/summary');

        $response->assertStatus(403);
    }
}
