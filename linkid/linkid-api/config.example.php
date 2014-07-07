<?php

/**
 * Configuration for the example pages, linkID hostname, appname, username/password, ...
 */

$linkIDHost = "demo.linkid.be";

$linkIDAppName = "example-mobile";

$linkIDLanguage = "en";

// username/password
$linkIDWSUsername = "example-mobile";
$linkIDWSPassword = "6E6C1CB7-965C-48A0-B2B0-6B65674BE19F";

// location of this page, linkID will post its authentication response back to this location.
// change to your server!
$loginPage = "http://demo.linkid.be/LinkIDLogin.php";


/*
 * linkID authentication context session attribute
 *
 * After a successful authentication with linkID this will hold the returned
 * AuthenticationProtocolContext object which contains the linkID user ID,
 * used authentication device(s) and optionally the returned linkID attributes
 * for the application.
 */
$authnContextParam = "linkID.authnContext";
