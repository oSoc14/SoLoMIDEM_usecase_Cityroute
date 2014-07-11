<?php
require_once('../LinkIDAuthnContext.php');
require_once('config.php');

if (!isset($_SESSION)) {
	session_start();
}

$authnContext = $_SESSION[$authnContextParam];

function addToDoc($name, $value) {
	global $document;
	$safename = str_replace('.', '_', $name);
	$document[$safename] = $value;
}

foreach ($authnContext->attributes as $v) {
	$name = $v[0]->name;
	$value = $v[0]->value;
	$t = gettype($value);

	if($t == 'array'){
		foreach ($value as $j) {
			$name = $j->name;
			$value = $j->value;
			addToDoc($name, $value);
		}
	}
	else{
		addToDoc($name, $value);
	}
}

// connect
$m = new MongoClient();

// select a database
$db = $m->CityRoute;

// select a collection (analogous to a relational database's table)
$collection = $db->users;

try {
	$cursor = $collection->update(
		array('_id' => $authnContext->userId),
		array('user_data' => $document),
		array("upsert" => true)
		);
} catch (MongoWriteConcernException $e) {
	echo $e->getMessage(), "\n";
}

$curl = curl_init('http://localhost:8888/auth/success');
$res = curl_exec($curl);

?>
<!DOCTYPE html>
<html class="inside-frame">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<title>linkID Mobile Demo</title>
	<meta name="description" content="CityRoute demo">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="http://78.23.228.130:8888/vendor/bootstrap/dist/css/bootstrap.min.css" />
	<link rel="stylesheet" type="text/css" href="http://78.23.228.130:8888/css/main.css">
</head>

<body>
	<div class="qr-demo">
		<p>
			Login successful
		</p>
		<p>
			You will soon be redirected.
			<br>
			If nothing happens, try to <a href="http://78.23.228.130:8888" target="_top">reload</a>.
		</p>
		<p>
			<a href="logout.php" target="_self">Or just logout</a>.
		</p>
	</div>
	<script>
	</script>
</body>
</html>