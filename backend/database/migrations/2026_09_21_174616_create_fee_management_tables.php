<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Fee Categories (Tuition, Lab, Transport, Library, Exam, etc.)
        Schema::create('fee_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Fee Structures (Class-wise fee pricing rules)
        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_category_id')->constrained('fee_categories')->onDelete('cascade');
            $table->string('name');
            $table->string('class_name')->default('All Classes');
            $table->decimal('amount', 10, 2);
            $table->string('frequency')->default('Term'); // Monthly, Quarterly, Term, Annual, One-time
            $table->string('academic_year')->default('2024-2025');
            $table->timestamps();
        });

        // 3. Fee Discounts / Concessions
        Schema::create('fee_discounts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique()->nullable();
            $table->enum('discount_type', ['percentage', 'fixed'])->default('fixed');
            $table->decimal('value', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Student Fee Invoices
        Schema::create('fee_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('student_name');
            $table->string('student_roll');
            $table->string('student_email')->nullable();
            $table->string('student_phone')->nullable();
            $table->string('class_name');
            $table->string('academic_year')->default('2024-2025');
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0.00);
            $table->decimal('balance_amount', 10, 2);
            $table->date('due_date');
            $table->enum('status', ['Unpaid', 'Partial', 'Paid', 'Overdue', 'Cancelled'])->default('Unpaid');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 5. Fee Invoice Items (Itemized breakdown per invoice)
        Schema::create('fee_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('fee_invoices')->onDelete('cascade');
            $table->string('fee_category_name');
            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->timestamps();
        });

        // 6. Fee Payments & Official Receipts
        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->string('receipt_number')->unique();
            $table->foreignId('invoice_id')->constrained('fee_invoices')->onDelete('cascade');
            $table->decimal('amount_paid', 10, 2);
            $table->date('payment_date');
            $table->string('payment_method')->default('Cash'); // Cash, Bank Transfer, Card, Cheque, Online
            $table->string('transaction_reference')->nullable();
            $table->string('collected_by_name')->default('Finance Department');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
        Schema::dropIfExists('fee_invoice_items');
        Schema::dropIfExists('fee_invoices');
        Schema::dropIfExists('fee_discounts');
        Schema::dropIfExists('fee_structures');
        Schema::dropIfExists('fee_categories');
    }
};
