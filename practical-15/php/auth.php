<?php
/*
   auth.php - shared session helpers (login, timeout, roles, remember-me)
   Include with:  require_once __DIR__ . '/auth.php';   (db.php must be included first)
*/

define('SESSION_TIMEOUT', 900);      // 15 minutes of inactivity
define('REMEMBER_DAYS', 30);


function isHttps(){
    return !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
}


/* start the session with safe cookie settings */

function startSecureSession(){

    if(session_status() === PHP_SESSION_ACTIVE){
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => isHttps(),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    session_name('STUDENTHUB_SESSION');
    session_start();
}


/* log the user in: new session ID (prevents session fixation) */

function loginUser($user){

    session_regenerate_id(true);

    $_SESSION['user'] = [
        'id'        => (int)$user['id'],
        'studentId' => $user['student_id'],
        'name'      => $user['name'],
        'email'     => $user['email'],
        'role'      => $user['role'],
        'lastLogin' => $user['last_login']        // previous login time
    ];

    $_SESSION['last_activity'] = time();
}


function touchSession(){
    $_SESSION['last_activity'] = time();
}


function destroySession(){

    $_SESSION = [];

    if(ini_get('session.use_cookies')){
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }

    session_destroy();
}


/* returns 'active', 'expired' or 'none' */

function sessionState(){

    if(!empty($_SESSION['user'])){

        if(time() - ($_SESSION['last_activity'] ?? 0) <= SESSION_TIMEOUT){
            return 'active';
        }

        destroySession();
        startSecureSession();

        return tryRememberLogin() ? 'active' : 'expired';
    }

    return tryRememberLogin() ? 'active' : 'none';
}


/* ---------- remember-me (selector + hashed token) ---------- */

function setRememberCookie($value, $expires){

    setcookie('remember_me', $value, [
        'expires'  => $expires,
        'path'     => '/',
        'secure'   => isHttps(),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}


function issueRememberToken($studentDbId){

    global $conn;

    $selector = bin2hex(random_bytes(6));          // 12 hex characters
    $token    = bin2hex(random_bytes(32));         // 64 hex characters (sent to the browser)
    $hash     = hash('sha256', $token);            // only the hash is stored

    $stmt = $conn->prepare(
        "INSERT INTO remember_tokens (student_id, selector, token_hash, expires_at)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL " . REMEMBER_DAYS . " DAY))");
    $stmt->bind_param('iss', $studentDbId, $selector, $hash);
    $stmt->execute();
    $stmt->close();

    setRememberCookie($selector . ':' . $token, time() + REMEMBER_DAYS * 86400);
}


function clearRememberToken(){

    global $conn;

    if(!empty($_COOKIE['remember_me'])){

        $parts = explode(':', $_COOKIE['remember_me'], 2);

        if(preg_match('/^[a-f0-9]{12}$/', $parts[0])){
            $stmt = $conn->prepare("DELETE FROM remember_tokens WHERE selector = ?");
            $stmt->bind_param('s', $parts[0]);
            $stmt->execute();
            $stmt->close();
        }
    }

    setRememberCookie('', time() - 3600);
}


function tryRememberLogin(){

    global $conn;

    if(empty($_COOKIE['remember_me'])){
        return false;
    }

    $parts = explode(':', $_COOKIE['remember_me'], 2);

    if(count($parts) !== 2 ||
       !preg_match('/^[a-f0-9]{12}$/', $parts[0]) ||
       !preg_match('/^[a-f0-9]{64}$/', $parts[1])){

        setRememberCookie('', time() - 3600);
        return false;
    }

    $selector = $parts[0];
    $token    = $parts[1];

    $stmt = $conn->prepare(
        "SELECT t.id AS token_id, t.token_hash, s.id, s.student_id, s.name, s.email, s.role, s.last_login
         FROM remember_tokens t
         JOIN students s ON s.id = t.student_id
         WHERE t.selector = ? AND t.expires_at > NOW() LIMIT 1");
    $stmt->bind_param('s', $selector);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$row){
        setRememberCookie('', time() - 3600);
        return false;
    }

    if(!hash_equals($row['token_hash'], hash('sha256', $token))){

        /* selector is known but the token is wrong: remove all tokens of this user */

        $stmt = $conn->prepare("DELETE FROM remember_tokens WHERE student_id = ?");
        $stmt->bind_param('i', $row['id']);
        $stmt->execute();
        $stmt->close();

        setRememberCookie('', time() - 3600);
        return false;
    }

    /* valid: use the token once, then give a fresh one */

    $stmt = $conn->prepare("DELETE FROM remember_tokens WHERE id = ?");
    $stmt->bind_param('i', $row['token_id']);
    $stmt->execute();
    $stmt->close();

    loginUser($row);
    issueRememberToken((int)$row['id']);

    $stmt = $conn->prepare("UPDATE students SET last_login = NOW() WHERE id = ?");
    $stmt->bind_param('i', $row['id']);
    $stmt->execute();
    $stmt->close();

    return true;
}


/* ---------- guard for protected pages (redirects) ---------- */

function guardPage($role){

    $state = sessionState();

    if($state !== 'active'){
        header('Location: ../html-css/login.html' . ($state === 'expired' ? '?expired=1' : ''));
        exit;
    }

    $current = $_SESSION['user']['role'];

    if($current !== $role){
        header('Location: ' . ($current === 'admin' ? 'admin.php' : 'dashboard.php'));
        exit;
    }

    touchSession();
}


/* serve an HTML page from html-css/ after the guard passed */

function serveHtml($file){

    $html = file_get_contents(__DIR__ . '/../html-css/' . $file);
    $html = str_replace('<head>', "<head>\n<base href=\"../html-css/\">", $html);

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');

    echo $html;
}


/* guard for pages every logged-in user may open (student or admin) */

function guardLoggedIn(){

    $state = sessionState();

    if($state !== 'active'){
        header('Location: ../html-css/login.html' . ($state === 'expired' ? '?expired=1' : ''));
        exit;
    }

    touchSession();
}
