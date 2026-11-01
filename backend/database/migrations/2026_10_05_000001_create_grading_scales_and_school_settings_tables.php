<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. School & Institution Settings Table
        if (!Schema::hasTable('school_settings')) {
            Schema::create('school_settings', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }

        // 2. Configurable Grading Scales Table
        if (!Schema::hasTable('grading_scales')) {
            Schema::create('grading_scales', function (Blueprint $table) {
                $table->id();
                $table->string('system_type')->default('percentage'); // 'percentage' or 'gpa'
                $table->string('grade', 10);                           // 'A+', 'A', 'B', 'C', 'Fail' / 'F'
                $table->decimal('min_percentage', 5, 2);              // e.g. 80.00, 70.00, 60.00, 50.00, 0.00
                $table->decimal('max_percentage', 5, 2);              // e.g. 100.00, 79.99, 69.99, 59.99, 49.99
                $table->decimal('gpa_point', 3, 2)->default(0.00);     // e.g. 4.00, 3.50, 3.00, 2.00, 0.00
                $table->string('label')->nullable();                  // Description / Division
                $table->boolean('is_pass')->default(true);
                $table->integer('order_index')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // Seed default school settings: Percentage-based system for Pakistani schools
        DB::table('school_settings')->updateOrInsert(
            ['key' => 'grading_system'],
            ['value' => 'percentage', 'created_at' => now(), 'updated_at' => now()]
        );

        // Seed Default Pakistani Percentage Grading Scale:
        // Over 80% -> A+
        // 70% to 79% -> A
        // 60% to 69% -> B
        // 50% to 59% -> C
        // Below 50% -> Fail
        $pakistaniRules = [
            [
                'system_type' => 'percentage',
                'grade' => 'A+',
                'min_percentage' => 80.00,
                'max_percentage' => 100.00,
                'gpa_point' => 4.00,
                'label' => 'Outstanding (Distinction)',
                'is_pass' => true,
                'order_index' => 1,
            ],
            [
                'system_type' => 'percentage',
                'grade' => 'A',
                'min_percentage' => 70.00,
                'max_percentage' => 79.99,
                'gpa_point' => 3.50,
                'label' => 'Excellent (1st Division)',
                'is_pass' => true,
                'order_index' => 2,
            ],
            [
                'system_type' => 'percentage',
                'grade' => 'B',
                'min_percentage' => 60.00,
                'max_percentage' => 69.99,
                'gpa_point' => 3.00,
                'label' => 'Very Good (1st Division)',
                'is_pass' => true,
                'order_index' => 3,
            ],
            [
                'system_type' => 'percentage',
                'grade' => 'C',
                'min_percentage' => 50.00,
                'max_percentage' => 59.99,
                'gpa_point' => 2.00,
                'label' => 'Good (2nd Division)',
                'is_pass' => true,
                'order_index' => 4,
            ],
            [
                'system_type' => 'percentage',
                'grade' => 'Fail',
                'min_percentage' => 0.00,
                'max_percentage' => 49.99,
                'gpa_point' => 0.00,
                'label' => 'Fail (Below 50%)',
                'is_pass' => false,
                'order_index' => 5,
            ],
        ];

        foreach ($pakistaniRules as $rule) {
            DB::table('grading_scales')->updateOrInsert(
                ['system_type' => $rule['system_type'], 'grade' => $rule['grade']],
                array_merge($rule, ['created_at' => now(), 'updated_at' => now()])
            );
        }

        // Seed International GPA Scale (for institutions that toggle to GPA)
        $gpaRules = [
            ['system_type' => 'gpa', 'grade' => 'A+', 'min_percentage' => 90.00, 'max_percentage' => 100.00, 'gpa_point' => 4.00, 'label' => 'Superior', 'is_pass' => true, 'order_index' => 1],
            ['system_type' => 'gpa', 'grade' => 'A', 'min_percentage' => 80.00, 'max_percentage' => 89.99, 'gpa_point' => 3.70, 'label' => 'Excellent', 'is_pass' => true, 'order_index' => 2],
            ['system_type' => 'gpa', 'grade' => 'B', 'min_percentage' => 70.00, 'max_percentage' => 79.99, 'gpa_point' => 3.00, 'label' => 'Good', 'is_pass' => true, 'order_index' => 3],
            ['system_type' => 'gpa', 'grade' => 'C', 'min_percentage' => 60.00, 'max_percentage' => 69.99, 'gpa_point' => 2.00, 'label' => 'Satisfactory', 'is_pass' => true, 'order_index' => 4],
            ['system_type' => 'gpa', 'grade' => 'D', 'min_percentage' => 50.00, 'max_percentage' => 59.99, 'gpa_point' => 1.00, 'label' => 'Passing', 'is_pass' => true, 'order_index' => 5],
            ['system_type' => 'gpa', 'grade' => 'F', 'min_percentage' => 0.00, 'max_percentage' => 49.99, 'gpa_point' => 0.00, 'label' => 'Failing', 'is_pass' => false, 'order_index' => 6],
        ];

        foreach ($gpaRules as $rule) {
            DB::table('grading_scales')->updateOrInsert(
                ['system_type' => $rule['system_type'], 'grade' => $rule['grade']],
                array_merge($rule, ['created_at' => now(), 'updated_at' => now()])
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grading_scales');
        Schema::dropIfExists('school_settings');
    }
};
