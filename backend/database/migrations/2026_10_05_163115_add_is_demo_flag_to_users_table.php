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
        if (!Schema::hasColumn('users', 'is_demo')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_demo')->default(false)->after('role');
            });
        }

        if (!Schema::hasColumn('students', 'is_demo')) {
            Schema::table('students', function (Blueprint $table) {
                $table->boolean('is_demo')->default(false)->after('status');
            });
        }

        // Mark existing seeded demo users and demo students
        \Illuminate\Support\Facades\DB::table('users')
            ->where('email', 'like', '%@eduvera.school')
            ->update(['is_demo' => true]);

        \Illuminate\Support\Facades\DB::table('students')
            ->update(['is_demo' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_demo')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_demo');
            });
        }

        if (Schema::hasColumn('students', 'is_demo')) {
            Schema::table('students', function (Blueprint $table) {
                $table->dropColumn('is_demo');
            });
        }
    }
};
