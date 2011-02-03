<?php 
require_once("/var/www/html/path.php");
require_once("controllers/controller.php");
$con = new Controller();
?>
<!DOCTYPE HTML>
<html lang=ja>
<head>
	<meta charset="UTF-8" />
	<meta property="og:title" content="えっちゃん.com/>
	<meta property="og:type" content="website" />
	<meta property="og:description" content="えっちゃんのサイト" />
	<meta property="og:url" content="http://eccyan.com/" />
	<meta property="og:image" content="http://graph.facebook.com/521665023/picture" />
	<meta property="og:site_name" content="えっちゃん.com" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js" type="text/javascript"></script>
	<script src="http://oauth.googlecode.com/svn/code/javascript/sha1.js" type="text/javascript"></script>
	<script src="http://oauth.googlecode.com/svn/code/javascript/oauth.js" type="text/javascript"></script>
	<script src="http://platform.twitter.com/anywhere.js?id=mGORvgD7zbKiXmysERthw&v=1" type="text/javascript"></script>
	<script src="js/game.js" type="text/javascript"></script>

	<link rel="stylesheet" href="css/common.css" type="text/css" / >
</head>
<body>
<div class="wrapper">
	<p>
		えっちゃん.com
		<a href="http://www.facebook.com/pages/etchan/142994815747188" >
			<img src="http://graph.facebook.com/521665023/picture" alt="プロファイル画像" />
		</a>
	</p>
	<p class="consumer-key">
	    <span id="consumer-key-palceholder"></span>
	</p>
	<!--
	<p class="timeline">
	    <span id="timeline-placeholder"></span>
	</p>
	<canvas id="twitter" width=400 height=400 >Unsupported browser.</canvas>
	-->
	<hr />
	<p class="follow">
	    <span id="follow-placeholder"></span>
	</p>
	<p class="like" >
	    <script src="http://connect.facebook.net/ja_JP/all.js#xfbml=1"></script>
	    <fb:like href="http://eccyan.com" show_faces="true" width="380" font="arial"></fb:like>
	<p>
	<hr />
	<footer>
		&copy; <a href="http://eccyan.com">eccyan.com</a> ( <a href="http://twitter.com/kotarochiba">@eccyan</a>) <a href="mailto:g00.eccyan@gmail.com">mail</a>
	</footer>
</div>
<script type="text/javascript">
    twttr.anywhere(function (T) { T("#follow-placeholder").followButton('eccyan'); });
</script>
<script type="text/javascript">
    game.execute(function(T) { T("#consumer-key-palceholder").consumerKey(); });
</script>
<script type="text/javascript">
    twttr.anywhere(function (T) { T.hovercards();});
</script>
</body>
</html>
