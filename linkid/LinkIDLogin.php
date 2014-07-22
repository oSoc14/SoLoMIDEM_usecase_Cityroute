<?php

require_once('linkid-sdk-php/LinkIDLoginConfig.php');

$config = include('../config/config.default.php');

// creates authentication request and handles incoming authentication responses
handleLinkID($config['Context'],
	$config['Host'], $config['AppName'], $config['Language'],
	$config['LoginPage'],
	$config['Username'], $config['Password']);
