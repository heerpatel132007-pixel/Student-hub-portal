<?php
/* admin_students.php - student list for the admin dashboard (admin only) */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

if(sessionState() !== 'active' || $_SESSION['user']['role'] !== 'admin'){
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied.']);
    exit;
}

$result = $conn->query(
    "SELECT id, student_id AS studentId, name, email, course, role,
            IFNULL(DATE_FORMAT(last_login, '%Y-%m-%d %H:%i'), 'Never') AS lastLogin
     FROM students ORDER BY id");

$rows = [];

while($row = $result->fetch_assoc()){
    $row['id'] = (int)$row['id'];
    $rows[] = $row;
}

echo json_encode($rows, JSON_UNESCAPED_UNICODE);
