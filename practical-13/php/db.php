<?php
/*
   db.php  -  MySQL connection (XAMPP defaults)
   Include with:  require_once __DIR__ . '/db.php';
*/

$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';              // XAMPP default: empty password
$DB_NAME = 'studenthub';

mysqli_report(MYSQLI_REPORT_OFF);

$conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

if($conn->connect_error){
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed.',
        'errors'  => []
    ]);
    exit;
}

$conn->set_charset('utf8mb4');
