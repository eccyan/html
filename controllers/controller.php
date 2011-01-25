<?php
require_once('../libs/oauth/OAuth.php');
require_once('../configs/common.php');


/**
 * Controller Class
 */
class Controller {
    protected static $consumer = null;  
    protected static $signatureMethod = null;
    protected static $request = null;
    protected static $token = null;
    protected static $tokenSecret = null;

    function __construct() {
	$config = new ApplicationConfig();

	$consumer        = new OAuthConsumer($config->key, $config->secret);
	$signatureMethod = new OAuthSignatureMethod_HMAC_SHA1();

	// Request token
	$endpoint = 'http://twitter.com/oauth/request_token';
	$params = array();

	$req = OAuthRequest::from_consumer_and_token($consumer, NULL, "GET", $endpoint, $params);
	$req->sign_request($signatureMethod, $consumer, NULL);
	$url = $req->to_url();

	$header = array();
	$header[] = "Content-type: application/x-www-form-urlencoded";

	$curl = curl_init();
	curl_setopt($curl, CURLOPT_CONNECTTIMEOUT,10);
	curl_setopt($curl, CURLOPT_TIMEOUT, 10);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($curl, CURLOPT_HTTPHEADER, $header);
	curl_setopt($curl, CURLOPT_HEADER, false);
	curl_setopt($curl, CURLOPT_URL, $url);

	$responce = curl_exec($curl);

	curl_close ($curl);

	$tokens = array ();
	parse_str($responce, $tokens);

	$this->consumer        = $consumer;
	$this->signatureMethod = $signatureMethod;
	$this->token           = $tokens['oauth_token'];
	$this->tokenSecret     = $tokens['oauth_token_secret'];
    }

    function __destruct() {
    }

    function request($endpoint, $method, $params=NULL) {
	$req = OAuthRequest::from_consumer_and_token($this->consumer, NULL, $method, $endpoint, $params);
	$req->sign_request($this->signatureMethod, $this->consumer, NULL);
	return $req->get_parameters();
    }
}    

?>
