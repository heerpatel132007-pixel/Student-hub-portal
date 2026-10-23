<?php
/* api_demo.php - Fetch API demo page: only for logged-in admins */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();
guardPage('admin');

serveHtml('api_demo.html');
