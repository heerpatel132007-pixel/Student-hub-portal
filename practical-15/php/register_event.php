<?php
/* register_event.php - register a student for an event (MySQL, prepared statements) */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

function out($success, $message, $status = 200){
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message, 'errors' => []]);
    exit;
}

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    out(false, 'Invalid request method.', 405);
}

if(sessionState() !== 'active'){
    out(false, 'Please log in to register for events.', 401);
}

if($_SESSION['user']['role'] !== 'student'){
    out(false, 'Only students can register for events.', 403);
}

$studentCode = $_SESSION['user']['studentId'];       // the logged-in student, never a typed ID
$eventId     = (int)($_POST['event_id'] ?? 0);

if(!preg_match('/^[A-Za-z0-9]{3,20}$/', $studentCode) || $eventId < 1){
    out(false, 'Enter a valid Student ID.', 422);
}

/* find the student */
$stmt = $conn->prepare("SELECT id FROM students WHERE student_id = ?");
$stmt->bind_param('s', $studentCode);
$stmt->execute();
$student = $stmt->get_result()->fetch_assoc();
$stmt->close();

if(!$student){
    out(false, 'Student ID not found. Please register on the Profile page first.', 404);
}

/* check the event and its free seats */
$stmt = $conn->prepare(
    "SELECT e.seats - COUNT(r.id) AS seats_left
     FROM events e LEFT JOIN registrations r ON r.event_id = e.id
     WHERE e.id = ? GROUP BY e.id");
$stmt->bind_param('i', $eventId);
$stmt->execute();
$event = $stmt->get_result()->fetch_assoc();
$stmt->close();

if(!$event){
    out(false, 'Event not found.', 404);
}

if((int)$event['seats_left'] <= 0){
    out(false, 'Sorry, this event is full.', 409);
}

/* insert the registration */
$stmt = $conn->prepare("INSERT INTO registrations (student_id, event_id) VALUES (?, ?)");
$stmt->bind_param('ii', $student['id'], $eventId);

if(!$stmt->execute()){
    if($conn->errno === 1062){
        out(false, 'You are already registered for this event.', 409);
    }
    out(false, 'Could not save registration. Please try again.', 500);
}

out(true, 'You are registered for the event!');
