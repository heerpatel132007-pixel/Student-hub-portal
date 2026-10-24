<?php
/* dashboard.php - student dashboard: only for logged-in students */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();
guardPage('student');

serveHtml('dashboard.html');
