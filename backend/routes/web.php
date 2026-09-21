<?php

use Illuminate\Support\Facades\Route;

// React is built into public/index.html. Laravel still handles /api/v1 via
// routes/api.php, while all browser routes resolve to this single-page app.
Route::get('/{path?}', function () {
    $frontend = public_path('index.html');
    // Tests and a fresh backend checkout may run before the frontend is built.
    // Production deployment must run npm run build first.
    if (! file_exists($frontend)) {
        abort_if(app()->environment('production'), 503, 'Frontend build is missing. Run npm run build before deployment.');
        return view('welcome');
    }

    return response()->file($frontend);
})->where('path', '.*');
