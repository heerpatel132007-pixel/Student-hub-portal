<?php
/* session_check.php - tells the pages who is logged in (read only, does not extend the timeout) */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

$state = sessionState();

if($state !== 'active'){
    http_response_code(401);
    echo json_encode(['loggedIn' => false, 'expired' => $state === 'expired']);
    exit;
}

echo json_encode([
    'loggedIn'  => true,
    'timeout'   => SESSION_TIMEOUT,
    'remaining' => max(0, SESSION_TIMEOUT - (time() - $_SESSION['last_activity'])),
    'user'      => [
        'name'      => $_SESSION['user']['name'],
        'studentId' => $_SESSION['user']['studentId'],
        'email'     => $_SESSION['user']['email'],
        'role'      => $_SESSION['user']['role'],
        'lastLogin' => $_SESSION['user']['lastLogin']
    ]
]);
