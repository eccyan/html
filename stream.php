<?php
$consumerKey    = 'mGORvgD7zbKiXmysERthw';
$consumerSecret = 'C23d7ViIVXyizeTtrixmJjboZJxoqk9YvLIKr6Ecynw';

$endpint  = 'http://stream.twitter.com/1/statuses/firehose.json"';
$params   = array();

$consumer = new OAuthConsumer($consumerKey, $consumerSecret);

$parsed = parse_url($endpoint);
parse_str($parsed['query'], $params);

$req = OAuthRequest::from_consumer_and_token($consumer, NULL, "GET", $endpoint, $params);
$req->sign_request($sig_method, $test_consumer, NULL);

Header('Content-type: text/plain');
print "request url: ".$req->to_url()."\n";
print_r($req);
exit;
}
?>
