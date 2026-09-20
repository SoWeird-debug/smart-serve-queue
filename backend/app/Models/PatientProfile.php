<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientProfile extends Model
{
    protected $fillable = [
        'user_id', 'patient_number', 'family_name', 'given_name', 'middle_name',
        'suffix', 'date_of_birth', 'sex', 'civil_status', 'nationality',
        'preferred_language', 'mobile_number', 'alternate_contact',
        'philhealth_client_type', 'philhealth_pin', 'philhealth_member_name',
        'philhealth_member_pin', 'guardian_name', 'guardian_relationship',
        'guardian_contact', 'emergency_contact_name',
        'emergency_contact_relationship', 'emergency_contact_phone',
        'consent_to_treatment', 'consent_verified_at', 'privacy_acknowledged',
        'privacy_acknowledged_at',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'consent_to_treatment' => 'boolean',
            'consent_verified_at' => 'datetime',
            'privacy_acknowledged' => 'boolean',
            'privacy_acknowledged_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
