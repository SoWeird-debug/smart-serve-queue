<?php

/*
 * Upload this file to Hostinger public_html as index.php.
 * The Laravel application must be uploaded separately to ../smartserve.
 */

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

require __DIR__.'/../smartserve/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require_once __DIR__.'/../smartserve/bootstrap/app.php';

$kernel = $app->make(Kernel::class);
$response = $kernel->handle($request = Request::capture());
$response->send();
$kernel->terminate($request, $response);
