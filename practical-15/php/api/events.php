<?php
/*
   api/events.php - simple JSON API for events (consumed with the Fetch API)

   GET    events.php            list events (optional ?q=search)         public
   GET    events.php?id=3       one event                                public
   POST   events.php            add an event     (JSON body)             admin
   PUT    events.php?id=3       update an event  (JSON body)             admin
   DELETE events.php?id=3       delete an event                          admin

   Reply (always JSON):  { "success": true/false, "message": "...", "data": ..., "errors": {...} }
   Status codes: 200, 201, 400, 401, 403, 404, 405, 409, 415, 422, 500

   Writing needs an admin session cookie. Requests must be application/json, which a
   browser only sends cross-site after a permission check (CORS), so other websites cannot use it.
*/

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../auth.php';

startSecureSession();


function respond($status, $success, $message, $extra = []){

    http_response_code($status);

    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $extra), JSON_UNESCAPED_UNICODE);

    exit;
}


$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if(!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)){
    header('Allow: GET, POST, PUT, DELETE');
    respond(405, false, 'Method not allowed.');
}


/* ---------- helpers ---------- */

function clean($value, $max = 255){

    if(!is_string($value)){
        return '';
    }

    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
    $value = trim($value);

    return mb_substr($value, 0, $max);
}


/* one event as an array (or null) */

