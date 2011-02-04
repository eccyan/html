var game = {
    execute : function (action) {
	// Twitter API 操作
	var Twitter = function() {
	    return function() {
		// 内部変数
		var internal = {
		    sinceId : null,
		}

		// ホームタイムライン取得
		this.statuses = function (callback) {
		    var parameters = {};
		    if (internal.sinceId != null) { parameters.since_id = internal.sinceId; }
		    parameters.count = 50;

		    var f = function (T) {
			// since_id を更新する
			internal.sinceId = T.data.contents[0].id;
			callback(T);
		    }

		    twitter.send('GET', 'http://api.twitter.com/1/statuses/home_timeline.json', parameters, f); 
		}
	    }
	}

	// API 操作
	var Api = (function () {
	    return function () {
		this.oauthUrl = function () {
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

		    // Query String の作成
		    var p = parameters;
		    p.m  = method;
		    p.ep = endpoint;

		    var query = '';
		    for ( var key in p ) {
			var value = parameters[key];
			if (value.length > 0) {
			    var q = query.indexOf('?');
			    if (q < 0) query += '?';
			    else       query += '&';
			    query += key+'='+value;
			}
		    }

		    var url = 'http://eccyan.com/api/1/oauth_url'+query;
		    $.getJSON(url, callback);
		}
	    }
	})();

	// ユーザバッファオブジェクト
	var Users = function (capacity) {
	    return function () {
		// 内部変数
		var internal = {
		    buffer   : [],
		    position : 0,
		    capacity : capacity,
		};

		// 更新
		this.update = function (callback) {
		    twitter.statuses(function (T) {
			var contents = T.data.contents;
			var datas  = [];
			for (i=0; i<contents.length; ++i) {
			    var state = contents[i];
			    datas.push({
				text  : state.text,
				image : state.user.profile_image_url,
			    });
			}

			// バッファリング
			var sliced = internal.buffer.slice(internal.position, internal.capacity-internal.position-1);
			internal.buffer = sliced.concat( datas.slice(0, internal.position-1) );

			callback();
		    });
		}

		// 読み込み
		this,read = function(count) {
		    // バッファ容量を超える場合
		    if (this.position >= this.capacity-1) {
			throw new RangeError("read position is out of capacity.");
		    }

		    var readed = internal.slice(internal.position, Math.min(count, internal.capacity-internal.position-1));
		    internal.position = Math.min(internal.position+count, internal.capacity-1);

		    return readed;
		}
	    }
	}

	// バインドオブジェクト
    	var Binder = (function () {
	    return function (selector) {
	    	this.consumerKey = function() {
		    var api = new Api();
		    api.oauthUrl(
		        'http://api.twitter.com/1/statuses/home_timeline.json',
			function (data) { $(selector).append('<p>'+data+'<p>'); }
		    );
		}
	    }
	})();

    	action(function (selector) { return new Binder(selector); });
    }, 


};

var oauth = {
    accessParameters : null,
    proxy : function (url) { return "http://eccyan.com/p.php?url=" + url },
    send : function (method, endpoint, parameters, callback) {
	// デフォルト値
    	parameters  = parameters || [];
	callback    = callback   || function (T) {};

	if (!this.accessParameters) {
	    return;
	}


	// API からURL を取得する
	var api = new Api();
	api.oauthUrl(endpoint, function (url) {

	    // 送信
	    var options = {
		type     : method,
		url      : this.proxy(encodeURIComponent(url+query)),
		dataType : 'json',
		success  : function(data, dataType) {
		    callback({data:data, dataType:dataTypa, succeeded:true});
		},
		error    : function(XMLHttpRequest, textStatus, errorThrown) {
		    callback({XMLHttpRequest:XMLHttpRequest, textStatus:textStatus, errorThrown:errorThrown, succeeded:false});
		},
	    };
	    $.ajax(options); 
	});
    },
};
