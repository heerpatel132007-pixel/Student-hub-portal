<?php
/*
   page.php - opens the protected portal pages (courses, timetable, assignments, results, notices)
   Only logged-in users get them. Only names on this list can be opened.
*/

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();
guardLoggedIn();

$pages = [
    'courses'     => 'courses.html',
    'timetable'   => 'timetable.html',
    'assignments' => 'assignments.html',
    'results'     => 'results.html',
    'notices'     => 'notices.html'
];

$name = $_GET['p'] ?? '';

if(!isset($pages[$name])){
    http_response_code(404);
    echo 'Page not found.';
    exit;
}

serveHtml($pages[$name]);
