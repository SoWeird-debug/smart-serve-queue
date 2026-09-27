<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ClinicAccountMail;
use Database\Factories\UserFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ClinicAccountMail(
            'Reset your password',
            'We received a request to reset your Super Health Center password. Choose a new password using the secure button below. Patients sign in with email; clinic team members sign in with their username.',
            'Choose a new password',
            rtrim(config('smartserve.frontend_url'), '/').'/?reset_email='.urlencode($this->email).'&reset_token='.urlencode($token),
            (int) config('auth.passwords.users.expire', 60),
        ));
    }

    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, MustVerifyEmailTrait, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'email_verified_at',
        'password',
        'role',
        'is_active',
        'must_change_password',
        'assigned_care_areas',
        'doctor_availability',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'assigned_care_areas' => 'array',
        ];
    }

    public function patientProfile(): HasOne
    {
        return $this->hasOne(PatientProfile::class);
    }
}
