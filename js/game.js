var game = {
    execute : function (action) {
	// Twitter API 操作
	var Twitter = (function() {
	    return function() {
		// 内部変数
		var internal = {
		    sinceId : null,
		}

		// ホームタイムライン取得
		this.statuses = function (callback) {
		    var parameters = {};
		    if (internal.sinceId) { parameters.since_id = internal.sinceId; }
		    parameters.count = 50;

		    var f = function (T) {
			// since_id を更新する
			internal.sinceId = T.data.contents[T.data.contents.length-1].id;
			callback(T);
		    }

		    oauth.send('http://api.twitter.com/1/statuses/home_timeline.json', parameters, f); 
		}
	    }
	})();

	// ユーザバッファオブジェクト
	var Users = (function () {
	    return function (capacity) {
		// 内部変数
		var internal = {
		    buffer   : [],
		    position : 0,
		    capacity : capacity,
		    twitter  : new Twitter,
		};

		// 更新
		this.update = function (callback) {
		    internal.twitter.statuses(function (T) {
		    	callback = callback || function () { };

			var contents = T.data.contents;
			var statuses = [];
			for (i=0; i<contents.length; ++i) {
			    var state = contents[i];
			    statuses.push(state);
			}

			// バッファリング
			var sliced = statuses.slice(internal.position, internal.capacity-internal.position-1);
			internal.buffer = sliced.concat( internal.buffer.slice(0, internal.position-1) );
			internal.position = 0;

			callback();
		    });
		}

		// 読み込み
		this.read = function(count) {
		    count = count || 20;

		    // バッファ容量を超える場合
		    if (internal.position >= internal.capacity-1) {
			throw new RangeError("read position is out of capacity.");
		    }

		    var readed = internal.buffer.slice(internal.position, Math.min(count, internal.capacity-internal.position-1));
		    internal.position = Math.min(internal.position+count, internal.capacity-1);

		    return readed;
		}
	    }
	})();

	// バインドオブジェクト
    	var Binder = (function () {
	    return function (selector) {
	    	this.timeline = function(interval) {
		    var users = new Users(500);
		    setInterval( function () {
			    users.update(function () {
				statuses = null;
			    	try {
				    statuses = users.read();
				}
				catch (e) {
				    statuses = [];
				}

				$(selector+"~ ul").remove();

				statuses.reverse();
				for (i=0; i<statuses.length; ++i) {
				    state = statuses[i];
				    $(selector).after(
					    "<ul>"+
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
				$(selector+"~ ul").animate({ opacity: "0" }, 0);
				$(selector+"~ ul").animate({ opacity: "1" }, 1500);
			    });
			},
			interval
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
