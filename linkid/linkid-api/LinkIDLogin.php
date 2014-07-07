<?php

require_once('../LinkIDLoginConfig.php');
require_once('config.php');

// creates authentication request and handles incoming authentication responses
handleLinkID($authnContextParam, $linkIDHost, $linkIDAppName, $linkIDLanguage, $loginPage, $linkIDWSUsername, $linkIDWSPassword);