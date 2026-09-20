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
            'date_of_birth' => ['required', 'date', 'before:today'],
            'sex' => ['required', Rule::in(['male', 'female', 'other'])],
            'mobile_number' => ['required', 'string', 'max:32', 'unique:patient_profiles,mobile_number'],
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
                'date_of_birth' => $data['date_of_birth'],
                'sex' => $data['sex'],
                'mobile_number' => $data['mobile_number'],
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

    private function patientPayload(PatientProfile $profile, User $user): array
    {
        return [
            'id' => $profile->id,
            'patient_number' => $profile->patient_number,
            'given_name' => $profile->given_name,
            'family_name' => $profile->family_name,
            'mobile_number' => $profile->mobile_number,
            'email' => $user->email,
            'email_verified_at' => $user->email_verified_at,
        ];
    }
}
