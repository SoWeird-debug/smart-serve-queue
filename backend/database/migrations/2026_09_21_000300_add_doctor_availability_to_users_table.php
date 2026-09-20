<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('doctor_availability', ['available', 'with_patient', 'on_break', 'off_duty', 'on_leave'])
                ->nullable()
                ->after('assigned_care_areas');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('doctor_availability');
        });
    }
};
