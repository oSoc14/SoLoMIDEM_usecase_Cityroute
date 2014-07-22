<?php

require_once ('linkid-sdk-php/LinkIDLoginConfig.php');
require_once ('linkid-sdk-php/LinkIDAuthnContext.php');

$config = include('../config/config.default.php');

date_default_timezone_set('UTC'); // needed for DateTime

if (!isset($_SESSION)) {
  session_start();
}
if (isset($_SESSION[$config['Context']])) {
  header('Location: LoggedIn.php');
}
?>
<!DOCTYPE html>
<html class="inside-iframe">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>solomID Login</title>
  <meta name="description" content="solomID Login">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="text/javascript" id="linkid-login-script"
  src="http://<?php echo $config['Host'] ?>/linkid-static/js/linkid-min.js"></script>
  <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css">
<?php
if(isset($config['CSS'])){
  echo '<link rel="stylesheet" type="text/css" href="' . $config['CSS'] . '">';
}
?>
</head>

<body>
  <div id="qr-fancy" class="qr-demo">
    <iframe id="linkid" name="linkid" style="display: none;"></iframe>
    <a href="#" onclick="notify()" class="linkid-login linkid-btn" data-login-href="<?php echo $config['LoginHref'] ?>" data-protocol="HAWS"
    data-mobile-minimal="linkid" data-completion-href="<?php echo $config['CompletionHref'] ?>">
    <h3>Login with</h3></a>
  </div>
  <script>
    function notify (){
    document.getElementById('qr-fancy').className += ' qr-load';
    }
  </script>
</body>
</html>
