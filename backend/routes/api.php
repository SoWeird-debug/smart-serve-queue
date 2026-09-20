<?php

use App\Http\Controllers\Api\PatientAuthController;
use App\Http\Controllers\Api\DirectoryController;
use App\Http\Controllers\Api\StaffAuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\StaffQueueController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn () => response()->json([
        'status' => 'ok',
        'application' => config('app.name'),
    ]));

    Route::post('/patient-auth/register', [PatientAuthController::class, 'register'])->middleware('throttle:6,1');
    Route::post('/patient-auth/login', [PatientAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/staff-auth/setup-administrator', [StaffAuthController::class, 'setupAdministrator'])->middleware('throttle:3,1');
    Route::post('/staff-auth/login', [StaffAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/directories/municipalities', [DirectoryController::class, 'municipalities']);
    Route::get('/directories/municipalities/{municipalityId}/barangays', [DirectoryController::class, 'barangays']);
    Route::get('/services', [DirectoryController::class, 'services']);
    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/patient-auth/me', [PatientAuthController::class, 'current']);
        Route::post('/patient-auth/logout', [PatientAuthController::class, 'logout']);
        Route::get('/staff-auth/me', [StaffAuthController::class, 'current']);
        Route::get('/staff/queue', [StaffQueueController::class, 'index']);
        Route::post('/staff/appointments/{appointmentId}/check-in', [StaffQueueController::class, 'checkIn']);
        Route::post('/staff/walk-ins', [StaffQueueController::class, 'walkIn']);
        Route::get('/appointments', [AppointmentController::class, 'index']);
        Route::post('/appointments', [AppointmentController::class, 'store']);
        Route::post('/appointments/{appointmentId}/cancel', [AppointmentController::class, 'cancel']);
    });
});
