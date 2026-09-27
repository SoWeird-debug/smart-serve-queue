<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AccountEmails;
use App\Support\StaffAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdministrationController extends Controller
{
    private const ROLES = ['front_desk', 'nurse_triage', 'doctor', 'pharmacy', 'administrator'];

    public function staff(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);

        return response()->json(['data' => User::query()
            ->whereIn('role', self::ROLES)
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->staffPayload($user))]);
    }

    public function createStaff(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);
        $data = $this->staffData($request, true);
        $user = DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'], 'username' => $data['username'],
                'email' => isset($data['email']) ? strtolower($data['email']) : null,
                'password' => $data['password'], 'role' => $data['role'],
                'is_active' => $data['is_active'] ?? true,
                'must_change_password' => true,
                'assigned_care_areas' => $data['assigned_care_area_ids'] ?? [],
                'doctor_availability' => $data['role'] === 'doctor' ? ($data['doctor_availability'] ?? 'off_duty') : null,
            ]);
            AccountEmails::send($user);

            return $user;
        });
        $this->audit($request, 'staff.created', $user->id);

        return response()->json(['data' => $this->staffPayload($user)], 201);
    }

    public function updateStaff(Request $request, int $staffId): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);
        $user = User::whereIn('role', self::ROLES)->findOrFail($staffId);
        $data = $this->staffData($request, false, $user);
        $updates = collect($data)->only(['name', 'username', 'role', 'is_active'])->all();
        $effectiveRole = $data['role'] ?? $user->role;
        if (isset($data['email']) && strtolower($data['email']) !== $user->email) {
            AccountEmails::send($user, $user->hasVerifiedEmail() ? 'email_change' : 'activation', strtolower($data['email']));
        }
        if (array_key_exists('assigned_care_area_ids', $data)) {
            $updates['assigned_care_areas'] = $data['assigned_care_area_ids'];
        }
        if ($effectiveRole !== 'doctor') {
            $updates['doctor_availability'] = null;
        } elseif (array_key_exists('doctor_availability', $data)) {
            $updates['doctor_availability'] = $data['doctor_availability'];
        }
        $user->update($updates);
        if ($user->wasChanged(['role', 'is_active', 'username'])) {
            $user->tokens()->delete();
        }
        $this->audit($request, 'staff.updated', $user->id);

        return response()->json(['data' => $this->staffPayload($user->fresh())]);
    }

    public function resetPassword(Request $request, int $staffId): JsonResponse
    {
        StaffAccess::require($request, ['administrator']);
        $data = $request->validate(['password' => ['required', 'string', 'min:12', 'confirmed']]);
        $user = User::whereIn('role', self::ROLES)->findOrFail($staffId);
        $user->forceFill(['password' => $data['password'], 'must_change_password' => true])->save();
        $user->tokens()->delete();
        AccountEmails::send($user);
        $this->audit($request, 'staff.password_reset', $user->id);

        return response()->json(status: 204);
    }

    public function doctorAvailability(Request $request): JsonResponse
    {
        StaffAccess::require($request, ['doctor']);
        $data = $request->validate(['doctor_availability' => ['required', Rule::in(['available', 'with_patient', 'on_break', 'off_duty', 'on_leave'])]]);
        $request->user()->update($data);

        return response()->json(['data' => $this->staffPayload($request->user()->fresh())]);
    }

    private function staffData(Request $request, bool $create, ?User $existing = null): array
    {
        return $request->validate([
            'name' => [$create ? 'required' : 'sometimes', 'string', 'max:255'],
            'username' => [$create ? 'required' : 'sometimes', 'string', 'lowercase', 'alpha_dash', 'max:100', Rule::unique('users', 'username')->ignore($existing?->id)],
            'email' => [$create ? 'required' : 'sometimes', 'email:rfc', 'max:255', Rule::unique('users', 'email')->ignore($existing?->id)],
            'password' => [$create ? 'required' : 'sometimes', 'string', 'min:12', 'confirmed'],
            'role' => [$create ? 'required' : 'sometimes', Rule::in(self::ROLES)],
            'is_active' => ['sometimes', 'boolean'],
            'assigned_care_area_ids' => ['sometimes', 'array'],
            'assigned_care_area_ids.*' => ['integer', 'exists:care_areas,id'],
            'doctor_availability' => ['nullable', Rule::in(['available', 'with_patient', 'on_break', 'off_duty', 'on_leave'])],
        ]);
    }

    private function staffPayload(User $user): array
    {
        return [
            'id' => $user->id, 'name' => $user->name, 'username' => $user->username,
            'email' => $user->email, 'role' => $user->role, 'is_active' => $user->is_active,
            'email_verified_at' => $user->email_verified_at,
            'must_change_password' => $user->must_change_password,
            'assigned_care_area_ids' => $user->assigned_care_areas ?? [],
            'doctor_availability' => $user->doctor_availability,
        ];
    }

    private function audit(Request $request, string $action, int $subjectId): void
    {
        DB::table('audit_logs')->insert([
            'actor_id' => $request->user()->id, 'action' => $action,
            'subject_type' => User::class, 'subject_id' => $subjectId,
            'ip_address' => $request->ip(), 'user_agent' => substr((string) $request->userAgent(), 0, 1000),
            'occurred_at' => now(),
        ]);
    }

    private function usernameFromEmail(string $email): string
    {
        $base = substr(preg_replace('/[^a-z0-9_]/', '_', strtolower(strstr($email, '@', true) ?: $email)), 0, 88) ?: 'staff';
        $username = $base;
        $suffix = 1;
        while (User::where('username', $username)->exists()) {
            $username = substr($base, 0, 88).'-'.$suffix++;
        }

        return $username;
    }
}
