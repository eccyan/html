<?php
require_once("../controllers/controller.php");
$controller = new Controller();
$req = $controller->request('http://twitter.com/oauth/request_token', 'GET');
print_r($req);
?>
