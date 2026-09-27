<?php

return [
    // Browser URL used after an emailed verification or password-reset link
    // has been validated by Laravel. Locally this is the Vite server; in
    // production it is the same HTTPS domain as APP_URL.
    'frontend_url' => env('SMARTSERVE_FRONTEND_URL', env('APP_URL')),
];
