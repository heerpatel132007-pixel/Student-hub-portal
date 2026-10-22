<?php
/* events.php - returns all events (with seats left) as JSON */

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';

$sql = "SELECT e.id, e.title, e.description, e.event_date, e.location, e.seats,
               COUNT(r.id) AS registered,
               e.seats - COUNT(r.id) AS seats_left
        FROM events e
        LEFT JOIN registrations r ON r.event_id = e.id
        GROUP BY e.id
        ORDER BY e.event_date";

$result = $conn->query($sql);
$rows = [];

while($row = $result->fetch_assoc()){
    $row['id']        = (int)$row['id'];
    $row['seats']     = (int)$row['seats'];
    $row['registered']= (int)$row['registered'];
    $row['seats_left']= (int)$row['seats_left'];
    $rows[] = $row;
}

echo json_encode($rows, JSON_UNESCAPED_UNICODE);
