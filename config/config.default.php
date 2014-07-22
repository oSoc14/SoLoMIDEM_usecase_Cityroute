<?php

/**
 * Don't edit this file!
 * To use own configuration: make a file named config.php in this folder based on config.example.php
 */


/**
 * Default configuration for the linkID integration
 */

$config = array(
	'Host' => 'demo.linkid.be',
	'AppName' => 'example-mobile',
	'Language' => 'en',

	'Username' => 'example-mobile',
	'Password' => '6E6C1CB7-965C-48A0-B2B0-6B65674BE19F',

	'Client' => 'http://demo.linkid.be',
	'LoginPage' => 'http://demo.linkid.be/LinkIDLogin.php',

	'CompletionHref' => './LoggedIn.php',
	'LoginHref' => './LinkIDLogin.php',

	'SuccessCurl' => 'http://localhost:8888',

	'Context' => 'linkID.authnContext',
	);

/**
 * Overwrite config if config.php exists
 */

if($configFile = @include('config.php')){
  $config = array_merge($config, $configFile);
}

return $config;
