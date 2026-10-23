<?php
/* check_user.php - tells the Profile page if an email / Student ID (username) is free */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$field = $_GET['field'] ?? '';
$value = trim($_GET['value'] ?? '');

$columns = ['email' => 'email', 'studentId' => 'student_id'];     // whitelist
$labels  = ['email' => 'email', 'studentId' => 'student number'];

if(!isset($columns[$field]) || $value === ''){
    http_response_code(400);
    echo json_encode(['available' => false, 'message' => 'Invalid request.']);
    exit;
}

$stmt = $conn->prepare("SELECT id FROM students WHERE " . $columns[$field] . " = ? LIMIT 1");
$stmt->bind_param('s', $value);
$stmt->execute();
$stmt->store_result();
$taken = $stmt->num_rows > 0;
$stmt->close();

echo json_encode([
    'available' => !$taken,
    'message'   => $taken ? 'This ' . $labels[$field] . ' is already registered' : ''
]);
