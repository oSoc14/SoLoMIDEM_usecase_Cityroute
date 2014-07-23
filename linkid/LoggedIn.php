<?php

require_once('linkid-sdk-php/LinkIDAuthnContext.php');

$config = include('../config/config.default.php');

if (!isset($_SESSION)) {
	session_start();
}

$authnContext = $_SESSION[$config['Context']];

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
		array('upsert' => true)
		);
} catch (MongoWriteConcernException $e) {
	echo $e->getMessage(), "\n";
}

$curl = curl_init($config['SuccessCurl'] . '/auth/success');
$res = curl_exec($curl);

?>
<!DOCTYPE html>
<html class="inside-iframe">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>solomID Login</title>
  <meta name="description" content="solomID Login">
  <meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">
<?php
if(isset($config['CSS'])){
  echo '<link rel="stylesheet" type="text/css" href="' . $config['CSS'] . '">';
}
?>
</head>

<body>
	<div class="qr-demo">
		<p>
			Login successful
		</p>
		<p>
			You will soon be redirected.
			<br>
			If nothing happens, try to <a href="<?php echo $config['CompletionHref'] ?>" target="_top">reload</a>.
		</p>
		<p>
			<a href="logout.php" target="_self">Or just logout</a>.
		</p>
	</div>
</body>
</html>