<?php
// Setting Root
define('ROOT', '/var/www/html');
$paths = array(
    ROOT,
    ROOT . '/libs',
    get_include_path()
);

set_include_path(implode(PATH_SEPARATOR, $paths));
unset($paths);
?>
