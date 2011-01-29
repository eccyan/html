<?php
require_once('/var/www/html/path.php');
require_once('configs/common.php');

require_once('oauth/OAuth.php');


/**
 * Controller Class
 */
class Controller {
    protected static $consumer = null;  
    protected static $signatureMethod = null;
    protected static $request = null;
    var $token = null;

    function __construct() {
	$config = new ApplicationConfig();

	$consumer        = new OAuthConsumer($config->key, $config->secret);
	$signatureMethod = new OAuthSignatureMethod_HMAC_SHA1();

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

	// Access Token
	if ( empty($cache) ) {
	    $endpoint = 'http://twitter.com/oauth/access_token';
	    $params = OAuthUtil::parse_parameters($_SERVER['QUERY_STRING']);
	    $req = OAuthRequest::from_consumer_and_token($consumer, NULL, "GET", $endpoint, $params);
	    $req->sign_request($signatureMethod, $consumer, NULL);

	    $url    = $req->to_url();
	    $header = array();
	    $header = explode("\n", $req->to_header());
	    $responce = $this->http('GET', $url, $header);

	    // If could not get access_token and colud not get cache
	    if ( empty($responce) || preg_match("/^[[:space:]]+$/", $responce) > 0 ) {
		// Request token
		$endpoint = 'http://twitter.com/oauth/request_token';
		$params = array();

		$req = OAuthRequest::from_consumer_and_token($consumer, NULL, "GET", $endpoint, $params);
		$req->sign_request($signatureMethod, $consumer, NULL);

		$url = $req->to_url();
		$header = array();
		$responce = $this->http('GET', $url, $header);

		$parsed = OAuthUtil::parse_parameters($responce);
		$token = new OAuthToken($parsed['oauth_token'], $parsed['oauth_token_secret']);

		// Authorize 
		$endpoint = "https://api.twitter.com/oauth/authorize?oauth_token={$token->key}";
		http_redirect($endpoint);
	    }

	    $parsed = OAuthUtil::parse_parameters($responce);
	    $token      = new OAuthToken($parsed['oauth_token'], $parsed['oauth_token_secret']);
	    $uid        = $parsed['user_id'];

	    $signature  = @sha1($uid.$config->secret);
	    memcache_set($connect, "$uid:$signature", json_encode($token), 0, 86400); 
	    setcookie("twitter_anywhere_identity", "$uid:$signature", null, '/');
	}
	else {
	    $token = json_decode($cache);
	}

	$this->consumer        = $consumer;
	$this->signatureMethod = $signatureMethod;
	$this->token           = $token;
    }

    function __destruct() {
    }

    function http($method, $url, $header) {
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

	curl_close ($curl);
	
	return $responce;
    }
    
    function request($endpoint, $method, $params=array()) {
	$req = OAuthRequest::from_consumer_and_token($this->consumer, $this->token, $method, $endpoint, $params);
	$req->sign_request($this->signatureMethod, $this->consumer, $this->token);
	return $req->get_parameters();
    }
}    

?>
