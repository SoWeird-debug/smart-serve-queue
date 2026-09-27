<?php

// Isolated browser test data. Never connects to the configured application database.
require __DIR__.'/../vendor/autoload.php';
$path = __DIR__.'/../storage/framework/browser-review.sqlite';
if (file_exists($path)) {
    fwrite(STDERR, "Fixture already exists; reuse it or select another isolated filename.\n");
    exit(1);
}
touch($path);
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => realpath($path), 'database.connections.sqlite.url' => null, 'mail.default' => 'array']);
Illuminate\Support\Facades\DB::purge();
Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
$area = Illuminate\Support\Facades\DB::table('care_areas')->insertGetId(['name' => 'General Clinic', 'is_active' => true]);
foreach (['administrator', 'doctor', 'front_desk', 'nurse_triage', 'pharmacy'] as $role) {
    App\Models\User::create(['name' => 'Review '.ucwords(str_replace('_', ' ', $role)), 'username' => 'review_'.$role, 'email' => $role.'@example.test', 'password' => 'LocalReviewOnly123!', 'role' => $role, 'is_active' => true, 'email_verified_at' => now(), 'must_change_password' => false, 'assigned_care_areas' => [$area]]);
}
echo "Isolated browser fixture ready.\n";