function findEvent($conn, $id){

    $stmt = $conn->prepare(
        "SELECT e.id, e.title, e.description, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
                e.location, e.seats, e.poster,
                (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered,
                DATE_FORMAT(e.updated_at, '%Y-%m-%d %H:%i') AS updated_at
         FROM events e WHERE e.id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return $row ? shapeEvent($row) : null;
}


function shapeEvent($row){

    $row['id']         = (int)$row['id'];
    $row['seats']      = (int)$row['seats'];
    $row['registered'] = (int)$row['registered'];
    $row['seats_left'] = $row['seats'] - $row['registered'];

    return $row;
}


function validateEvent($in, &$d){

    $errors = [];

    $d = [
        'title'       => preg_replace('/\s+/', ' ', clean($in['title'] ?? '', 100)),
        'description' => clean($in['description'] ?? '', 255),
        'event_date'  => clean((string)($in['event_date'] ?? ''), 10),
        'location'    => preg_replace('/\s+/', ' ', clean($in['location'] ?? '', 100)),
        'seats'       => clean((string)($in['seats'] ?? ''), 5)
    ];

    if(mb_strlen($d['title']) < 3){
        $errors['title'] = 'Title must be at least 3 characters.';
    }

    $okDate = false;

    if(preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d['event_date'], $m)){
        $okDate = checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
    }

    if(!$okDate){
        $errors['event_date'] = 'Enter a valid date (YYYY-MM-DD).';
    }

    if(mb_strlen($d['location']) < 2){
        $errors['location'] = 'Enter the event location.';
    }

    if(!ctype_digit($d['seats']) || (int)$d['seats'] < 1 || (int)$d['seats'] > 5000){
        $errors['seats'] = 'Seats must be a number from 1 to 5000.';
    }

    return $errors;
}


/* same title on the same date already used by another event? */

function isDuplicate($conn, $title, $date, $ignoreId){

    $stmt = $conn->prepare("SELECT id FROM events WHERE title = ? AND event_date = ? AND id <> ? LIMIT 1");
    $stmt->bind_param('ssi', $title, $date, $ignoreId);
    $stmt->execute();
    $stmt->store_result();
    $found = $stmt->num_rows > 0;
    $stmt->close();

    return $found;
}


/* ================= GET (public) ================= */

if($method === 'GET'){

    if($id > 0){

        $event = findEvent($conn, $id);

        if(!$event){
            respond(404, false, 'Event not found.');
        }

        respond(200, true, 'Event loaded.', ['data' => $event]);
    }

    $q = trim($_GET['q'] ?? '');

    $sql = "SELECT e.id, e.title, e.description, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
                   e.location, e.seats, e.poster,
                   (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered,
                   DATE_FORMAT(e.updated_at, '%Y-%m-%d %H:%i') AS updated_at
            FROM events e";

    if($q !== ''){

        $like = '%' . addcslashes($q, '%_\\') . '%';

        $stmt = $conn->prepare($sql . " WHERE e.title LIKE ? OR e.location LIKE ? ORDER BY e.event_date, e.id");
        $stmt->bind_param('ss', $like, $like);

    }else{

        $stmt = $conn->prepare($sql . " ORDER BY e.event_date, e.id");
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $rows = [];

    while($row = $result->fetch_assoc()){
        $rows[] = shapeEvent($row);
    }

    respond(200, true, count($rows) . ' event(s) found.', ['count' => count($rows), 'data' => $rows]);
}


/* ================= POST / PUT / DELETE: admin only ================= */

if(sessionState() !== 'active'){
    respond(401, false, 'Please log in as an admin first.');
}

if($_SESSION['user']['role'] !== 'admin'){
    respond(403, false, 'Access denied. Admins only.');
}

touchSession();


$input = [];

if($method !== 'DELETE'){

    if(stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false){
        respond(415, false, 'Content-Type must be application/json.');
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if(!is_array($input)){
        respond(400, false, 'Invalid JSON body.');
    }
}


/* ----- POST: add ----- */

if($method === 'POST'){

    $errors = validateEvent($input, $d);

    if($errors){
        respond(422, false, 'Please correct the errors and try again.', ['errors' => $errors]);
    }

    if(isDuplicate($conn, $d['title'], $d['event_date'], 0)){
        respond(409, false, 'An event with this title and date already exists.', ['errors' => ['title' => 'This event already exists on that date.']]);
    }

    $seats = (int)$d['seats'];

    $stmt = $conn->prepare("INSERT INTO events (title, description, event_date, location, seats) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('ssssi', $d['title'], $d['description'], $d['event_date'], $d['location'], $seats);

    if(!$stmt->execute()){
        respond(500, false, 'Database error: the event could not be added.');
    }

    $newId = $conn->insert_id;

    header('Location: events.php?id=' . $newId);

    respond(201, true, 'Event "' . $d['title'] . '" was added successfully.', ['data' => findEvent($conn, $newId)]);
}


/* ----- PUT and DELETE need an id ----- */

if($id < 1){
    respond(400, false, 'An event id is required (events.php?id=3).');
}

$existing = findEvent($conn, $id);

if(!$existing){
    respond(404, false, 'Event not found.');
}


/* ----- PUT: update ----- */

if($method === 'PUT'){

    $errors = validateEvent($input, $d);

    if(!$errors && (int)$d['seats'] < $existing['registered']){
        $errors['seats'] = 'Seats cannot be less than the ' . $existing['registered'] . ' student(s) already registered.';
    }

    if($errors){
        respond(422, false, 'Please correct the errors and try again.', ['errors' => $errors]);
    }

    if(isDuplicate($conn, $d['title'], $d['event_date'], $id)){
        respond(409, false, 'An event with this title and date already exists.', ['errors' => ['title' => 'This event already exists on that date.']]);
    }

    $seats = (int)$d['seats'];

    $stmt = $conn->prepare("UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, seats = ? WHERE id = ?");
    $stmt->bind_param('ssssii', $d['title'], $d['description'], $d['event_date'], $d['location'], $seats, $id);

    if(!$stmt->execute()){
        respond(500, false, 'Database error: the event could not be updated.');
    }

    respond(200, true, 'Event "' . $d['title'] . '" was updated successfully.', ['data' => findEvent($conn, $id)]);
}


/* ----- DELETE ----- */

$stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
$stmt->bind_param('i', $id);

if(!$stmt->execute() || $stmt->affected_rows < 1){
    respond(500, false, 'Database error: the event could not be deleted.');
}

/* remove the poster file too (same safe name check as practical 12) */

if($existing['poster'] && preg_match('/^poster_[A-Za-z0-9_]+\.(jpg|png|webp)$/', $existing['poster'])){

    $file = __DIR__ . '/../../uploads/posters/' . $existing['poster'];

    if(is_file($file)){
        unlink($file);
    }
}

respond(200, true, 'Event "' . $existing['title'] . '" was deleted successfully.', ['data' => ['id' => $id]]);
