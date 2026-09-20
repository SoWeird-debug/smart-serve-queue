<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class PatientAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'given_name' => ['required', 'string', 'max:100'],
            'family_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'suffix' => ['nullable', 'string', 'max:24'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'sex' => ['required', Rule::in(['male', 'female', 'other'])],
            'civil_status' => ['nullable', 'string', 'max:32'],
            'nationality' => ['nullable', 'string', 'max:80'],
            'preferred_language' => ['nullable', 'string', 'max:80'],
            'mobile_number' => ['required', 'string', 'max:32', 'unique:patient_profiles,mobile_number'],
            'alternate_contact' => ['nullable', 'string', 'max:32'],
            'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'barangay_id' => ['required', 'integer', 'exists:barangays,id'],
            'address_line' => ['required', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy_meters' => ['nullable', 'numeric', 'min:0'],
            'location_source' => ['nullable', 'string', 'max:48'],
            'location_verified_at' => ['nullable', 'date'],
            'consent_to_treatment' => ['accepted'],
            'privacy_acknowledged' => ['accepted'],
            'philhealth_client_type' => ['nullable', 'string', 'max:24'],
            'philhealth_pin' => ['nullable', 'string', 'max:48'],
            'philhealth_member_name' => ['nullable', 'string', 'max:255'],
            'philhealth_member_pin' => ['nullable', 'string', 'max:48'],
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'guardian_relationship' => ['nullable', 'string', 'max:80'],
            'guardian_contact' => ['nullable', 'string', 'max:32'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:80'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:32'],
        ]);

        [$user, $profile] = DB::transaction(function () use ($data): array {
            $user = User::create([
                'name' => trim($data['given_name'].' '.$data['family_name']),
                'email' => strtolower($data['email']),
                'password' => $data['password'],
                'role' => 'patient',
                'is_active' => true,
            ]);
            $profile = PatientProfile::create([
                'user_id' => $user->id,
                'patient_number' => 'PT-'.str_pad((string) $user->id, 6, '0', STR_PAD_LEFT),
                'given_name' => $data['given_name'],
                'family_name' => $data['family_name'],
                'middle_name' => $data['middle_name'] ?? null,
                'suffix' => $data['suffix'] ?? null,
                'date_of_birth' => $data['date_of_birth'],
                'sex' => $data['sex'],
                'civil_status' => $data['civil_status'] ?? null,
                'nationality' => $data['nationality'] ?? null,
                'preferred_language' => $data['preferred_language'] ?? null,
                'mobile_number' => $data['mobile_number'],
                'alternate_contact' => $data['alternate_contact'] ?? null,
                'philhealth_client_type' => $data['philhealth_client_type'] ?? null,
                'philhealth_pin' => $data['philhealth_pin'] ?? null,
                'philhealth_member_name' => $data['philhealth_member_name'] ?? null,
                'philhealth_member_pin' => $data['philhealth_member_pin'] ?? null,
                'guardian_name' => $data['guardian_name'] ?? null,
                'guardian_relationship' => $data['guardian_relationship'] ?? null,
                'guardian_contact' => $data['guardian_contact'] ?? null,
                'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
                'emergency_contact_relationship' => $data['emergency_contact_relationship'] ?? null,
                'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
                'consent_to_treatment' => true,
                'consent_verified_at' => now(),
                'privacy_acknowledged' => true,
                'privacy_acknowledged_at' => now(),
            ]);
            DB::table('patient_addresses')->insert([
                'patient_profile_id' => $profile->id,
                'barangay_id' => $data['barangay_id'],
                'address_line' => $data['address_line'],
                'latitude' => $data['latitude'] ?? null,
                'longitude' => $data['longitude'] ?? null,
                'location_accuracy_meters' => $data['location_accuracy_meters'] ?? null,
                'location_source' => $data['location_source'] ?? null,
                'location_verified_at' => isset($data['location_verified_at']) ? now() : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return [$user, $profile];
        });

        return response()->json([
            'token' => $user->createToken('patient portal', ['patient'])->plainTextToken,
            'patient' => $this->patientPayload($profile, $user),
            'email_verification_required' => true,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ]);
        $profile = PatientProfile::query()
            ->where('patient_number', $data['identifier'])
            ->orWhere('mobile_number', $data['identifier'])
            ->with('user')
            ->first();

        if (! $profile || ! $profile->user || ! $profile->user->is_active || ! Hash::check($data['password'], $profile->user->password)) {
            return response()->json(['message' => 'Invalid patient number/mobile number or password.'], 422);
        }

        $profile->user->tokens()->where('name', 'patient portal')->delete();

        return response()->json([
            'token' => $profile->user->createToken('patient portal', ['patient'])->plainTextToken,
            'patient' => $this->patientPayload($profile, $profile->user),
            'email_verification_required' => ! $profile->user->hasVerifiedEmail(),
            'password_change_required' => $profile->user->must_change_password,
        ]);
    }

    public function current(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->patientProfile;

        abort_unless($profile, 404, 'Patient profile not found.');

        return response()->json([
            'patient' => $this->patientPayload($profile, $user),
            'email_verification_required' => ! $user->hasVerifiedEmail(),
            'password_change_required' => $user->must_change_password,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(status: 204);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $profile = $user->patientProfile;
        abort_unless($profile, 404, 'Patient profile not found.');
        $data = $request->validate([
            'alternate_contact' => ['nullable', 'string', 'max:32'],
            'preferred_language' => ['nullable', 'string', 'max:80'],
            'emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'emergency_contact_relationship' => ['nullable', 'string', 'max:80'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:32'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'location_accuracy_meters' => ['nullable', 'numeric', 'min:0'],
            'location_source' => ['nullable', 'string', 'max:48'],
            'location_verified_at' => ['nullable', 'date'],
        ]);
        DB::transaction(function () use ($profile, $data): void {
            $profile->fill(collect($data)->only([
                'alternate_contact', 'preferred_language', 'emergency_contact_name',
                'emergency_contact_relationship', 'emergency_contact_phone',
            ])->all())->save();
            $address = collect($data)->only([
                'address_line', 'latitude', 'longitude', 'location_accuracy_meters',
                'location_source',
            ])->all();
            if ($address) {
                $address['location_verified_at'] = isset($data['location_verified_at']) ? now() : null;
                $address['updated_at'] = now();
                DB::table('patient_addresses')->where('patient_profile_id', $profile->id)->update($address);
            }
        });

        return response()->json(['patient' => $this->patientPayload($profile->fresh(), $user)]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user->forceFill([
            'password' => $data['password'],
            'must_change_password' => false,
        ])->save();

        return response()->json(status: 204);
    }

    private function patientPayload(PatientProfile $profile, User $user): array
    {
        $address = DB::table('patient_addresses')
            ->join('barangays', 'barangays.id', '=', 'patient_addresses.barangay_id')
            ->join('municipalities', 'municipalities.id', '=', 'barangays.municipality_id')
            ->join('provinces', 'provinces.id', '=', 'municipalities.province_id')
            ->where('patient_addresses.patient_profile_id', $profile->id)
            ->first([
                'patient_addresses.address_line', 'patient_addresses.latitude',
                'patient_addresses.longitude', 'patient_addresses.location_accuracy_meters',
                'patient_addresses.location_source', 'patient_addresses.location_verified_at',
                'barangays.id as barangay_id', 'barangays.name as barangay_name',
                'municipalities.name as municipality_name', 'municipalities.postal_code',
                'provinces.name as province_name',
            ]);
        return [
            'id' => $profile->id,
            'patient_number' => $profile->patient_number,
            'given_name' => $profile->given_name,
            'family_name' => $profile->family_name,
            'middle_name' => $profile->middle_name,
            'suffix' => $profile->suffix,
            'date_of_birth' => $profile->date_of_birth?->toDateString(),
            'sex' => $profile->sex,
            'civil_status' => $profile->civil_status,
            'nationality' => $profile->nationality,
            'preferred_language' => $profile->preferred_language,
            'mobile_number' => $profile->mobile_number,
            'alternate_contact' => $profile->alternate_contact,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
            'philhealth_client_type' => $profile->philhealth_client_type,
            'philhealth_pin' => $profile->philhealth_pin,
            'philhealth_member_name' => $profile->philhealth_member_name,
            'philhealth_member_pin' => $profile->philhealth_member_pin,
            'guardian_name' => $profile->guardian_name,
            'guardian_relationship' => $profile->guardian_relationship,
            'guardian_contact' => $profile->guardian_contact,
            'emergency_contact_name' => $profile->emergency_contact_name,
            'emergency_contact_relationship' => $profile->emergency_contact_relationship,
            'emergency_contact_phone' => $profile->emergency_contact_phone,
            'address' => $address,
        ];
    }
}
