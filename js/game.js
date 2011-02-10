var game = {
    execute : function (action) {
	// Twitter API 操作
	var Twitter = (function() {
	    return function() {
		// 内部変数
		var internal = {
		    oldSinceId: null,
		    sinceId : null,
		}

		// ホームタイムライン取得
		this.statuses = function (callback) {
		    var parameters = {};
		    if (internal.sinceId) { parameters.since_id = internal.sinceId; }
		    parameters.count = 50;

		    var f = function (T) {
			if (T.data.status.http_code == "400") {
			    throw new Error(T.data.contents.error);
			}
			// since_id を更新する
			internal.oldSinceId = internal.sinceId;
			internal.sinceId = T.data.contents[0].id;
			callback(T);
		    }

		    oauth.send('http://api.twitter.com/1/statuses/home_timeline.json', parameters, f); 
		}

		// 更新された
		this.updated = function () {
		    return internal.oldSinceId != internal.sinceId;
		}
	    }
	})();

	// ユーザバッファオブジェクト
	var Users = (function () {
	    return function (capacity) {
		// 内部変数
		var internal = {
		    buffer      : [],
		    position    : 0,
		    capacity    : capacity,
		    twitter     : new Twitter,
		};

		// 更新
		this.update = function () {
		    internal.twitter.statuses(function (T) {
		    	var callback = callback || function () { };

			if (!internal.twitter.updated()) { return; }

			var contents = T.data.contents;
			var statuses = [];
			for (i=0; i<contents.length; ++i) {
			    var state = contents[i];
			    statuses.push(state);
			}

			// バッファリング
			statuses.reverse();
			var sliced = statuses.slice( 0, internal.capacity-internal.position-1 );
			internal.buffer = internal.buffer.slice( Math.min(internal.position+1, internal.capacity-1), Math.min(internal.buffer.length, internal.capacity-1) );
			internal.buffer = internal.buffer.concat( sliced );
			internal.position = 0;
		    });
		}

		// 読み込み
		this.read = function(count) {
		    var count = count || 1;

		    // バッファ容量を超える場合
		    if (internal.position >= internal.capacity-1) {
			throw new RangeError("read position is out of capacity.");
		    }

		    var readed = internal.buffer.slice(internal.position, Math.min(count+internal.position, internal.capacity-internal.position-1));
		    internal.position = Math.min(internal.position+readed.length, internal.capacity-1);

		    return readed;
		}

		this.count = function() {
		    return Math.max(internal.buffer.length-internal.position, 0);
		}
	    }
	})();

	// バインドオブジェクト
    	var Binder = (function () {
	    return function (selector) {
	    	this.timeline = function(interval, count) {
		    var count = count || 50;

		    var users = new Users(500);
		    // 最初にアップデート
		    users.update();

		    setInterval( function () {
			    try {
				users.update();
			    }
			    catch (e) {
				$(selector).after("<p>"+e.message+"</p>");
			    }
			},
			interval
		    );
		    setInterval( function () {
			    var statuses = null;
			    try {
				statuses = users.read();
			    }
			    catch (e) {
			    	statuses = [];
			    }

			    if ( statuses.length == 0 ) { return; }

			    // 100件まで表示させる。
			    $(selector+"~ ul:gt("+count+")").remove();

			    var now = new Date; 
			    var sliceId = "sliced-"+parseInt(now/1000);
			    for (i=0; i<statuses.length; ++i) {
				state = statuses[i];
				$(selector).after(
					"<ul class="+sliceId+">"+
					    "<li>"+
						"<img src='"+state.user.profile_image_url+"' width=24px height=24px alt='"+state.user.profile_image_url+"'/>"+
						"<span>"+state.user.name+"</span>"+
					    "</li>"+
					    "<li>"+
						"<span>"+state.text+"</span>"+
					    "</li>"+
					"</ul>"
				);
			    }
			    $("."+sliceId).css({ opacity: "0.25" });
			    $("."+sliceId).animate({ opacity: "1" }, 2000);
			},
			500
		    );
		}
	    }
	})();

    	action(function (selector) { return new Binder(selector); });
    }, 


};

var oauth = {
    proxy : function (url) {
	return "http://eccyan.com/p.php?url=" + encodeURIComponent(url);
    },
    send : function () {
	var method     = 'GET';
	var endpoint   = null;
	var parameters = [];
	var callback   = function (T) { };
	switch (arguments.length) {
	    case 2: 
		endpoint = arguments[0];
		callback = arguments[1];
		break;
	    case 3: 
		endpoint   = arguments[0];
		parameters = arguments[1];
		callback   = arguments[2];
		break;
	}

	// API からURL を取得する
	this.url(
	    endpoint,
	    parameters,
	    function (url) {
		// 送信
		var options = {
		    type     : method,
		    url      : oauth.proxy(url),
		    dataType : 'json',
		    success  : function(data, dataType) {
			callback({data:data, dataType:dataType, succeeded:true});
		    },
		    error    : function(XMLHttpRequest, textStatus, errorThrown) {
			callback({XMLHttpRequest:XMLHttpRequest, textStatus:textStatus, errorThrown:errorThrown, succeeded:false});
		    },
		}
		$.ajax(options); 
	    }
	);
    },

    // API アクセス URL を取得
    url : function () {
	var method     = 'GET';
	var endpoint   = null;
	var parameters = [];
	var callback   = function (T) { };
	switch (arguments.length) {
	    case 2: 
		endpoint = arguments[0];
		callback = arguments[1] || function (T) { };
		break;
	    case 3: 
		endpoint   = arguments[0];
		parameters = arguments[1] || [];
		callback   = arguments[2] || function (T) { };
		break;
	}

	// Query String の作成
	var p = parameters;
	p.m  = method;
	p.ep = endpoint;

	var query = '';
	for ( var key in p ) {
	    var value = p[key];
	    if (value) {
		var q = query.indexOf('?');
		if (q < 0) query += '?';
		else       query += '&';
		query += key+'='+value;
	    }
	}

	var url = 'http://eccyan.com/api/1/oauth_url'+query;
	$.getJSON(url, callback);
    }
};
