<?php
/*
   admin_stats.php - numbers for the admin dashboard (admin only)
   users, students, events, registrations, seats, students per course,
   most popular events and the latest registrations.
   Every query is a MySQLi prepared statement.
*/

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

if(sessionState() !== 'active'){
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Your session has expired. Please log in again.', 'expired' => true]);
    exit;
}

if($_SESSION['user']['role'] !== 'admin'){
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Admins only.']);
    exit;
}

touchSession();


/* one number from a COUNT(*) / SUM() query */

function scalar($conn, $sql){

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_row();
    $stmt->close();

    return (int)$row[0];
}


/* many rows */

function rows($conn, $sql){

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $list = [];

    while($row = $result->fetch_assoc()){
        $list[] = $row;
    }

    return $list;
}


$seatsTotal = scalar($conn, "SELECT IFNULL(SUM(seats), 0) FROM events");
$regTotal   = scalar($conn, "SELECT COUNT(*) FROM registrations");

$perCourse = rows($conn, "SELECT course, COUNT(*) AS total FROM students WHERE role = 'student' GROUP BY course ORDER BY course");

foreach($perCourse as &$c){
    $c['total'] = (int)$c['total'];
}
unset($c);

$topEvents = rows($conn,
    "SELECT e.title, e.seats, COUNT(r.id) AS registered
     FROM events e LEFT JOIN registrations r ON r.event_id = e.id
     GROUP BY e.id ORDER BY registered DESC, e.event_date LIMIT 5");

foreach($topEvents as &$t){
    $t['seats']      = (int)$t['seats'];
    $t['registered'] = (int)$t['registered'];
}
unset($t);

$latest = rows($conn,
    "SELECT r.id, s.name, s.student_id, s.course, e.title,
            DATE_FORMAT(r.registered_at, '%Y-%m-%d %H:%i') AS registered_at
     FROM registrations r
     JOIN students s ON s.id = r.student_id
     JOIN events   e ON e.id = r.event_id
     ORDER BY r.registered_at DESC, r.id DESC LIMIT 8");

echo json_encode([
    'success'   => true,
    'generated' => date('Y-m-d H:i:s'),
    'users' => [
        'total'        => scalar($conn, "SELECT COUNT(*) FROM students"),
        'students'     => scalar($conn, "SELECT COUNT(*) FROM students WHERE role = 'student'"),
        'admins'       => scalar($conn, "SELECT COUNT(*) FROM students WHERE role = 'admin'"),
        'new_week'     => scalar($conn, "SELECT COUNT(*) FROM students WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
        'active_today' => scalar($conn, "SELECT COUNT(*) FROM students WHERE last_login >= CURDATE()"),
        'never_logged' => scalar($conn, "SELECT COUNT(*) FROM students WHERE last_login IS NULL")
    ],
    'events' => [
        'total'    => scalar($conn, "SELECT COUNT(*) FROM events"),
        'upcoming' => scalar($conn, "SELECT COUNT(*) FROM events WHERE event_date >= CURDATE()"),
        'past'     => scalar($conn, "SELECT COUNT(*) FROM events WHERE event_date < CURDATE()")
    ],
    'registrations' => [
        'total' => $regTotal,
        'today' => scalar($conn, "SELECT COUNT(*) FROM registrations WHERE registered_at >= CURDATE()")
    ],
    'seats' => [
        'total'   => $seatsTotal,
        'filled'  => $regTotal,
        'percent' => $seatsTotal > 0 ? round($regTotal / $seatsTotal * 100) : 0
    ],
    'per_course' => $perCourse,
    'top_events' => $topEvents,
    'latest'     => $latest
], JSON_UNESCAPED_UNICODE);
