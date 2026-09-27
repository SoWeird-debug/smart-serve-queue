<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ClinicAccountMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SharedSignupTest extends TestCase
{
    use RefreshDatabase;

    public function test_signup_routes_all_clinic_roles_to_activation_without_patient_registration(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        foreach (['administrator', 'doctor', 'front_desk', 'nurse_triage', 'pharmacy'] as $role) {
            Notification::fake();
            $user = User::factory()->create(['role' => $role, 'username' => $role, 'is_active' => true, 'email_verified_at' => null, 'must_change_password' => true]);
            $this->postJson('/api/v1/auth/registration/send-verification', ['email' => strtoupper($user->email), 'role' => 'administrator'])->assertStatus(202)->assertJsonMissingPath('role');
            $token = '';
            Notification::assertSentOnDemand(ClinicAccountMail::class, function ($mail, $channels, $recipient) use ($user, &$token) {
                parse_str(parse_url($mail->url, PHP_URL_QUERY), $query);
                $token = $query['account_token'];

                return $recipient->routes['mail'] === $user->email;
            });
            $this->postJson('/api/v1/auth/email/inspect', ['token' => $token])->assertOk()->assertJsonPath('role', $role);
            $this->postJson('/api/v1/auth/email/confirm', ['token' => $token, 'password' => 'PersonalPassword123!', 'password_confirmation' => 'PersonalPassword123!'])->assertOk();
            $this->postJson('/api/v1/auth/login', ['identifier' => $role, 'password' => 'PersonalPassword123!'])->assertOk()->assertJsonPath('role', $role);
        }
        $this->assertDatabaseCount('pending_email_verifications', 0);
        $this->assertDatabaseCount('patient_profiles', 0);
    }

    public function test_generic_signup_response_preserves_existing_accounts_and_new_patient_flow(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        Notification::fake();
        $response = $this->postJson('/api/v1/auth/registration/send-verification', ['email' => 'new@gmail.com'])->assertStatus(202)->json();
        $this->assertDatabaseHas('pending_email_verifications', ['email' => 'new@gmail.com']);
        foreach (['patient', 'doctor'] as $role) {
            $user = User::factory()->create(['role' => $role, 'is_active' => true, 'must_change_password' => false]);
            $before = $user->fresh()->getAttributes();
            $this->postJson('/api/v1/auth/registration/send-verification', ['email' => $user->email])->assertStatus(202)->assertExactJson($response);
            $this->assertSame($before, $user->fresh()->getAttributes());
            $this->assertDatabaseMissing('account_email_tokens', ['user_id' => $user->id]);
        }
        $onsite = User::factory()->create(['role' => 'patient', 'is_active' => true, 'must_change_password' => true, 'email_verified_at' => null]);
        $this->postJson('/api/v1/auth/registration/send-verification', ['email' => $onsite->email])->assertStatus(202)->assertExactJson($response);
        $this->assertDatabaseHas('pending_email_verifications', ['email' => $onsite->email]);
        Notification::fake();
        $inactive = User::factory()->create(['role' => 'doctor', 'is_active' => false]);
        $this->postJson('/api/v1/auth/registration/send-verification', ['email' => $inactive->email])->assertStatus(202)->assertExactJson($response);
        Notification::assertNothingSent();
        $this->postJson('/api/v1/auth/registration/send-verification', ['email' => 'invalid'])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_clinic_email_and_username_recovery_only_mail_verified_active_accounts(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);
        foreach (['email', 'username'] as $field) {
            Notification::fake();
            $user = User::factory()->create(['role' => 'doctor', 'username' => 'doctor_'.$field, 'is_active' => true]);
            $this->postJson('/api/v1/auth/forgot-password', ['identifier' => $user->$field])->assertStatus(202);
            Notification::assertSentTo($user, ClinicAccountMail::class);
        }
        Notification::fake();
        $unverified = User::factory()->create(['role' => 'doctor', 'is_active' => true, 'email_verified_at' => null]);
        $inactive = User::factory()->create(['role' => 'patient', 'is_active' => false]);
        $expected = $this->postJson('/api/v1/auth/forgot-password', ['identifier' => 'missing@gmail.com'])->assertStatus(202)->json();
        foreach ([$unverified, $inactive] as $user) {
            $this->postJson('/api/v1/auth/forgot-password', ['identifier' => $user->email])->assertStatus(202)->assertExactJson($expected);
        }
        Notification::assertNothingSent();
    }
}
