<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pending_email_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('verification_token_hash');
            $table->timestamp('verification_expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->string('registration_token_hash')->nullable();
            $table->timestamp('registration_expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pending_email_verifications');
    }
};
