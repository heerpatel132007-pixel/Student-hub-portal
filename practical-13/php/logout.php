<?php
/* logout.php - ends the session and removes the remember-me token */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

clearRememberToken();
destroySession();

echo json_encode(['success' => true, 'message' => 'You have been logged out.']);
