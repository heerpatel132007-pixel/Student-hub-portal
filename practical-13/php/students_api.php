<?php
/*
   students_api.php - Student management (admin only)
   action = list | get | add | update | delete
   - every database operation uses MySQLi prepared statements
   - replies with JSON: { success, message, errors, ... }
*/

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();


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

$COURSES = ['CSE', 'IT', 'CE', 'DS'];
$GENDERS = ['Male', 'Female', 'Other'];
$ROLES   = ['student', 'admin'];

$COLUMNS = "id, student_id, name, course, year, semester, email, mobile, gender, address, role,
            IFNULL(DATE_FORMAT(last_login, '%Y-%m-%d %H:%i'), 'Never') AS last_login,
            DATE_FORMAT(created_at, '%Y-%m-%d') AS created";


/* validate the form values (same rules as the registration form) */

function validateStudent($in, $isNew, &$data){

    global $COURSES, $GENDERS, $ROLES;

    $errors = [];

    $data = [
        'studentId' => clean($in['studentId'] ?? '', 20),
        'name'      => cleanLine($in['name'] ?? '', 50),
        'course'    => clean($in['course'] ?? '', 10),
        'year'      => clean($in['year'] ?? '', 1),
        'semester'  => clean($in['semester'] ?? '', 2),
        'email'     => clean($in['email'] ?? '', 100),
        'mobile'    => clean($in['mobile'] ?? '', 10),
        'gender'    => clean($in['gender'] ?? '', 10),
        'address'   => clean($in['address'] ?? '', 200),
        'role'      => clean($in['role'] ?? 'student', 10),
        'password'  => is_string($in['password'] ?? '') ? ($in['password'] ?? '') : ''
    ];

    if(!preg_match('/^[A-Za-z0-9]{3,20}$/', $data['studentId'])){
        $errors['studentId'] = 'Student ID must be 3-20 letters or numbers.';
    }

    if(!preg_match('/^[A-Za-z ]{2,50}$/', $data['name'])){
        $errors['name'] = 'Enter a valid name using only letters.';
    }

    if(!in_array($data['course'], $COURSES, true)){
        $errors['course'] = 'Please select a valid course.';
    }

    if(!preg_match('/^[1-4]$/', $data['year'])){
        $errors['year'] = 'Please select a valid year.';
    }

    if($data['semester'] !== '' && (!ctype_digit($data['semester']) || (int)$data['semester'] < 1 || (int)$data['semester'] > 8)){
        $errors['semester'] = 'Semester must be a number from 1 to 8.';
    }

    if(!filter_var($data['email'], FILTER_VALIDATE_EMAIL)){
        $errors['email'] = 'Enter a valid email address.';
    }

    if(!preg_match('/^[6-9][0-9]{9}$/', $data['mobile'])){
        $errors['mobile'] = 'Enter a valid 10-digit mobile number.';
    }

    if(!in_array($data['gender'], $GENDERS, true)){
        $errors['gender'] = 'Please select the gender.';
    }

    if(!in_array($data['role'], $ROLES, true)){
        $errors['role'] = 'Please select a valid role.';
    }

    $passwordRule = '/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*?&]).{8,}$/';

    if($isNew || $data['password'] !== ''){

        if(!preg_match($passwordRule, $data['password'])){
            $errors['password'] = 'Password must be 8+ characters with letter, number and special character.';
        }
    }

    return $errors;
}


/* is the email / Student ID already used by another student? */

function findDuplicates($conn, $email, $studentId, $ignoreId){

    $errors = [];

    $stmt = $conn->prepare("SELECT email, student_id FROM students WHERE (email = ? OR student_id = ?) AND id <> ?");
    $stmt->bind_param('ssi', $email, $studentId, $ignoreId);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    while($row = $result->fetch_assoc()){

        if(strtolower($row['email']) === strtolower($email)){
            $errors['email'] = 'This email is already registered';
        }

        if(strtolower((string)$row['student_id']) === strtolower($studentId)){
            $errors['studentId'] = 'This student number is already registered';
        }
    }

    return $errors;
}


$action = $_GET['action'] ?? ($_POST['action'] ?? '');


/* ================= LIST (search + filter + sort + pages) ================= */

if($action === 'list'){

    $q      = trim($_GET['q'] ?? '');
    $course = $_GET['course'] ?? '';
    $year   = $_GET['year'] ?? '';
    $role   = $_GET['role'] ?? '';
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $size   = 5;

    $sortColumns = ['id' => 'id', 'name' => 'name', 'course' => 'course', 'year' => 'year', 'created_at' => 'created_at'];
    $sortParts   = explode(':', $_GET['sort'] ?? 'id:asc');
    $sortCol     = $sortColumns[$sortParts[0]] ?? 'id';
    $sortDir     = (($sortParts[1] ?? 'asc') === 'desc') ? 'DESC' : 'ASC';

    $where  = [];
    $types  = '';
    $params = [];

    if($q !== ''){

        $like = '%' . addcslashes($q, '%_\\') . '%';

        $where[]  = '(name LIKE ? OR student_id LIKE ? OR email LIKE ?)';
        $types   .= 'sss';
        array_push($params, $like, $like, $like);
    }

    if(in_array($course, $COURSES, true)){
        $where[]  = 'course = ?';
        $types   .= 's';
        $params[] = $course;
    }

    if(preg_match('/^[1-4]$/', $year)){
        $where[]  = 'year = ?';
        $types   .= 'i';
        $params[] = (int)$year;
    }

    if(in_array($role, $ROLES, true)){
        $where[]  = 'role = ?';
        $types   .= 's';
        $params[] = $role;
    }

    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    /* total rows */

    $stmt = $conn->prepare("SELECT COUNT(*) AS total FROM students $whereSql");

    if($params){
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $total = (int)$stmt->get_result()->fetch_assoc()['total'];
    $stmt->close();

    $pages = max(1, (int)ceil($total / $size));
    $page  = min($page, $pages);
    $start = ($page - 1) * $size;

    /* one page of rows */

    $stmt = $conn->prepare("SELECT $COLUMNS FROM students $whereSql ORDER BY $sortCol $sortDir, id ASC LIMIT ? OFFSET ?");

    $listTypes  = $types . 'ii';
    $listParams = array_merge($params, [$size, $start]);

    $stmt->bind_param($listTypes, ...$listParams);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    $rows = [];

    while($row = $result->fetch_assoc()){
        $row['id']   = (int)$row['id'];
        $row['year'] = (int)$row['year'];
        $rows[] = $row;
    }

    out(true, $total . ' student(s) found.', [
        'rows'  => $rows,
        'total' => $total,
        'page'  => $page,
        'pages' => $pages,
        'me'    => $_SESSION['user']['id']
    ]);
}


/* ================= GET ONE (for the edit form) ================= */

if($action === 'get'){

    $id = (int)($_GET['id'] ?? 0);

    $stmt = $conn->prepare("SELECT $COLUMNS FROM students WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$row){
        out(false, 'Student not found.', [], 404);
    }

    out(true, 'Student loaded.', ['student' => $row]);
}


/* everything below changes data: POST only */

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    out(false, 'Invalid request method.', [], 405);
}


