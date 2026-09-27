<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AccountEmails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AccountProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->payload($request->user())]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->role === 'patient', 403, 'Use the patient profile to update patient information.');
        $request->merge(['email' => strtolower(trim((string) $request->input('email')))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique('users')->ignore($user->id)],
            'current_password' => ['nullable', 'string'],
        ]);
        $email = strtolower($data['email']);
        $changed = $email !== $user->email;
        if ($changed && ! Hash::check($data['current_password'] ?? '', $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['Enter your current password to change your email.']]);
        }
        DB::transaction(function () use ($user, $data, $email, $changed): void {
            $user->update(['name' => $data['name']]);
            if ($changed) {
                AccountEmails::send($user, 'email_change', $email);
            }
        });

        return response()->json([
            'user' => $this->payload($user->fresh()),
            'message' => $changed ? 'Profile saved. A verification link was sent to your new email. Your current email remains active until confirmation.' : 'Your profile was successfully saved.',
        ]);
    }

    public function resend(Request $request): JsonResponse
    {
        $data = $request->validate(['identifier' => ['required', 'string', 'max:255']]);
        $user = User::where('username', strtolower(trim($data['identifier'])))->where('role', '!=', 'patient')->where('is_active', true)->first();
        if ($user && (! $user->hasVerifiedEmail() || $user->must_change_password) && $user->email) {
            AccountEmails::send($user);
        }

        return response()->json(['message' => 'If an account needs activation, a verification link has been sent to its email.'], 202);
    }

    public function inspect(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'size:64']]);
        $pending = $this->pending($data['token']);
        $user = User::findOrFail($pending->user_id);

        return response()->json(['purpose' => $pending->purpose, 'email' => $pending->email, 'name' => $user->name, 'username' => $user->username, 'role' => $user->role]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'size:64'], 'password' => ['nullable', 'string', 'min:12', 'max:128', 'confirmed']]);

        return DB::transaction(function () use ($data): JsonResponse {
            $pending = $this->pending($data['token'], true);
            $user = User::lockForUpdate()->findOrFail($pending->user_id);
            abort_unless($user->is_active, 403, 'This account is inactive. Contact the clinic.');
            if ($pending->purpose === 'activation' && empty($data['password'])) {
                throw ValidationException::withMessages(['password' => ['Choose a personal password of at least 12 characters.']]);
            }
            if (User::where('email', $pending->email)->where('id', '!=', $user->id)->exists()) {
                throw ValidationException::withMessages(['email' => ['This email is already in use. Request a new link with another address.']]);
            }
            $oldEmail = $user->email;
            $updates = ['email' => $pending->email, 'email_verified_at' => now()];
            if ($pending->purpose === 'activation') {
                $updates['password'] = $data['password'];
                $updates['must_change_password'] = false;
            }
            $user->forceFill($updates)->save();
            $user->tokens()->delete();
            DB::table('account_email_tokens')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->whereIn('email', [$pending->email, $oldEmail])->delete();

            return response()->json(['message' => 'Your email is verified and your account information was saved. Please sign in.', 'username' => $user->username]);
        });
    }

    public function password(Request $request): JsonResponse
    {
        $data = $request->validate(['current_password' => ['required', 'string'], 'password' => ['required', 'string', 'min:12', 'max:128', 'confirmed']]);
        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => ['Your current password is incorrect.']]);
        }
        $user->update(['password' => $data['password'], 'must_change_password' => false]);
        $user->tokens()->delete();
        DB::table('password_reset_tokens')->where('email', $user->email)->delete();

        return response()->json(['message' => 'Password saved. Please sign in with your new password.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(status: 204);
    }

    private function pending(string $token, bool $lock = false): object
    {
        $query = DB::table('account_email_tokens')->where('token_hash', hash('sha256', $token))->where('expires_at', '>', now());
        if ($lock) {
            $query->lockForUpdate();
        }
        $pending = $query->first();
        abort_unless($pending, 422, 'This link has expired or was already used. Request a new verification link.');

        return $pending;
    }

    private function payload(User $user): array
    {
        return [
            'id' => $user->id, 'name' => $user->name, 'username' => $user->username, 'email' => $user->email,
            'role' => $user->role, 'email_verified_at' => $user->email_verified_at,
            'pending_email' => DB::table('account_email_tokens')->where('user_id', $user->id)->where('purpose', 'email_change')->where('expires_at', '>', now())->value('email'),
        ];
    }
}
