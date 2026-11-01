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
        Schema::create('notices', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category')->default('General'); // Academics, Events, Administrative, General, Examination, Sports
            $table->string('posted_by')->default('Administration');
            $table->date('date');
            $table->string('target_audience')->default('All Students & Staff');
            $table->text('content');
            $table->boolean('is_urgent')->default(false);
            $table->boolean('is_active')->default(true);
            $table->date('expiry_date')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'is_urgent', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};
