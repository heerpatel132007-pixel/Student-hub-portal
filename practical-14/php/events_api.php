<?php
/*
   events_api.php - Event management (admin only)
   action = list | get | add | update | delete
   - every database operation uses MySQLi prepared statements
   - poster upload: file type + file size + real image check, random file name
   - replies with JSON: { success, message, errors, ... }
*/

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

define('POSTER_DIR', __DIR__ . '/../uploads/posters/');
define('POSTER_MAX_BYTES', 2 * 1024 * 1024);          // 2 MB


function out($success, $message, $extra = [], $status = 200){

    http_response_code($status);

    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message,
        'errors'  => []
    ], $extra), JSON_UNESCAPED_UNICODE);

    exit;
}


/* ---------- only logged-in admins ---------- */

if(sessionState() !== 'active'){
    out(false, 'Your session has expired. Please log in again.', ['expired' => true], 401);
}

if($_SESSION['user']['role'] !== 'admin'){
    out(false, 'Access denied. Admins only.', [], 403);
}

touchSession();


/* a file bigger than post_max_size arrives with an empty $_POST */

if($_SERVER['REQUEST_METHOD'] === 'POST' && empty($_POST) && empty($_FILES) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0){
    out(false, 'The upload is too large. The poster must be 2 MB or smaller.', ['errors' => ['poster' => 'Poster is too large. Maximum size is 2 MB.']], 413);
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

function cleanLine($value, $max = 255){
    return preg_replace('/\s+/', ' ', clean($value, $max));
}


/* validate the event fields */

function validateEvent($in, &$d){

    $errors = [];

    $d = [
        'title'       => cleanLine($in['title'] ?? '', 100),
        'description' => clean($in['description'] ?? '', 255),
        'event_date'  => clean($in['event_date'] ?? '', 10),
        'location'    => cleanLine($in['location'] ?? '', 100),
        'seats'       => clean($in['seats'] ?? '', 5)
    ];

    if(mb_strlen($d['title']) < 3){
        $errors['title'] = 'Title must be at least 3 characters.';
    }

    $okDate = false;

    if(preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $d['event_date'], $m)){
        $okDate = checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
    }

    if(!$okDate){
        $errors['event_date'] = 'Enter a valid event date.';
    }

    if(mb_strlen($d['location']) < 2){
        $errors['location'] = 'Enter the event location.';
    }

    if(!ctype_digit($d['seats']) || (int)$d['seats'] < 1 || (int)$d['seats'] > 5000){
        $errors['seats'] = 'Seats must be a number from 1 to 5000.';
    }

    return $errors;
}


/*
   Check and save the uploaded poster.
   returns: null = no file sent, false = rejected ($error says why), string = saved file name
*/

function savePoster($file, &$error){

    if(!$file || $file['error'] === UPLOAD_ERR_NO_FILE){
        return null;
    }

    if($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE){
        $error = 'Poster is too large. Maximum size is 2 MB.';
        return false;
    }

    if($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])){
        $error = 'Poster upload failed. Please try again.';
        return false;
    }

    /* 1) file size */

    if($file['size'] > POSTER_MAX_BYTES){
        $error = 'Poster is too large. Maximum size is 2 MB.';
        return false;
    }

    /* 2) file type: extension and real content type must both be allowed */

    $allowed = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    if(!isset($allowed[$ext])){
        $error = 'Poster must be a JPG, PNG or WEBP image.';
        return false;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    if($mime !== $allowed[$ext]){
        $error = 'The file content does not match a JPG, PNG or WEBP image.';
        return false;
    }

    if(@getimagesize($file['tmp_name']) === false){
        $error = 'The uploaded file is not a valid image.';
        return false;
    }

    /* 3) save with a random name (the original name is never used) */

    if(!is_dir(POSTER_DIR)){
        mkdir(POSTER_DIR, 0755, true);
    }

    $name = 'poster_' . bin2hex(random_bytes(8)) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);

    if(!move_uploaded_file($file['tmp_name'], POSTER_DIR . $name)){
        $error = 'The poster could not be saved on the server.';
        return false;
    }

    return $name;
}


function deletePosterFile($name){

    if($name && preg_match('/^poster_[A-Za-z0-9_]+\.(jpg|png|webp)$/', $name)){

        $path = POSTER_DIR . $name;

        if(is_file($path)){
            unlink($path);
        }
    }
}


$COLUMNS = "e.id, e.title, e.description, DATE_FORMAT(e.event_date, '%Y-%m-%d') AS event_date,
            e.location, e.seats, e.poster,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered";

$action = $_GET['action'] ?? ($_POST['action'] ?? '');


/* ================= LIST (search + filter + sort + pages) ================= */

