<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\ClinicAccountMail;
use App\Support\AccountEmails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountAccessController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $identifier = strtolower(trim($data['identifier']));
        $user = str_contains($identifier, '@')
            ? User::where('email', $identifier)->where('role', 'patient')->first()
            : User::where('username', $identifier)->where('role', '!=', 'patient')->first();
        if (! $user || ! $user->is_active || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['identifier' => ['Invalid sign-in details.']]);
        }

        if (! $user->hasVerifiedEmail() || $user->must_change_password) {
            throw ValidationException::withMessages(['identifier' => [$user->role === 'patient'
                ? 'Verify your email through patient sign up to activate your onsite account.'
                : 'Activate your account using the email link first. You can request a new activation link below.']]);
        }

        $tokenName = $user->role === 'patient' ? 'patient portal' : 'staff workspace';
        $user->tokens()->where('name', $tokenName)->delete();

        return response()->json([
            'token' => $user->createToken($tokenName, [$user->role])->plainTextToken,
            'role' => $user->role,
        ]);
    }

    public function sendRegistrationVerification(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:255']]);
        $email = strtolower(trim($data['email']));
        $response = ['message' => 'Check your email for the next steps. If eligible, a link has been sent. Check your inbox and spam folder.'];
        $existing = User::where('email', $email)->first();
        if ($existing) {
            if (! $existing->is_active) {
                return response()->json($response, 202);
            }
            if ($existing->role !== 'patient') {
                if (! $existing->hasVerifiedEmail() || $existing->must_change_password) {
                    AccountEmails::send($existing);
                } else {
                    $this->sendSignInReminder($existing);
                }

                return response()->json($response, 202);
            }
            if (! $existing->must_change_password) {
                $this->sendSignInReminder($existing);

                return response()->json($response, 202);
            }
        }

        $token = Str::random(64);
        DB::table('pending_email_verifications')->updateOrInsert(
            ['email' => $email],
            [
                'verification_token_hash' => hash('sha256', $token),
                'verification_expires_at' => now()->addMinutes(30),
                'verified_at' => null,
                'registration_token_hash' => null,
                'registration_expires_at' => null,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );
        $url = rtrim(config('app.url'), '/').'/api/v1/auth/registration/verify?token='.urlencode($token);
        Notification::route('mail', $email)->notify(new ClinicAccountMail(
            'Verify your patient email',
            'Welcome to Super Health Center, Jones, Isabela. Confirm your email to continue your clinic registration or activate your existing onsite patient account.',
            'Verify email and continue', $url,
        ));

        return response()->json($response, 202);
    }

    private function sendSignInReminder(User $user): void
    {
        $user->notify(new ClinicAccountMail(
            'Sign in to your Super Health Center account',
            'You already have an account. Please sign in, or use Forgot password to recover access. Patients use their email; clinic team members use their assigned username. This request has not changed your password.',
            'Go to sign in', rtrim(config('smartserve.frontend_url'), '/').'/', 0,
        ));
    }

    public function verifyRegistrationEmail(Request $request): RedirectResponse
    {
        $token = (string) $request->query('token');
        $pending = DB::table('pending_email_verifications')
            ->where('verification_token_hash', hash('sha256', $token))
            ->where('verification_expires_at', '>=', now())
            ->whereNull('verified_at')
            ->first();
        if (! $pending) {
            return redirect(rtrim(config('smartserve.frontend_url'), '/').'/?verification_expired=1');
        }

        $registrationToken = Str::random(64);
        $updated = DB::table('pending_email_verifications')->where('id', $pending->id)->whereNull('verified_at')->update([
            'verified_at' => now(),
            'registration_token_hash' => hash('sha256', $registrationToken),
            'registration_expires_at' => now()->addHours(2),
            'updated_at' => now(),
        ]);
        if (! $updated) {
            return redirect(rtrim(config('smartserve.frontend_url'), '/').'/?verification_expired=1');
        }

        $claim = User::where('email', $pending->email)->where('role', 'patient')->where('must_change_password', true)->exists();

        return redirect(rtrim(config('smartserve.frontend_url'), '/').'/?registration_email='.urlencode($pending->email).'&registration_token='.urlencode($registrationToken).($claim ? '&claim_onsite=1' : ''));
    }

    public function claimOnsiteAccount(Request $request): JsonResponse
    {
        [$user, $pending] = $this->onsiteIdentity($request);
        $data = $request->validate([
            'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed'],
            'consent_to_treatment' => ['accepted'], 'privacy_acknowledged' => ['accepted'],
            'profile.given_name' => ['sometimes', 'required', 'string', 'max:100'],
            'profile.family_name' => ['sometimes', 'required', 'string', 'max:100'],
            'profile.middle_name' => ['nullable', 'string', 'max:100'],
            'profile.mobile_number' => ['sometimes', 'required', 'regex:/^09[0-9]{9}$/', Rule::unique('patient_profiles', 'mobile_number')->ignore($user->patientProfile->id)],
            'profile.date_of_birth' => ['sometimes', 'required', 'date', 'before:today'],
            'profile.sex' => ['sometimes', 'required', Rule::in(['male', 'female'])],
            'profile.emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'profile.emergency_contact_phone' => ['nullable', 'string', 'max:32'],
        ]);
        DB::transaction(function () use ($user, $pending, $data): void {
            // Lock and re-check so a consumed claim cannot be replayed concurrently.
            $claim = DB::table('pending_email_verifications')->lockForUpdate()->find($pending->id);
            abort_unless($claim && $claim->registration_token_hash === $pending->registration_token_hash, 422, 'This activation link has already been used.');
            $profile = $user->patientProfile;
            $profile->fill($data['profile'] ?? []);
            $profile->forceFill(['consent_to_treatment' => true, 'consent_verified_at' => now(), 'privacy_acknowledged' => true, 'privacy_acknowledged_at' => now()])->save();
            $user->forceFill(['name' => trim($profile->given_name.' '.$profile->family_name), 'password' => $data['password'], 'email_verified_at' => now(), 'must_change_password' => false])->save();
            $user->tokens()->delete();
            DB::table('pending_email_verifications')->where('id', $pending->id)->delete();
            DB::table('patient_registration_drafts')->where('email', $user->email)->delete();
        });

        return response()->json(['message' => 'Your onsite patient account was successfully activated.']);
    }

    public function onsiteReview(Request $request): JsonResponse
    {
        [$user] = $this->onsiteIdentity($request);

        return response()->json(['patient' => app(PatientAuthController::class)->patientPayload($user->patientProfile, $user)]);
    }

    private function onsiteIdentity(Request $request): array
    {
        $data = $request->validate(['email' => ['required', 'email:rfc'], 'registration_email_token' => ['required', 'string'], 'temporary_password' => ['required', 'string']]);
        $email = strtolower($data['email']);
        $pending = DB::table('pending_email_verifications')->where('email', $email)->where('registration_token_hash', hash('sha256', $data['registration_email_token']))->whereNotNull('verified_at')->where('registration_expires_at', '>', now())->first();
        $user = User::where('email', $email)->where('role', 'patient')->where('is_active', true)->where('must_change_password', true)->first();
        if (! $pending || ! $user || ! $user->patientProfile || ! Hash::check($data['temporary_password'], $user->password)) {
            throw ValidationException::withMessages(['temporary_password' => ['The activation link or temporary password is invalid.']]);
        }

        return [$user, $pending];
    }

    public function sendPasswordReset(Request $request): JsonResponse
    {
        $data = $request->validate(['identifier' => ['required', 'string', 'max:255']]);
        $identifier = strtolower(trim($data['identifier']));
        $query = User::where('is_active', true)->whereNotNull('email_verified_at');
        $user = str_contains($identifier, '@')
            ? $query->where('email', $identifier)->first()
            : $query->where('username', $identifier)->where('role', '!=', 'patient')->first();
        if ($user?->email) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return response()->json(['message' => 'If this matches an active, verified account, a password-reset link has been sent to its email.'], 202);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:255'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:12', 'confirmed'],
        ]);
        $status = Password::reset($data, function (User $user, string $password): void {
            abort_unless($user->is_active && $user->hasVerifiedEmail(), 422, 'Activate your account before resetting its password.');
            $user->forceFill(['password' => $password, 'must_change_password' => false])->save();
            $user->tokens()->delete();
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => 'Your password has been changed. Please sign in.']);
    }
}
