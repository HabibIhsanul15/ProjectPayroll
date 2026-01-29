<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // React dev server default: http://localhost:5173
    'allowed_origins' => ['http://localhost:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Karena kamu pakai Bearer token (Sanctum personal access token),
    // ini boleh false.
    'supports_credentials' => false,

];
