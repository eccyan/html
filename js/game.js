var game = {
    execute : function (action) {
	// Twitter API 操作
	var twitter = function() {
	    return function() {
		// 内部変数
		var internal = {
		    sinceId : null,
		}

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
		this.accessParameters = function (callback) {
		    var url = 'http://eccyan.com/api/1/access_parameters';
		    $.getJSON(url, callback);
		}
	    }
	})();

	// ユーザバッファ
	var users = function (capacity) {
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
		    api.accessParameters(function (data) {
		    	oauth.accessParameters = data;
			$(selector).append('<p>'+oauth.accessParameters.oauth_consumer_key+'<p>');
		    });

		}
	    }
	})();

    	action(function (selector) { return new Binder(selector); });
    }, 


};

var oauth = {
    accessParameters : null,
    proxy : function (url) { return "http://eccyan.com/p.php?url=" + url },
    send : function (method, api, parameters, callback) {
	// デフォルト値
    	parameters  = parameters ? parameters : [];
	callback    = callback ? callback : function (T) {};

	if (!this.accessParameters) {
	    return;
	}

	var accessor = {
	    consumerSecret: this.accessParameters.oauth_consumer_secret,
	    tokenSecret: this.accessParameters.oauth_token_secret, 
	};

	// リクエスト用のパラメータ作成
	var requestParameters = [];
	requestParameters.push([ 'oauth_consumer_key', this.accessParameters.oauth_consumer_key]);
	requestParameters.push([ 'oauth_signature_method', this.accessParameters.oauth_signature_method]);
	requestParameters.push([ 'oauth_token', this.accessParameters.oauth_token ]);
	requestParameters.push([ 'oauth_version', '1.0' ]);

	// API パラメータの追加
	for ( var key in parameters ) {
	    requestParameters.push([ key, parameters[key] ]);
	}

	var message = {
	    method:     method, 
	    action:     api, 
	    parameters: requestParameters, 
	};

	OAuth.setTimestampAndNonce(message);
	OAuth.SignatureMethod.sign(message, accessor);
	var url = OAuth.addToURL(message.action, message.parameters);
	var options = {
	    type     : message.method,
	    url      : this.proxy(encodeURIComponent(url)),
	    dataType : 'json',
	    success  : function(data, dataType) {
		callback({data:data, dataType:dataTypa, succeeded:true});
	    },
	    error    : function(XMLHttpRequest, textStatus, errorThrown) {
		callback({XMLHttpRequest:XMLHttpRequest, textStatus:textStatus, errorThrown:errorThrown, succeeded:false});
	    },
	};
	$.ajax(options); // 送信
	this.requested = options.url;
    },
};
