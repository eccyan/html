<?php
// Setting path
define('PATH_PROJECT', 'var/www/html');
$paths = array(
    PATH_PROJECT . '/configs',
    PATH_PROJECT . '/controllers',
    PATH_PROJECT . '/models',
    PATH_PROJECT . '/views',
    get_include_path()
);

set_include_path(implode(PATH_SEPARATOR, $paths));
unset($paths);
?>
