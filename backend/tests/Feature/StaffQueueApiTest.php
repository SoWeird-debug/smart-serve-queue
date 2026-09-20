<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffQueueApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_front_desk_can_check_in_a_scheduled_patient_and_a_queue_number_is_assigned(): void
    {
        $ids = $this->referenceIds();
        $staff = User::factory()->create([
            'role' => 'front_desk',
            'is_active' => true,
            'assigned_care_areas' => [$ids['care_area_id']],
        ]);
        Sanctum::actingAs($staff, ['front_desk']);
        $appointmentId = $this->createScheduledAppointment($ids);

        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/check-in")
            ->assertCreated()
            ->assertJsonPath('data.queue_number', 1)
            ->assertJsonPath('data.active_queue_number', 1)
            ->assertJsonPath('data.source_visit_type', 'scheduled');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointmentId,
            'attendance_status' => 'present',
            'status' => 'waiting_for_triage',
        ]);
    }

    public function test_front_desk_can_add_an_existing_patient_as_a_walk_in(): void
    {
        $ids = $this->referenceIds();
        $staff = User::factory()->create([
            'role' => 'front_desk',
            'is_active' => true,
            'assigned_care_areas' => [$ids['care_area_id']],
        ]);
        Sanctum::actingAs($staff, ['front_desk']);

        $this->postJson('/api/v1/staff/walk-ins', [
            'patient_lookup' => 'PT-000001',
            'service_id' => $ids['service_id'],
        ])->assertCreated()
            ->assertJsonPath('data.queue_number', 1)
            ->assertJsonPath('data.source_visit_type', 'walk_in');
    }

    public function test_front_desk_can_list_today_scheduled_patients_and_mark_one_absent(): void
    {
        $ids = $this->referenceIds();
        $staff = User::factory()->create([
            'role' => 'front_desk', 'is_active' => true,
            'assigned_care_areas' => [$ids['care_area_id']],
        ]);
        Sanctum::actingAs($staff, ['front_desk']);
        $appointmentId = $this->createScheduledAppointment($ids);

        $this->getJson("/api/v1/staff/appointments/scheduled?care_area_id={$ids['care_area_id']}")
            ->assertOk()
            ->assertJsonPath('data.0.id', $appointmentId)
            ->assertJsonPath('data.0.patient_number', 'PT-000001');

        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/absent")
            ->assertOk();

        $this->assertDatabaseHas('appointments', [
            'id' => $appointmentId, 'attendance_status' => 'absent', 'status' => 'no_show',
        ]);
    }

    public function test_nurse_can_complete_triage_and_send_patient_to_doctor_queue(): void
    {
        $ids = $this->referenceIds();
        $frontDesk = User::factory()->create([
            'role' => 'front_desk', 'is_active' => true,
            'assigned_care_areas' => [$ids['care_area_id']],
        ]);
        $appointmentId = $this->createScheduledAppointment($ids);
        Sanctum::actingAs($frontDesk, ['front_desk']);
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/check-in")->assertCreated();

        $nurse = User::factory()->create([
            'role' => 'nurse_triage', 'is_active' => true,
            'assigned_care_areas' => [$ids['care_area_id']],
        ]);
        Sanctum::actingAs($nurse, ['nurse_triage']);
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/triage/start")->assertOk();
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/triage/complete", [
            'blood_pressure' => '120/80',
            'temperature' => '36.7',
            'priority' => 'priority',
        ])->assertOk()->assertJsonPath('data.priority', 'priority');

        $this->assertDatabaseHas('appointments', ['id' => $appointmentId, 'status' => 'waiting_for_doctor']);
        $this->assertDatabaseHas('queue_tickets', ['appointment_id' => $appointmentId, 'priority' => 'priority']);
    }

    public function test_doctor_completion_releases_the_active_queue_number(): void
    {
        $ids = $this->referenceIds();
        $frontDesk = User::factory()->create(['role' => 'front_desk', 'is_active' => true, 'assigned_care_areas' => [$ids['care_area_id']]]);
        $appointmentId = $this->createScheduledAppointment($ids);
        Sanctum::actingAs($frontDesk, ['front_desk']);
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/check-in")->assertCreated();
        $nurse = User::factory()->create(['role' => 'nurse_triage', 'is_active' => true, 'assigned_care_areas' => [$ids['care_area_id']]]);
        Sanctum::actingAs($nurse, ['nurse_triage']);
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/triage/complete", ['priority' => 'normal'])->assertOk();
        $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true, 'assigned_care_areas' => [$ids['care_area_id']]]);
        Sanctum::actingAs($doctor, ['doctor']);
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/doctor/call")->assertOk();
        $this->postJson("/api/v1/staff/appointments/{$appointmentId}/doctor/complete", [
            'diagnosis' => 'Clinical assessment complete',
        ])->assertCreated();

        $this->assertDatabaseHas('appointments', ['id' => $appointmentId, 'status' => 'completed']);
        $this->assertDatabaseHas('queue_tickets', ['appointment_id' => $appointmentId, 'active_queue_number' => null]);
    }

    private function referenceIds(): array
    {
        $provinceId = \DB::table('provinces')->insertGetId(['name' => 'Isabela', 'created_at' => now(), 'updated_at' => now()]);
        $municipalityId = \DB::table('municipalities')->insertGetId(['province_id' => $provinceId, 'name' => 'Jones', 'created_at' => now(), 'updated_at' => now()]);
        $barangayId = \DB::table('barangays')->insertGetId(['municipality_id' => $municipalityId, 'name' => 'Dipangit', 'created_at' => now(), 'updated_at' => now()]);
        $careAreaId = \DB::table('care_areas')->insertGetId(['name' => 'General Clinic', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $serviceId = \DB::table('services')->insertGetId(['care_area_id' => $careAreaId, 'name' => 'General Consultation', 'duration_minutes' => 20, 'daily_capacity' => 60, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $profileId = \DB::table('patient_profiles')->insertGetId([
            'patient_number' => 'PT-000001', 'family_name' => 'Test', 'given_name' => 'Patient',
            'date_of_birth' => '2000-01-01', 'sex' => 'female', 'mobile_number' => '09170000000',
            'consent_to_treatment' => true, 'privacy_acknowledged' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        \DB::table('patient_addresses')->insert([
            'patient_profile_id' => $profileId, 'barangay_id' => $barangayId, 'address_line' => 'Purok 1',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return compact('careAreaId', 'serviceId', 'profileId') + [
            'care_area_id' => $careAreaId,
            'service_id' => $serviceId,
            'profile_id' => $profileId,
        ];
    }

    private function createScheduledAppointment(array $ids): int
    {
        return \DB::table('appointments')->insertGetId([
            'patient_profile_id' => $ids['profile_id'], 'service_id' => $ids['service_id'],
            'care_area_id' => $ids['care_area_id'], 'appointment_date' => today()->toDateString(),
            'visit_type' => 'scheduled', 'attendance_status' => 'pending', 'status' => 'scheduled',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
