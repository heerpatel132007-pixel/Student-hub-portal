<?php
/*
   process.php
   Handles the Contact form and the Registration (profile) form.
   - validates and sanitizes everything on the server
   - saves each record in a JSON file inside the data/ folder
   - replies with JSON: { success, message, errors }
*/

header('Content-Type: application/json; charset=utf-8');


function respond($success, $message, $errors = [], $status = 200){

    http_response_code($status);

    echo json_encode([
        'success' => $success,
        'message' => $message,
        'errors'  => $errors
    ]);

    exit;
}


/* remove tags and control characters, trim and limit length */

function clean($value, $max = 255){

    if(!is_string($value)){
        return '';
    }

    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value);
    $value = trim($value);

    return mb_substr($value, 0, $max);
}


/* same as clean() but also joins extra spaces (for names etc.) */

function cleanLine($value, $max = 255){

    return preg_replace('/\s+/', ' ', clean($value, $max));
}


/* add one record to a JSON file (safe for two users at the same time) */

function saveRecord($file, $record, $uniqueKey = null){

    $dir = __DIR__ . '/data';

    if(!is_dir($dir)){
        mkdir($dir, 0755, true);
    }

    $fp = fopen($dir . '/' . $file, 'c+');

    if(!$fp){
        return 'error';
    }

    if(!flock($fp, LOCK_EX)){
        fclose($fp);
        return 'error';
    }

    $raw  = stream_get_contents($fp);
    $data = json_decode($raw !== '' ? $raw : '[]', true);

    if(!is_array($data)){
        $data = [];
    }

    if($uniqueKey !== null){

        foreach($data as $row){

            if(isset($row[$uniqueKey]) &&
               strtolower($row[$uniqueKey]) === strtolower($record[$uniqueKey])){

                flock($fp, LOCK_UN);
                fclose($fp);
                return 'duplicate';
            }
        }
    }

    $record['id'] = count($data) ? max(array_column($data, 'id')) + 1 : 1;
    $data[] = $record;

    ftruncate($fp, 0);
    rewind($fp);

    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($fp);

    flock($fp, LOCK_UN);
    fclose($fp);

    return 'ok';
}


/* ---------- only POST is allowed ---------- */

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    respond(false, 'Invalid request method.', [], 405);
}

$type = isset($_POST['form_type']) ? $_POST['form_type'] : '';


/* ================= CONTACT FORM ================= */

if($type === 'contact'){

    $name    = cleanLine($_POST['name'] ?? '', 50);
    $email   = clean($_POST['email'] ?? '', 100);
    $message = clean($_POST['message'] ?? '', 1000);

    $errors = [];

    if(!preg_match('/^[A-Za-z ]{2,50}$/', $name)){
        $errors['name'] = 'Enter a valid name using only letters.';
    }

    if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
        $errors['email'] = 'Enter a valid email address.';
    }

    if(mb_strlen($message) < 10){
        $errors['message'] = 'Message must be at least 10 characters.';
    }

    if($errors){
        respond(false, 'Please correct the errors and try again.', $errors, 422);
    }

    $result = saveRecord('contacts.json', [
        'name'    => $name,
        'email'   => $email,
        'message' => $message,
        'date'    => date('Y-m-d H:i:s')
    ]);

    if($result !== 'ok'){
        respond(false, 'Sorry, your message could not be saved. Please try again later.', [], 500);
    }

    respond(true, 'Thank you! Your message has been sent.');
}


/* ================= REGISTRATION (PROFILE) FORM ================= */

if($type === 'register'){

    $name      = cleanLine($_POST['name'] ?? '', 50);
    $studentId = clean($_POST['studentId'] ?? '', 20);
    $course    = clean($_POST['course'] ?? '', 10);
    $year      = clean($_POST['year'] ?? '', 1);
    $semester  = clean($_POST['semester'] ?? '', 2);
    $email     = clean($_POST['email'] ?? '', 100);
    $mobile    = clean($_POST['mobile'] ?? '', 10);
    $password  = $_POST['password'] ?? '';
    $confirm   = $_POST['confirmPassword'] ?? '';
    $gender    = clean($_POST['gender'] ?? '', 10);
    $address   = clean($_POST['address'] ?? '', 200);
    $terms     = isset($_POST['terms']) && $_POST['terms'] === 'yes';

    $errors = [];

    if(!preg_match('/^[A-Za-z ]{2,50}$/', $name)){
        $errors['name'] = 'Enter a valid name using only letters.';
    }

    if($studentId !== '' && !preg_match('/^[A-Za-z0-9]{3,20}$/', $studentId)){
        $errors['studentId'] = 'Student ID must be 3-20 letters or numbers.';
    }

    if(!in_array($course, ['CSE', 'IT', 'CE', 'DS'], true)){
        $errors['course'] = 'Please select a valid course.';
    }

    if(!preg_match('/^[1-4]$/', $year)){
        $errors['year'] = 'Please select a valid year.';
    }

    if($semester !== '' && (!ctype_digit($semester) || (int)$semester < 1 || (int)$semester > 8)){
        $errors['semester'] = 'Semester must be a number from 1 to 8.';
    }

    if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
        $errors['email'] = 'Enter a valid email address.';
    }

    if(!preg_match('/^[6-9][0-9]{9}$/', $mobile)){
        $errors['mobile'] = 'Enter a valid 10-digit mobile number.';
    }

    if(!is_string($password) ||
       !preg_match('/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*?&]).{8,}$/', $password)){
        $errors['password'] = 'Password must be 8+ characters with letter, number and special character.';
    }

    if($password !== $confirm){
        $errors['confirmPassword'] = 'Passwords do not match.';
    }

    if(!in_array($gender, ['Male', 'Female', 'Other'], true)){
        $errors['gender'] = 'Please select your gender.';
    }

    if(!$terms){
        $errors['terms'] = 'Please accept the terms and conditions.';
    }

    if($errors){
        respond(false, 'Please correct the errors and try again.', $errors, 422);
    }

    $result = saveRecord('registrations.json', [
        'name'      => $name,
        'studentId' => $studentId,
        'course'    => $course,
        'year'      => (int)$year,
        'semester'  => $semester === '' ? null : (int)$semester,
        'email'     => $email,
        'mobile'    => $mobile,
        'password'  => password_hash($password, PASSWORD_DEFAULT),   // never stored as plain text
        'gender'    => $gender,
        'address'   => $address,
        'date'      => date('Y-m-d H:i:s')
    ], 'email');

    if($result === 'duplicate'){
        respond(false, 'This email is already registered.', ['email' => 'This email is already registered.'], 409);
    }

    if($result !== 'ok'){
        respond(false, 'Sorry, your profile could not be saved. Please try again later.', [], 500);
    }

    respond(true, 'Your profile has been saved successfully.');
}


respond(false, 'Unknown form.', [], 400);