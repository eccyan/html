<?php
require_once("../../configs/common.php");
require_once("../../controllers/controller.php");

$config = new ApplicationConfig();
$controller = new Contraller();
$token = $controller->token;

$params = array (
	'pauth_signature_method' => 'HMAC-SHA1',
	'oauth_comsumer_key'     => $config->key,
	'oauth_token'            => $controller->token->key,
);

$responce = json_decode($params, true);

header('Content-type: text/javascript; charset=utf-8');
echo ($responce);
?>
