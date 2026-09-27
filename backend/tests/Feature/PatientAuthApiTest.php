<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PatientAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_registers_then_signs_in_with_email(): void
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
        $registrationToken = 'verified-registration-token';
        DB::table('pending_email_verifications')->insert([
            'email' => 'juan@example.com',
            'verification_token_hash' => hash('sha256', 'verification-token'),
            'verification_expires_at' => now()->addMinutes(30),
            'verified_at' => now(),
            'registration_token_hash' => hash('sha256', $registrationToken),
            'registration_expires_at' => now()->addHour(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $registration = $this->postJson('/api/v1/patient-auth/register', [
            'given_name' => 'Juan',
            'family_name' => 'Dela Cruz',
            'date_of_birth' => '1990-01-10',
            'sex' => 'male',
            'mobile_number' => '09171234567',
            'email' => 'juan@example.com',
            'registration_email_token' => $registrationToken,
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
            ->assertJsonPath('email_verification_required', false)
            ->assertJsonMissingPath('token');

        $login = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'juan@example.com', 'password' => 'SecurePass123!',
        ])->assertOk();

        $this->withToken($login->json('token'))
            ->postJson('/api/v1/appointments', [
                'service_id' => $serviceId,
                'appointment_date' => now()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'scheduled');

        $this->postJson('/api/v1/patient-auth/login', [
            'identifier' => 'juan@example.com',
            'password' => 'SecurePass123!',
        ])
            ->assertOk()
            ->assertJsonPath('patient.mobile_number', '09171234567');
    }
}
