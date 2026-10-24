<?php
/*
   menu.php - menu items for the logged-in user's role.
   The list comes from json/menu.json and is filtered here on the server,
   so a student never receives the admin links.
*/

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

startSecureSession();

if(sessionState() !== 'active'){
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in.', 'items' => []]);
    exit;
}

$role = $_SESSION['user']['role'];

$file = json_decode(file_get_contents(__DIR__ . '/../json/menu.json'), true);
$items = [];

foreach(($file['menu'] ?? []) as $item){

    if(in_array($role, $item['roles'], true)){
        $items[] = [
            'label' => $item['label'],
            'icon'  => $item['icon'],
            'url'   => $item['url']
        ];
    }
}

echo json_encode(['success' => true, 'role' => $role, 'items' => $items], JSON_UNESCAPED_UNICODE);
