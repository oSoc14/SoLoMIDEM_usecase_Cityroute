<?php

error_reporting(-1);

require_once('../LinkIDAuthnContext.php');

date_default_timezone_set('UTC'); // needed for parsing dates

if (!isset($_SESSION)) {
	session_start();
}

?>

<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>linkID Mobile Demo</title>
	<meta name="description" content="CityRoute demo">
	<meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body>
	<h2>User: <?php echo $authnContext->userId; ?></h2>
	<a href="logout.php">Logout</a>
	<?php
	foreach ($authnContext->attributes as $key => $value) {
		echo '<p><label>' .
		$key . '</label>' .
		$value[0]->value . '<p>';
	}

// connect
$m = new MongoClient();

// select a database
$db = $m->CityRoute;

// select a collection (analogous to a relational database's table)
$collection = $db->users;

// add a record
$document = array( "title" => "Calvin and Hobbes");
$collection->remove($document);

// find everything in the collection
$cursor = $collection->find();

// iterate through the results
foreach ($cursor as $document) {
     var_dump($document ). "\n";
}


	?>

</body>
</html>
