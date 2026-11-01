<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeInvoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'student_name',
        'student_roll',
        'student_email',
        'student_phone',
        'class_name',
        'academic_year',
        'subtotal',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'due_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(FeeInvoiceItem::class, 'invoice_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FeePayment::class, 'invoice_id');
    }

    /**
     * Recompute and update invoice payment totals & status
     */
    public function recalculateStatus(): void
    {
        $paid = $this->payments()->sum('amount_paid');
        $this->paid_amount = $paid;
        $this->balance_amount = max(0, $this->total_amount - $paid);

        if ($this->balance_amount <= 0) {
            $this->status = 'Paid';
        } elseif ($this->paid_amount > 0) {
            $this->status = 'Partial';
        } else {
            // Check overdue
            if ($this->due_date && $this->due_date < now()->startOfDay()) {
                $this->status = 'Overdue';
            } else {
                $this->status = 'Unpaid';
            }
        }

        $this->save();
    }
}