/* ================= ADD ================= */

if($action === 'add'){

    $errors = validateStudent($_POST, true, $d);

    if(!$errors){
        $errors = findDuplicates($conn, $d['email'], $d['studentId'], 0);
    }

    if($errors){
        out(false, 'Please correct the errors and try again.', ['errors' => $errors], 422);
    }

    $hash = password_hash($d['password'], PASSWORD_DEFAULT);
    $sem  = $d['semester'] === '' ? null : (int)$d['semester'];
    $yr   = (int)$d['year'];

    $stmt = $conn->prepare(
        "INSERT INTO students (student_id, name, course, year, semester, email, mobile, password, gender, address, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('sssiissssss', $d['studentId'], $d['name'], $d['course'], $yr, $sem,
                      $d['email'], $d['mobile'], $hash, $d['gender'], $d['address'], $d['role']);

    if(!$stmt->execute()){

        if($conn->errno === 1062){
            out(false, 'This email or Student ID is already registered.', [], 409);
        }

        out(false, 'Database error: the student could not be added.', [], 500);
    }

    out(true, 'Student "' . $d['name'] . '" was added successfully.', ['id' => $conn->insert_id], 201);
}


/* ================= UPDATE ================= */

if($action === 'update'){

    $id = (int)($_POST['id'] ?? 0);

    $stmt = $conn->prepare("SELECT role FROM students WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$existing){
        out(false, 'Student not found.', [], 404);
    }

    $errors = validateStudent($_POST, false, $d);

    if(!$errors){
        $errors = findDuplicates($conn, $d['email'], $d['studentId'], $id);
    }

    if(!$errors && $id === (int)$_SESSION['user']['id'] && $d['role'] !== $existing['role']){
        $errors['role'] = 'You cannot change your own role.';
    }

    if($errors){
        out(false, 'Please correct the errors and try again.', ['errors' => $errors], 422);
    }

    $sem = $d['semester'] === '' ? null : (int)$d['semester'];
    $yr  = (int)$d['year'];

    if($d['password'] !== ''){

        $hash = password_hash($d['password'], PASSWORD_DEFAULT);

        $stmt = $conn->prepare(
            "UPDATE students SET student_id = ?, name = ?, course = ?, year = ?, semester = ?, email = ?,
                    mobile = ?, gender = ?, address = ?, role = ?, password = ? WHERE id = ?");
        $stmt->bind_param('sssiissssssi', $d['studentId'], $d['name'], $d['course'], $yr, $sem, $d['email'],
                          $d['mobile'], $d['gender'], $d['address'], $d['role'], $hash, $id);

    }else{

        $stmt = $conn->prepare(
            "UPDATE students SET student_id = ?, name = ?, course = ?, year = ?, semester = ?, email = ?,
                    mobile = ?, gender = ?, address = ?, role = ? WHERE id = ?");
        $stmt->bind_param('sssiisssssi', $d['studentId'], $d['name'], $d['course'], $yr, $sem, $d['email'],
                          $d['mobile'], $d['gender'], $d['address'], $d['role'], $id);
    }

    if(!$stmt->execute()){

        if($conn->errno === 1062){
            out(false, 'This email or Student ID is already registered.', [], 409);
        }

        out(false, 'Database error: the student could not be updated.', [], 500);
    }

    if($id === (int)$_SESSION['user']['id']){
        $_SESSION['user']['name']  = $d['name'];
        $_SESSION['user']['email'] = $d['email'];
    }

    out(true, 'Student "' . $d['name'] . '" was updated successfully.');
}


/* ================= DELETE ================= */

if($action === 'delete'){

    $id = (int)($_POST['id'] ?? 0);

    if($id === (int)$_SESSION['user']['id']){
        out(false, 'You cannot delete your own account.', [], 403);
    }

    $stmt = $conn->prepare("SELECT name FROM students WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $existing = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if(!$existing){
        out(false, 'Student not found. It may already be deleted.', [], 404);
    }

    $stmt = $conn->prepare("DELETE FROM students WHERE id = ?");
    $stmt->bind_param('i', $id);

    if(!$stmt->execute() || $stmt->affected_rows < 1){
        out(false, 'Database error: the student could not be deleted.', [], 500);
    }

    out(true, 'Student "' . $existing['name'] . '" was deleted successfully.');
}


out(false, 'Unknown action.', [], 400);
