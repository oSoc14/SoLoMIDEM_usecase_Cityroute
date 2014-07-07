<?php

require_once('../LinkIDAuthnContext.php');
require_once('config.php');

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

	<?php

	$authnContext = $_SESSION[$authnContextParam];

	print("<h2>User: " . $authnContext->userId . "</h2>");

	print ("<a href=\"logout.php\">Logout</a>");

	print("<h3>Attributes</h3>");
	print("<pre>");
	print_r($authnContext->attributes);
	print("</pre>");

	?>

</body>
</html>
