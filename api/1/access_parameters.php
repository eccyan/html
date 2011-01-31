<?php
/**
 * memcache からトークンを読み込み json 形式で出力する
 */
require_once("/var/www/html/path.php");
require_once("configs/common.php");

$config = new ApplicationConfig();

// get @Anywhere login value
$anywhereId = explode(':', @$_COOKIE["twitter_anywhere_identity"]);
$anywhere->id        = @$anywhereId[0];
$anywhere->signature = @$anywhereId[1];
// for validate anywhere signature
$signature = @sha1(@$anywhere->id.$config->secret);

$connect = memcache_connect('127.0.0.1', 11211);
$cache = null;
if ( !empty($anywhere->id)  && strcmp($anywhere->signature, $signature) == 0 ) {
    $cache = memcache_get($connect, "{$anywhere->id}:{$anywhere->signature}");
}

$params = null;
if ( !empty($cache) ) {
    $token = json_decode($cache);

    $params['oauth_signature_method'] = 'HMAC-SHA1';
    $params['oauth_consumer_key']     = $config->key;
    $params['oauth_consumer_secret']  = $config->secret;
    $params['oauth_token']            = $token->key;
    $params['oauth_token_secret']     = $token->secret;
}

$responce = json_encode($params);

header('Content-type: text/javascript; charset=utf-8');
echo ($responce);
?>
