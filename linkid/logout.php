<?php

date_default_timezone_set('UTC'); // needed for parsing dates

session_start();
unset($_SESSION);
session_destroy();
session_write_close();
header('Location: index.php');
exit();
