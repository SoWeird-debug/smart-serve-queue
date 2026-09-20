<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('psgc_code')->nullable()->unique();
            $table->timestamps();
        });

        Schema::create('municipalities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('province_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('psgc_code')->nullable()->unique();
            $table->string('postal_code', 12)->nullable();
            $table->timestamps();
            $table->unique(['province_id', 'name']);
        });

        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('municipality_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('psgc_code')->nullable()->unique();
            $table->string('postal_code', 12)->nullable();
            $table->timestamps();
            $table->unique(['municipality_id', 'name']);
        });

        Schema::create('care_areas', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('building')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('care_area_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('duration_minutes');
            $table->unsignedSmallInteger('daily_capacity');
            $table->boolean('follow_up_eligible')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('patient_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained('users')->nullOnDelete();
            $table->string('patient_number')->unique();
            $table->string('family_name');
            $table->string('given_name');
            $table->string('middle_name')->nullable();
            $table->string('suffix', 24)->nullable();
            $table->date('date_of_birth');
            $table->enum('sex', ['male', 'female', 'other']);
            $table->string('civil_status', 32)->nullable();
            $table->string('nationality', 80)->nullable();
            $table->string('preferred_language', 80)->nullable();
            $table->string('mobile_number', 32)->unique();
            $table->string('alternate_contact', 32)->nullable();
            $table->string('philhealth_client_type', 24)->nullable();
            $table->string('philhealth_pin', 48)->nullable()->index();
            $table->string('philhealth_member_name')->nullable();
            $table->string('philhealth_member_pin', 48)->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_relationship', 80)->nullable();
            $table->string('guardian_contact', 32)->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_relationship', 80)->nullable();
            $table->string('emergency_contact_phone', 32)->nullable();
            $table->boolean('consent_to_treatment')->default(false);
            $table->timestamp('consent_verified_at')->nullable();
            $table->boolean('privacy_acknowledged')->default(false);
            $table->timestamp('privacy_acknowledged_at')->nullable();
            $table->timestamps();
        });

        Schema::create('patient_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_profile_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('barangay_id')->constrained()->restrictOnDelete();
            $table->string('address_line');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('location_accuracy_meters', 10, 2)->nullable();
            $table->string('location_source', 48)->nullable();
            $table->timestamp('location_verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_profile_id')->constrained()->restrictOnDelete();
            $table->foreignId('service_id')->constrained()->restrictOnDelete();
            $table->foreignId('care_area_id')->constrained()->restrictOnDelete();
            $table->foreignId('parent_appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->date('appointment_date')->index();
            $table->string('time_slot', 48)->nullable();
            $table->enum('visit_type', ['scheduled', 'walk_in', 'follow_up']);
            $table->enum('attendance_status', ['pending', 'present', 'absent'])->default('pending');
            $table->enum('status', ['scheduled', 'waiting_for_triage', 'triage', 'waiting_for_doctor', 'called', 'in_consultation', 'completed', 'no_show', 'skipped', 'cancelled'])->default('scheduled');
            $table->text('visit_reason')->nullable();
            $table->string('follow_up_type')->nullable();
            $table->text('follow_up_reason')->nullable();
            $table->unsignedTinyInteger('follow_up_number')->nullable();
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('triaged_at')->nullable();
            $table->timestamps();
            $table->index(['care_area_id', 'appointment_date', 'status']);
        });

        Schema::create('queue_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('care_area_id')->constrained()->restrictOnDelete();
            $table->date('queue_date');
            $table->unsignedTinyInteger('queue_number');
            // NULL releases the number after a terminal status; MySQL permits
            // many NULL values in this unique key, allowing safe daily reuse.
            $table->unsignedTinyInteger('active_queue_number')->nullable();
            $table->enum('priority', ['normal', 'priority', 'urgent', 'emergency'])->default('normal');
            $table->timestamp('entered_queue_at');
            $table->timestamp('called_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->unique(['care_area_id', 'queue_date', 'active_queue_number'], 'active_daily_queue_number_unique');
        });

        Schema::create('triage_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('nurse_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('blood_pressure', 32)->nullable();
            $table->string('temperature', 32)->nullable();
            $table->string('pulse_respiratory', 64)->nullable();
            $table->text('allergies')->nullable();
            $table->text('chief_complaint')->nullable();
            $table->enum('priority', ['normal', 'priority', 'urgent', 'emergency']);
            $table->json('animal_exposure')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->restrictOnDelete();
            $table->text('diagnosis');
            $table->longText('clinical_notes')->nullable();
            $table->timestamp('consulted_at');
            $table->timestamps();
        });

        Schema::create('consultation_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->date('follow_up_date');
            $table->string('type');
            $table->text('reason')->nullable();
            $table->timestamps();
        });

        Schema::create('medicine_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('strength', 80)->nullable();
            $table->string('form', 48);
            $table->enum('category', ['medicine', 'vaccine', 'immunoglobulin', 'supply'])->default('medicine');
            $table->unsignedInteger('reorder_level')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['name', 'strength', 'form']);
        });

        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_item_id')->constrained()->restrictOnDelete();
            $table->foreignId('care_area_id')->nullable()->constrained()->nullOnDelete();
            $table->string('batch_number', 100);
            $table->date('expiry_date')->nullable();
            $table->string('supplier')->nullable();
            $table->string('delivery_reference')->nullable();
            $table->unsignedInteger('quantity_received')->default(0);
            $table->unsignedInteger('quantity_on_hand')->default(0);
            $table->timestamps();
            $table->unique(['medicine_item_id', 'care_area_id', 'batch_number'], 'inventory_batch_area_unique');
            $table->index(['medicine_item_id', 'expiry_date']);
        });

        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('status', ['prescribed', 'ready_for_pickup', 'partially_dispensed', 'dispensed'])->default('prescribed');
            $table->timestamps();
        });

        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('medicine_item_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity_prescribed');
            $table->unsignedInteger('quantity_dispensed')->default(0);
            $table->text('instructions')->nullable();
            $table->timestamps();
            $table->unique(['prescription_id', 'medicine_item_id']);
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_batch_id')->constrained()->restrictOnDelete();
            $table->foreignId('prescription_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['stock_in', 'dispense', 'adjustment', 'expired']);
            $table->integer('quantity_change');
            $table->text('notes')->nullable();
            $table->timestamp('transacted_at');
            $table->timestamps();
        });

        Schema::create('animal_bite_cases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->unique()->constrained()->cascadeOnDelete();
            $table->enum('exposure_category', ['category_i', 'category_ii', 'category_iii', 'pending_classification'])->default('pending_classification');
            $table->enum('vaccine_plan', ['pep', 'not_ordered', 'refer'])->default('pep');
            $table->enum('rabies_immunoglobulin_status', ['assess', 'indicated', 'not_indicated', 'given_or_referred'])->default('assess');
            $table->enum('tetanus_protection_status', ['assess', 'indicated', 'not_indicated', 'given_or_referred'])->default('assess');
            $table->text('protocol_note')->nullable();
            $table->timestamps();
        });

        Schema::create('animal_bite_vaccine_doses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('animal_bite_case_id')->constrained()->cascadeOnDelete();
            $table->foreignId('medicine_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('inventory_batch_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedTinyInteger('dose_number');
            $table->date('scheduled_for');
            $table->timestamp('administered_at')->nullable();
            $table->string('administration_site', 80)->nullable();
            $table->enum('status', ['scheduled', 'administered', 'missed', 'cancelled'])->default('scheduled');
            $table->timestamps();
            $table->unique(['animal_bite_case_id', 'dose_number']);
        });

        Schema::create('patient_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_profile_id')->constrained()->cascadeOnDelete();
            $table->string('type', 24);
            $table->string('title');
            $table->text('message');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('patient_notifications');
        Schema::dropIfExists('animal_bite_vaccine_doses');
        Schema::dropIfExists('animal_bite_cases');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('inventory_batches');
        Schema::dropIfExists('medicine_items');
        Schema::dropIfExists('consultation_follow_ups');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('triage_records');
        Schema::dropIfExists('queue_tickets');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('patient_addresses');
        Schema::dropIfExists('patient_profiles');
        Schema::dropIfExists('services');
        Schema::dropIfExists('care_areas');
        Schema::dropIfExists('barangays');
        Schema::dropIfExists('municipalities');
        Schema::dropIfExists('provinces');
    }
};
