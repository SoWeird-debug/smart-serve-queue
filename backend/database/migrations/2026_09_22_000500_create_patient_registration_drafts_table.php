<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_registration_drafts', function (Blueprint $table): void {
            $table->id();
            $table->string('email')->unique();
            $table->string('registration_token_hash', 64);
            $table->json('draft');
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_registration_drafts');
    }
};
