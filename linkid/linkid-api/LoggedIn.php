<?php
require_once('../LinkIDAuthnContext.php');
require_once('config.php');

if (!isset($_SESSION)) {
	session_start();
}

if (isset($_SESSION[$authnContextParam])) {
	header( 'Location: http://78.23.228.130:8888' );
	exit();
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

$curl = curl_init('http://localhost:8888/data/success');
$res = curl_exec($curl);

header('Location: http://78.23.228.130:8888');