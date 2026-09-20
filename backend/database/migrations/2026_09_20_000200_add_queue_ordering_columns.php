<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('queue_tickets', function (Blueprint $table) {
            $table->unsignedInteger('queue_sequence')->nullable()->after('queue_number');
            $table->enum('source_visit_type', ['scheduled', 'walk_in', 'follow_up'])
                ->default('scheduled')
                ->after('queue_sequence');
            $table->index(['care_area_id', 'queue_date', 'priority', 'queue_sequence'], 'queue_display_order_index');
        });
    }

    public function down(): void
    {
        Schema::table('queue_tickets', function (Blueprint $table) {
            $table->dropIndex('queue_display_order_index');
            $table->dropColumn(['source_visit_type', 'queue_sequence']);
        });
    }
};