if($action === 'list'){

    $q        = trim($_GET['q'] ?? '');
    $location = trim($_GET['location'] ?? '');
    $when     = $_GET['when'] ?? '';
    $page     = max(1, (int)($_GET['page'] ?? 1));
    $size     = 5;

    $sortColumns = ['date' => 'e.event_date', 'title' => 'e.title', 'seats' => 'e.seats', 'id' => 'e.id'];
    $sortParts   = explode(':', $_GET['sort'] ?? 'date:asc');
    $sortCol     = $sortColumns[$sortParts[0]] ?? 'e.event_date';
    $sortDir     = (($sortParts[1] ?? 'asc') === 'desc') ? 'DESC' : 'ASC';

    $where  = [];
    $types  = '';
    $params = [];

    if($q !== ''){

        $like = '%' . addcslashes($q, '%_\\') . '%';

        $where[]  = '(e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
        $types   .= 'sss';
        array_push($params, $like, $like, $like);
    }

    if($location !== ''){
        $where[]  = 'e.location = ?';
        $types   .= 's';
        $params[] = $location;
    }

    if($when === 'upcoming'){
        $where[] = 'e.event_date >= CURDATE()';
    }

    if($when === 'past'){
        $where[] = 'e.event_date < CURDATE()';
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM events e $whereSql");

    if($params){
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $total = (int)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $pages = max(1, (int)ceil($total / $size));
    $page  = min($page, $pages);
    $start = ($page - 1) * $size;

    $stmt = $conn->prepare("SELECT $COLUMNS FROM events e $whereSql ORDER BY $sortCol $sortDir, e.id ASC LIMIT ? OFFSET ?");

    $listParams = array_merge($params, [$size, $start]);

    $stmt->bind_param($types . 'ii', ...$listParams);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $rows = [];

    while($row = $result->fetch_assoc()){
        $row['id']         = (int)$row['id'];
        $row['seats']      = (int)$row['seats'];
        $row['registered'] = (int)$row['registered'];
        $rows[] = $row;
    }

    /* locations for the filter / form suggestions */

    $locations = [];
    $res = $conn->query("SELECT DISTINCT location FROM events ORDER BY location");

    while($r = $res->fetch_assoc()){
        $locations[] = $r['location'];
    }

    out(true, $total . ' event(s) found.', [
        'rows'      => $rows,
        'total'     => $total,
        'page'      => $page,
        'pages'     => $pages,
        'locations' => $locations
    ]);
}


/* ================= GET ONE (for the edit form) ================= */

if($action === 'get'){

    $id = (int)($_GET['id'] ?? 0);

    $stmt = $conn->prepare("SELECT $COLUMNS FROM events e WHERE e.id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$row){
        out(false, 'Event not found.', [], 404);
    }

    out(true, 'Event loaded.', ['event' => $row]);
}


/* everything below changes data: POST only */

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    out(false, 'Invalid request method.', [], 405);
}


/* ================= ADD ================= */

if($action === 'add'){

    $errors = validateEvent($_POST, $d);

    $posterError = '';
    $poster = null;

    if(!$errors){

        $poster = savePoster($_FILES['poster'] ?? null, $posterError);

        if($poster === false){
            $errors['poster'] = $posterError;
        }
    }

    if($errors){
        out(false, 'Please correct the errors and try again.', ['errors' => $errors], 422);
    }

    $seats = (int)$d['seats'];

    $stmt = $conn->prepare("INSERT INTO events (title, description, event_date, location, seats, poster) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('ssssis', $d['title'], $d['description'], $d['event_date'], $d['location'], $seats, $poster);

    if(!$stmt->execute()){

        deletePosterFile($poster);          // do not keep an unused file

        out(false, 'Database error: the event could not be added.', [], 500);
    }

    out(true, 'Event "' . $d['title'] . '" was added successfully.', ['id' => $conn->insert_id], 201);
}


/* ================= UPDATE ================= */

if($action === 'update'){

    $id = (int)($_POST['id'] ?? 0);

    $stmt = $conn->prepare("SELECT poster, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id) AS registered FROM events WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$existing){
        out(false, 'Event not found.', [], 404);
    }

    $errors = validateEvent($_POST, $d);

    if(!$errors && (int)$d['seats'] < (int)$existing['registered']){
        $errors['seats'] = 'Seats cannot be less than the ' . $existing['registered'] . ' student(s) already registered.';
    }

    $posterError = '';
    $newPoster = null;

    if(!$errors){

        $newPoster = savePoster($_FILES['poster'] ?? null, $posterError);

        if($newPoster === false){
            $errors['poster'] = $posterError;
        }
    }

    if($errors){
        out(false, 'Please correct the errors and try again.', ['errors' => $errors], 422);
    }

    $removeOld = ($newPoster !== null) || (($_POST['remove_poster'] ?? '') === 'yes');

    $poster = $newPoster !== null ? $newPoster
            : ($removeOld ? null : $existing['poster']);

    $seats = (int)$d['seats'];

    $stmt = $conn->prepare("UPDATE events SET title = ?, description = ?, event_date = ?, location = ?, seats = ?, poster = ? WHERE id = ?");
    $stmt->bind_param('ssssisi', $d['title'], $d['description'], $d['event_date'], $d['location'], $seats, $poster, $id);

    if(!$stmt->execute()){

        deletePosterFile($newPoster);

        out(false, 'Database error: the event could not be updated.', [], 500);
    }

    if($removeOld){
        deletePosterFile($existing['poster']);
    }

    out(true, 'Event "' . $d['title'] . '" was updated successfully.');
}


/* ================= DELETE ================= */

if($action === 'delete'){

    $id = (int)($_POST['id'] ?? 0);

    $stmt = $conn->prepare("SELECT title, poster, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = events.id) AS registered FROM events WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$existing){
        out(false, 'Event not found. It may already be deleted.', [], 404);
    }

    $stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
    $stmt->bind_param('i', $id);

    if(!$stmt->execute() || $stmt->affected_rows < 1){
        out(false, 'Database error: the event could not be deleted.', [], 500);
    }

    deletePosterFile($existing['poster']);

    $note = (int)$existing['registered'] > 0
          ? ' ' . $existing['registered'] . ' registration(s) were also removed.'
          : '';

    out(true, 'Event "' . $existing['title'] . '" was deleted successfully.' . $note);
}


out(false, 'Unknown action.', [], 400);
