<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PatientAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_patient_can_register_and_sign_in_using_the_generated_patient_number(): void
    {
        $provinceId = DB::table('provinces')->insertGetId(['name' => 'Isabela']);
        $municipalityId = DB::table('municipalities')->insertGetId([
            'province_id' => $provinceId,
            'name' => 'Jones',
        ]);
        $barangayId = DB::table('barangays')->insertGetId([
            'municipality_id' => $municipalityId,
            'name' => 'Dipangit',
        ]);
        $careAreaId = DB::table('care_areas')->insertGetId([
            'name' => 'General Clinic',
            'is_active' => true,
        ]);
        $serviceId = DB::table('services')->insertGetId([
            'care_area_id' => $careAreaId,
            'name' => 'General Consultation',
            'duration_minutes' => 20,
            'daily_capacity' => 60,
            'is_active' => true,
        ]);

        $registration = $this->postJson('/api/v1/patient-auth/register', [
            'given_name' => 'Juan',
            'family_name' => 'Dela Cruz',
            'date_of_birth' => '1990-01-10',
            'sex' => 'male',
            'mobile_number' => '09171234567',
            'email' => 'juan@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'barangay_id' => $barangayId,
            'address_line' => 'Purok 1',
            'consent_to_treatment' => true,
            'privacy_acknowledged' => true,
        ]);

        $registration
            ->assertCreated()
            ->assertJsonPath('patient.patient_number', 'PT-000001')
            ->assertJsonPath('email_verification_required', true)
            ->assertJsonStructure(['token']);

        $this->withToken($registration->json('token'))
            ->postJson('/api/v1/appointments', [
                'service_id' => $serviceId,
                'appointment_date' => now()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'scheduled');

        $this->postJson('/api/v1/patient-auth/login', [
            'identifier' => 'PT-000001',
            'password' => 'SecurePass123!',
        ])
            ->assertOk()
            ->assertJsonPath('patient.mobile_number', '09171234567');
    }
}
