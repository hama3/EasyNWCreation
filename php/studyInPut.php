<?php
header('Access-Control-Allow-Origin: *');
header('Context_type: application/json');

$postData = json_decode($_POST["data"]);

// DB Connect (使用する場合は以下のコメントアウトを外してください)
// $manager = new MongoDB\Driver\Manager("mongodb://localhost:27017");

// Insert
$bulk = new MongoDB\Driver\BulkWrite;
$bulk->insert($postData);
$manager->executeBulkWrite('test_db.test', $bulk);

echo json_encode('ok');
?>
