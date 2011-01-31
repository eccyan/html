var game = { api : {
	accessParameters : function (callback) {
	    var url = 'http://eccyan.com/api/1/access_parameters.php';
	    $.getJSON(url, callback);
	},
    },
};

var twitter = {
    accessParameters : null,
    proxy : function (url) { return "http://eccyan.com/p.php?url=" + url },
    send : function (method, api, parameters, success, error) {
	// デフォルト値
    	parameters           = parameters ? parameters : [];
	this.onSendSuccessed = success ? success : function (T) {};
    	error                = error ? error : function (T) { alert(T.textStatus); };

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
