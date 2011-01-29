<?php 
?>
<!DOCTYPE HTML>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
	<script src="http://platform.twitter.com/anywhere.js?id=mGORvgD7zbKiXmysERthw&v=1" type="text/javascript"></script>
	<script src="js/game.js" type="text/javascript"></script>
	<!-- <script src="js/draw.js" type="text/javascript"></script> -->
	<link rel="stylesheet" href="css/common.css" type="text/css" / >
	<title>えっちゃん.com</title>
</head>
<body>
<div class="wrapper">
	<p>
		えっちゃん.com
		<a href="http://www.facebook.com/pages/etchan/142994815747188" >
			<img src="http://graph.facebook.com/521665023/picture" alt="プロファイル画像" />
		</a>
	</p>
	<div>
		<canvas id="twitter" width=400 height=400 >Unsupported browser.</canvas>
	</div>
	<p class="connect">
	    <span id="login"></span>
	</p>
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
<?php if ( empty($screenName) ) { ?>
<?php } else {    ?>
<?php }           ?>
<script type="text/javascript">
    twttr.anywhere(function (T) { T.hovercards();});
</script>
<script type="text/javascript">
    twttr.anywhere(function (T) { T("#follow-placeholder").followButton('eccyan'); });
</script>
<script type="text/javascript">
    twttr.anywhere(function (T) {
	T("#login").connectButton({
	    authComplete: function(user) {
		// triggered when auth completed successfully
	    	alert(user);
	    },
	    signOut: function() {
		// triggered when user logs out
	    }
	});
    });

</script>
</body>
</html>
