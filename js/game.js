var game = {
    users : {
	buffer : [],
	position : 0,
	capacity : 100,

	update : function (callback) {
	    game.twitter.statuses(function (T) {
		var contents = T.data.contents;

		var datas  = [];
		for (i=0; i<contents.length; ++i) {
		    var state = contents[i];
		    datas.push({
			text : state.text,
			image : state.user.profile_image_url,
		    });
		}
		// バッファリング
		var sliced = game.users.buffer.slice(game.users.position, game.users.capacity-game.users.position-1);
		game.users.buffer = sliced.concat( datas.slice(0, game.users.position-1) );

		callback();
	    });
	},
	read: function(count) {
	    if (this.position >= this.capacity-1) {
	    	return [];
	    }

	    var readed = this.buffer.slice(this.position, Math.min(count, this.capacity-this.position-1));
	    position = Math.min(this.position+count, this.capacity-1);

	    return readed;
	}
    },

    api : {
	accessParameters : function (callback) {
	    var url = 'http://eccyan.com/api/1/access_parameters';
	    $.getJSON(url, callback);
	},
    },

    twitter : {
    	sinceId : null,
	statuses : function (success, error) {
	    var parameters = {};
	    if (this.sinceId != null) { parameters.since_id = this.sinceId; }
	    parameters.count = 50;

	    var success_ = function (T) {
	    	// since_id を更新する
	    	game.twitter.sinceId = T.data.contents[0].id;
		success(T);
	    }

	    twitter.send('GET', 'http://api.twitter.com/1/statuses/home_timeline.json', parameters, success_, error); 
	},
    },
};

var twitter = {
    accessParameters : null,
    proxy : function (url) { return "http://eccyan.com/p.php?url=" + url },
    send : function (method, api, parameters, success, error) {
	// デフォルト値
    	parameters  = parameters ? parameters : [];
	success     = success ? success : function (T) {};
    	error       = error ? error : function (T) { alert(T.textStatus); };

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
	    type: message.method,
	    url: this.proxy(encodeURIComponent(url)),
	    dataType: 'json',
	    success: function(data, dataType) { success({data:data, dataType:dataType}); },
	    error: function(XMLHttpRequest, textStatus, errorThrown) { error({XMLHttpRequest:XMLHttpRequest, textStatus:textStatus, errorThrown:errorThrown} );
	   },
	};
	$.ajax(options); // 送信
	this.requested = options.url;
    },
};
