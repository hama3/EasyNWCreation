<?php
header('Access-Control-Allow-Origin: *');
header('Context_type: application/json');

// DB接続 (使用する場合は以下のコメントアウトを外してください)
// $manager = new MongoDB\Driver\Manager("mongodb://localhost:27017");

$filter = ['title' => $_POST['data']];
$options = [
   'projection' => ['_id' => 0],
];

$query = new MongoDB\Driver\Query($filter, $options);
$rows = $manager->executeQuery('test_db.test', $query);

echo json_encode($rows->toArray());
?>
