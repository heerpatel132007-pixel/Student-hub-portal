<?php
/*
   db.php  -  MySQL connection (XAMPP defaults)
   Include with:  require_once __DIR__ . '/db.php';
*/

/* settings come from config.php (copy of config.example.php); XAMPP defaults if it is missing */

$config = file_exists(__DIR__ . '/config.php')
        ? require __DIR__ . '/config.php'
        : ['host' => 'localhost', 'user' => 'root', 'pass' => '', 'name' => 'studenthub'];

$DB_HOST = $config['host'];
$DB_USER = $config['user'];
$DB_PASS = $config['pass'];
$DB_NAME = $config['name'];

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
