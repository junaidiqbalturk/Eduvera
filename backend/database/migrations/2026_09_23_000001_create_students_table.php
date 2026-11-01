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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('admission_no')->unique();
            $table->string('roll_no')->index();
            $table->string('first_name');
            $table->string('last_name');
            $table->enum('gender', ['Male', 'Female', 'Other'])->default('Male');
            $table->date('dob');
            $table->string('blood_group', 10)->nullable();
            $table->string('class_name');
            $table->string('section')->default('Section A');
            $table->enum('status', ['Active', 'Inactive', 'Suspended', 'Transferred', 'Graduated'])->default('Active');
            $table->string('guardian_name');
            $table->string('guardian_relation')->default('Father');
            $table->string('guardian_phone');
            $table->string('guardian_email')->nullable();
            $table->text('address')->nullable();
            $table->date('admission_date');
            $table->string('avatar')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->timestamps();

            $table->index(['class_name', 'section', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
