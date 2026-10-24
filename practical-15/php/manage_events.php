<?php
/* manage_events.php - event management page: only for logged-in admins */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();
guardPage('admin');

serveHtml('manage_events.html');
