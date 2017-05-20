<?php
header('Access-Control-Allow-Origin: *');
header('Context_type: application/json');

// DB接続
$manager = new MongoDB\Driver\Manager("mongodb://localhost:27017");

$filter = [];
$options = [
   'projection' => ['_id' => 0],
];

$query = new MongoDB\Driver\Query($filter, $options);
$rows = $manager->executeQuery('test_db.test', $query);

echo json_encode($rows->toArray());
?>
