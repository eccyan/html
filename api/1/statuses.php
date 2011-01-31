<?php
/**
 * twitter の home_timeline を読み込み json 形式で出力する
 */
require_once("/var/www/html/path.php");
require_once("configs/common.php");

require_once('oauth/OAuth.php');

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

$statuses = null;
if ( !empty($cache) ) {

    $consumer        = new OAuthConsumer($config->key, $config->secret);
    $signatureMethod = new OAuthSignatureMethod_HMAC_SHA1();
    $token           = json_decode($cache);
    $endpoint        = "https://api.twitter.com/1/statuses/home_timeline.json";
    $method          = $_SERVER['REQUEST_METHOD'];

    $params = array ();
    array_merge($params, OAuthUtil::parse_parameters($_SERVER['QUERY_STRING']));
    $req = OAuthRequest::from_consumer_and_token($consumer, $token, $method, $endpoint, $params);
    $req->sign_request($signatureMethod, $consumer, $token);
    $url =  $req->to_url();
    $header = array('Expect:');
    //$header = explode("\n", $req->to_header());

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_CONNECTTIMEOUT,10);
    curl_setopt($curl, CURLOPT_TIMEOUT, 10);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
    curl_setopt($curl, CURLOPT_HEADER, false);
    curl_setopt($curl, CURLOPT_URL, $url);
    if ( strcmp($method, 'POST') == 0 ) {
	curl_setopt($curl, CURLOPT_POST, true);
    }

    $responce = curl_exec($curl);
    $error    = curl_error($curl);
    $info     = curl_getinfo($curl);

    $statuses = json_decode($responce);

    curl_close ($curl);
}

$responce = json_encode($statuses);

//header('Content-type: text/javascript; charset=utf-8');
//echo ($responce);
?>
