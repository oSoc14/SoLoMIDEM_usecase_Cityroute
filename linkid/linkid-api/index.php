<?php
require_once ('../LinkIDLoginConfig.php');
require_once ('../LinkIDAuthnContext.php');
$authnContextParam = "linkID.authnContext";

date_default_timezone_set('UTC'); // needed for DateTime

// set device context
setLinkIDAuthnMessage("Dag flinke jongen");
setLinkIDFinishedMessage("Login successful!");
// set identity profiles
setLinkIDIdentityProfiles(array("linkid_basic"));

if (!isset($_SESSION)) {
  session_start();
}
if (isset($_SESSION[$authnContextParam])) {
  header('Location: LoggedIn.php');
}
?>

<!DOCTYPE html>
<html class="inside-iframe">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>linkID Mobile Demo</title>
  <meta name="description" content="CityRoute demo">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="text/javascript" id="linkid-login-script"
  src="http://solomid.linkid.be/linkid-static/js/linkid-min.js"></script>
  <link rel="stylesheet" href="http://78.23.228.130:8888/vendor/bootstrap/dist/css/bootstrap.min.css" />
  <link rel="stylesheet" type="text/css" href="http://78.23.228.130:8888/css/main.css">
</head>

<body>
  <div id="qr-fancy" class="qr-demo">
    <iframe id="linkid" name="linkid" style="display: none;"></iframe>
    <a href="#" onclick="notify()" class="linkid-login linkid-btn" data-login-href="./LinkIDLogin.php" data-protocol="HAWS"
    data-mobile-minimal="linkid" data-completion-href="http://78.23.228.130:8888">
    <h3>Login with</h3></a>
  </div>
  <script>
    function notify (){
    document.getElementById('qr-fancy').className += ' qr-load';
    }
  </script>
</body>
</html>
