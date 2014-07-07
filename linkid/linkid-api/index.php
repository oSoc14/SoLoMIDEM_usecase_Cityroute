<?php

require_once('../linkid-sdk/LinkIDLoginConfig.php');

date_default_timezone_set('UTC'); // needed for DateTime

// set device context
setLinkIDAuthnMessage("PHP Authn Message");
setLinkIDFinishedMessage("PHP Finished Message");

// set identity profiles
setLinkIDIdentityProfiles(array("linkid_basic", "linkid_payment"));

?>

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>linkID Mobile Demo</title>
  <meta name="description" content="CityRoute demo">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="text/javascript" id="linkid-login-script"
  src="http://demo.linkid.be/linkid-static/js/linkid-min.js"></script>
  <style type="text/css">
    html, body{
      height: 100%;
      margin: 0;
      font-family: sans-serif;
      display: -webkit-flex;
      display: flex;
      justify-content: center;
      align-items:center;
      align-content:center;
      align-self: center;

    }
    body *{
      display: block;
      margin: 0;
      padding: 0;
    }
    .container {
      background: #ddd;
    }
    h1,a{
      font-size: 2em;
      margin: 0;
      padding: 1em;
      text-align: center;
      color: #fff;
    }
    h1{
      background: #055;
    }
    a{
      transition:background .3s,box-shadow .5s;
      cursor: pointer;
      background: #0bb;
      text-decoration: none;
      box-shadow: 0 2px 5px #fff;
    }
    a:hover{
      background: #099;
      box-shadow: 0 2px 5px #999;
    }
  </style>
</head>

<body>

  <div class="container qr-demo">
    <h1>linkID Demo</h1>
    
    <iframe id="linkid" style="display: none;"></iframe>
    <a href="#" class="linkid-login" data-login-href="./LinkIDLogin.php" data-protocol="HAWS" data-mobile-minimal="linkid" data-completion-href="./LoggedIn.php">
      Start
    </a>
  </div>

</body>
</html>
