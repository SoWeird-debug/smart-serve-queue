<?php

namespace Tests\Feature;

use App\Models\PatientProfile;
use App\Models\User;
use App\Notifications\ClinicAccountMail;
use App\Support\AccountEmails;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class AccountSecurityTest extends TestCase
{
    use RefreshDatabase;

    private function staff(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'username' => 'doctor_one', 'role' => 'doctor', 'is_active' => true,
            'password' => 'PersonalPassword123!', 'must_change_password' => false,
        ], $attributes));
    }

    private function emailToken(): string
    {
        $token = '';
        Notification::assertSentOnDemand(ClinicAccountMail::class, function ($notification) use (&$token) {
            parse_str(parse_url($notification->url, PHP_URL_QUERY), $query);
            $token = $query['account_token'];

            return true;
        });

        return $token;
    }

    public function test_activation_is_required_then_token_is_consumed_and_username_login_works(): void
    {
        Notification::fake();
        $user = $this->staff(['email_verified_at' => null, 'must_change_password' => true]);
        $this->postJson('/api/v1/auth/login', ['identifier' => $user->username, 'password' => 'PersonalPassword123!'])->assertUnprocessable();
        AccountEmails::send($user);
        $token = $this->emailToken();
        $this->postJson('/api/v1/auth/email/inspect', ['token' => $token])->assertOk()->assertJsonPath('username', $user->username);
        $payload = ['token' => $token, 'password' => 'ActivatedPassword123!', 'password_confirmation' => 'ActivatedPassword123!'];
        $this->postJson('/api/v1/auth/email/confirm', $payload)->assertOk();
        $this->postJson('/api/v1/auth/email/confirm', $payload)->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'ActivatedPassword123!'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['identifier' => $user->username, 'password' => 'ActivatedPassword123!'])->assertOk();
    }

    public function test_expired_and_replaced_activation_links_are_rejected(): void
    {
        Notification::fake();
        $user = $this->staff(['email_verified_at' => null]);
        AccountEmails::send($user);
        $old = $this->emailToken();
        AccountEmails::send($user);
        $this->postJson('/api/v1/auth/email/inspect', ['token' => $old])->assertUnprocessable();
        DB::table('account_email_tokens')->update(['expires_at' => now()->subMinute()]);
        $this->postJson('/api/v1/auth/email/confirm', ['token' => Str::random(64)])->assertUnprocessable();
    }

    public function test_profile_changes_preserve_verified_email_until_new_address_is_confirmed(): void
    {
        Notification::fake();
        $user = $this->staff();
        $oldEmail = $user->email;
        $token = $user->createToken('staff workspace')->plainTextToken;
        $this->withToken($token)->patchJson('/api/v1/account/profile', [
            'name' => 'Doctor Updated', 'email' => 'new@clinic.test', 'current_password' => 'wrong',
        ])->assertUnprocessable();
        $this->withToken($token)->patchJson('/api/v1/account/profile', [
            'name' => 'Doctor Updated', 'email' => 'new@clinic.test', 'current_password' => 'PersonalPassword123!',
            'role' => 'administrator', 'is_active' => false,
        ])->assertOk()->assertJsonPath('user.email', $oldEmail)->assertJsonPath('user.pending_email', 'new@clinic.test');
        $this->assertSame('doctor', $user->fresh()->role);
        $this->assertTrue($user->fresh()->is_active);
        $this->postJson('/api/v1/auth/email/confirm', ['token' => $this->emailToken()])->assertOk();
        $this->assertSame('new@clinic.test', $user->fresh()->email);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_each_clinic_role_can_edit_only_its_own_profile(): void
    {
        foreach (['administrator', 'doctor', 'front_desk', 'nurse_triage', 'pharmacy'] as $role) {
            $user = $this->staff(['username' => $role, 'role' => $role]);
            $this->app['auth']->forgetGuards();
            $this->withToken($user->createToken('staff workspace')->plainTextToken)
                ->patchJson('/api/v1/account/profile', ['name' => 'Updated '.$role, 'email' => $user->email, 'role' => 'administrator'])
                ->assertOk()->assertJsonPath('user.role', $role)->assertJsonPath('user.name', 'Updated '.$role);
        }
    }

    public function test_forgot_password_sends_only_to_verified_accounts_and_uses_branded_email(): void
    {
        Notification::fake();
        $verified = $this->staff();
        $unverified = $this->staff(['username' => 'pending', 'email_verified_at' => null]);
        foreach (['pending', $unverified->email, 'unknown'] as $identifier) {
            $this->postJson('/api/v1/auth/forgot-password', compact('identifier'))->assertAccepted();
        }
        Notification::assertNothingSent();
        $this->withoutMiddleware(ThrottleRequests::class);
        $this->postJson('/api/v1/auth/forgot-password', ['identifier' => $verified->username])->assertAccepted();
        Notification::assertSentTo($verified, ClinicAccountMail::class);
        Notification::assertNotSentTo($unverified, ClinicAccountMail::class);
        $html = view('emails.account', ['heading' => 'Reset password', 'intro' => '<script>bad</script>', 'action' => 'Reset password', 'url' => 'https://clinic.test/reset', 'minutes' => 30])->render();
        $this->assertStringContainsString('Super Health Center', $html);
        $this->assertStringContainsString('Jones, Isabela', $html);
        $this->assertStringNotContainsString('<script>bad</script>', $html);
    }

    public function test_password_change_requires_current_password_and_revokes_sessions(): void
    {
        $user = $this->staff();
        $token = $user->createToken('staff workspace')->plainTextToken;
        $data = ['current_password' => 'wrong', 'password' => 'NewPersonalPassword123!', 'password_confirmation' => 'NewPersonalPassword123!'];
        $this->withToken($token)->postJson('/api/v1/account/password', $data)->assertUnprocessable();
        $data['current_password'] = 'PersonalPassword123!';
        $this->withToken($token)->postJson('/api/v1/account/password', $data)->assertOk();
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_inactive_accounts_cannot_use_existing_tokens(): void
    {
        $user = $this->staff(['is_active' => false]);
        $this->withToken($user->createToken('staff workspace')->plainTextToken)->getJson('/api/v1/account/profile')->assertForbidden();
    }

    public function test_drafts_exclude_passwords_and_consent_and_require_verified_token(): void
    {
        $this->postJson('/api/v1/patient-auth/registration-draft', ['email' => 'p@test.com', 'registration_email_token' => 'bad', 'draft' => ['givenName' => 'Test']])->assertUnprocessable();
        DB::table('pending_email_verifications')->insert([
            'email' => 'p@test.com', 'verification_token_hash' => hash('sha256', 'v'), 'verification_expires_at' => now()->addHour(),
            'registration_token_hash' => hash('sha256', 'verified'), 'registration_expires_at' => now()->addHour(), 'verified_at' => now(),
        ]);
        $identity = ['email' => 'p@test.com', 'registration_email_token' => 'verified'];
        $this->postJson('/api/v1/patient-auth/registration-draft', $identity + ['draft' => ['givenName' => 'Test', 'password' => 'secret', 'consentToTreatment' => true, 'privacyAcknowledged' => true]])->assertOk();
        $this->postJson('/api/v1/patient-auth/registration-draft/load', $identity)->assertOk()->assertJsonPath('draft.givenName', 'Test')->assertJsonMissingPath('draft.password')->assertJsonMissingPath('draft.consentToTreatment');
        $this->travel(3)->hours();
        $this->artisan('smartserve:prune-registration')->assertSuccessful();
        $this->assertDatabaseCount('patient_registration_drafts', 0);
    }

    public function test_onsite_claim_reviews_and_updates_the_existing_patient_without_replacing_identity(): void
    {
        $user = $this->staff(['username' => null, 'role' => 'patient', 'email_verified_at' => null, 'must_change_password' => true]);
        $profile = PatientProfile::create(['user_id' => $user->id, 'patient_number' => 'PT-EXISTING', 'given_name' => 'Original', 'family_name' => 'Patient', 'date_of_birth' => '1990-01-01', 'sex' => 'female', 'mobile_number' => '09123456789']);
        DB::table('pending_email_verifications')->insert([
            'email' => $user->email, 'verification_token_hash' => hash('sha256', 'v'), 'verification_expires_at' => now()->addHour(),
            'registration_token_hash' => hash('sha256', 'claim'), 'registration_expires_at' => now()->addHour(), 'verified_at' => now(),
        ]);
        $identity = ['email' => $user->email, 'registration_email_token' => 'claim', 'temporary_password' => 'PersonalPassword123!'];
        $this->postJson('/api/v1/auth/onsite-review', array_replace($identity, ['temporary_password' => 'wrong']))->assertUnprocessable();
        $this->postJson('/api/v1/auth/onsite-review', $identity)->assertOk()->assertJsonPath('patient.patient_number', 'PT-EXISTING');
        $payload = $identity + ['password' => 'ClaimedPassword123!', 'password_confirmation' => 'ClaimedPassword123!', 'consent_to_treatment' => true, 'privacy_acknowledged' => true, 'profile' => ['given_name' => 'Corrected', 'patient_number' => 'HACKED', 'user_id' => 999]];
        $this->postJson('/api/v1/auth/claim-onsite-account', $payload)->assertOk();
        $this->assertDatabaseCount('patient_profiles', 1);
        $this->assertDatabaseHas('patient_profiles', ['id' => $profile->id, 'user_id' => $user->id, 'patient_number' => 'PT-EXISTING', 'given_name' => 'Corrected', 'consent_to_treatment' => true]);
        $this->postJson('/api/v1/auth/claim-onsite-account', $payload)->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['identifier' => $user->email, 'password' => 'ClaimedPassword123!'])->assertOk();
    }

    public function test_patient_verification_email_uses_a_hashed_expiring_one_time_token(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/auth/registration/send-verification', ['email' => 'newpatient@example.test'])->assertAccepted();
        $url = '';
        Notification::assertSentOnDemand(ClinicAccountMail::class, function ($notification) use (&$url) {
            $url = $notification->url;

            return true;
        });
        parse_str(parse_url($url, PHP_URL_QUERY), $query);
        $this->assertDatabaseHas('pending_email_verifications', ['verification_token_hash' => hash('sha256', $query['token'])]);
        $response = $this->get($url)->assertRedirect();
        $this->assertStringContainsString('registration_token=', $response->headers->get('Location'));
        $this->get($url)->assertRedirect(rtrim(config('smartserve.frontend_url'), '/').'/?verification_expired=1');
    }
}
