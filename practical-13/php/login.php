<?php
/*
   login.php - secure login
   - finds the user by email OR Student ID (username) with a prepared statement
   - verifies the password with password_verify()
   - regenerates the session ID after login
   - optional remember-me token
   - replies with JSON { success, message, role, redirect }
*/

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

function reply($success, $message, $extra = [], $status = 200){

    http_response_code($status);

    echo json_encode(array_merge(['success' => $success, 'message' => $message], $extra));

    exit;
}


if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    reply(false, 'Invalid request method.', [], 405);
}

$identifier = trim($_POST['identifier'] ?? '');
$password   = $_POST['password'] ?? '';
$remember   = ($_POST['remember'] ?? '') === 'yes';

if($identifier === '' || !is_string($password) || $password === ''){
    reply(false, 'Please enter your email or student number and your password.', [], 422);
}


/* simple brute-force limit: 5 wrong tries, then wait 60 seconds */

$_SESSION['fail_count'] = $_SESSION['fail_count'] ?? 0;
$_SESSION['fail_time']  = $_SESSION['fail_time']  ?? 0;

if($_SESSION['fail_count'] >= 5){

    if(time() - $_SESSION['fail_time'] < 60){
        reply(false, 'Too many failed attempts. Please wait a minute and try again.', [], 429);
    }

    $_SESSION['fail_count'] = 0;
}


$stmt = $conn->prepare(
    "SELECT id, student_id, name, email, password, role, last_login
     FROM students WHERE email = ? OR student_id = ? LIMIT 1");
$stmt->bind_param('ss', $identifier, $identifier);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

/* same work and same message whether the user exists or not */

$hash = ($user && $user['password']) ? $user['password']
      : '$2y$10$XQtnze.3oOy6pZi2IkcD0e0D3uKq2dcqFPPRDJorCIIruyp0nNGpm';

$ok = password_verify($password, $hash) && $user && $user['password'];

if(!$ok){

    $_SESSION['fail_count']++;
    $_SESSION['fail_time'] = time();

    reply(false, 'Invalid email/username or password.', [], 401);
}


/* upgrade the hash if PHP's default cost changed */

if(password_needs_rehash($user['password'], PASSWORD_DEFAULT)){

    $newHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("UPDATE students SET password = ? WHERE id = ?");
    $stmt->bind_param('si', $newHash, $user['id']);
    $stmt->execute();
    $stmt->close();
}

loginUser($user);                     // regenerates the session ID

$_SESSION['fail_count'] = 0;

$stmt = $conn->prepare("UPDATE students SET last_login = NOW() WHERE id = ?");
$stmt->bind_param('i', $user['id']);
$stmt->execute();
$stmt->close();

if($remember){
    issueRememberToken((int)$user['id']);
}

reply(true, 'Login successful.', [
    'role'     => $user['role'],
    'redirect' => $user['role'] === 'admin' ? '../php/admin.php' : '../php/dashboard.php'
]);
