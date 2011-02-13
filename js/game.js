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
			if (T.data.status.http_code == "200") {
			    // since_id を更新する
			    internal.oldSinceId = internal.sinceId;
			    internal.sinceId = T.data.contents[0].id;
			}
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
		this.update = function (success, error) {
		    var success = success || function () { };
		    var error   = error   || function () { };

		    internal.twitter.statuses(function (T) {
			if (T.data.status.http_code != "200") {
			    error(T);
			}

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

			success(sliced);
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

	// イメージ処理オブジェクト
	var Images = (function () {
	    return function () {
		// 内部変数
		var internal = {
		    uncompleted : [],
		    completed   : [],
		    position    : 0,
		};

		setInterval(function () {
			// 読み込みを調べる
			for (key in internal.uncompleted) {
			    var image = internal.uncompleted[key];
			    if ( image.complete ) {
				internal.completed[key] = image;
				delete internal.uncompleted[key];
			    }
			}
		    },
		    60
		);

		this.add = function(key, image) {
		    // 未読み込み
		    if (!internal.completed[key]) {
			internal.uncompleted[key] = image;
		    }
		}

		this.remove = function(key) {
		   for (key in internal.completed) {
		       if (key == key) {
			   delete internal.completed[key];
			   return;
		       }
		   }

		    // キーが見つからないか読み込みが終っていない
		   throw new RangeError("Not found key or uncompleted read.");
		}

		this.get = function(key) {
		    return internal.completed[key];
		}
	    }
	})();

	// ゲーム描画オブジェクト
	var Graphic = (function () {
	    return function (selector) {
		// 内部変数
		var internal = {
		    canvas  : null,
		    context : null,
		    width   : parseInt( $(selector).outerWidth() )      || 400,
		    height  : parseInt( $(selector).outerWidth() )*1.33 || 400*1.33
		}
		$(selector).after("<canvas>Not supported canvas.</canvas>");
		internal.canvas = $(selector+"~ canvas").filter("canvas").get(0);
		$(internal.canvas)
		    .attr({width:internal.width, height:internal.height})
		    .css({width:0, height:0, opacity:0})
		    .animate({width:internal.width, height:internal.height, opacity:1}, 1500);
		internal.context = internal.canvas.getContext('2d');

		internal.color = {
		    convert : function (r, g, b, a) {
		    	var a = a || 255;
		    	return "rgba("+r+","+g+","+b+","+a+")";
		    }
		}

		internal.transform = {
		    reset : function () {
			internal.context.setTransform(1, 0, 0, 1, 0, 0);
		    },
		    set : function (T) {
			internal.context.setTransform(T.m11, T.m12, T.m21, T.m22, T.dx, T.dy);
		    },
		    append : function (T) {
			internal.context.transform(T.m11, T.m12, T.m21, T.m22, T.dx, T.dy);
		    },
		    scale : function (scale) {
			internal.context.scale(scale.x, scale.y);
		    },
		    rotate : function (radian) {
			internal.context.rotate(radian);
		    },
		    translate : function (position) {
			internal.context.translate(position.x, position.y);
		    }
		}

		internal.image = {
		    create : function (src) {
		    	var image = new Image(); 
			image.src = src;
			return image;
		    },
		}

		this.draw = {
		    clear : function (color) {
			var color = color || internal.color.convert(0, 0, 225);

			var oldFillStyle = internal.context.fillStyle;
			internal.transform.reset();
			internal.context.fillStyle = color; 
			internal.context.fillRect(0, 0, internal.width, internal.height);
			internal.context.fillStyle = oldFillStyle;
		    },

		    image : function (image, position, size) {
			internal.context.drawImage(image, position.x, position.y, size.width, size.height);
		    },
		}

		this.size      = function() { return { width : internal.width, height : internal.height }; }
		this.canvas    = function() { return internal.canvas; }
		this.color     = function() { return internal.color; }
		this.transform = function () { return internal.transform; }
		this.image     = function () { return internal.image; }
	    }
	})();

	var Character = (function () {
	    return function (state, images) {
	    	var internal =  {
		    state  : state,
		    images : images,
		    accel  : {dx:0, dx:0}
		}

		// 行列忘れたからとりあえず
		this.rotate    = 0;
		this.scale     = { sx:0, sy:0 }; 
		this.translate = { x:0, y:0 };

		this.text = function() {
		    return internal.state.text;
		}

		this.image = function() {
		    var key = internal.state.user.id;
		    return images.get(key);
		}
	    }
	})();

	// バインドオブジェクト
    	var Binder = (function () {
	    return function (selector) {
		this.game = function(interval) {
		    $(selector).after("<div>Start Game</div>");
		    $(selector+"~ div").filter("div")
			.css({ margin:"0 auto", width:"30%", fontSize:"1em", color:"white", backgroundColor:"blue", borderRadius:"0.5em" })
			.click(function () {
			    $(selector+"~ div").filter("div").remove();

			var users = new Users(500);
			var icons = new Images();
			var g     = new Graphic(selector);

			var characters = [];

			setInterval( function () {
				users.update(
				    function (statuses) {
					// アップデート時にイメージを作成
					for (i=0; i<statuses.length; ++i) {
					    var state = statuses[i];
					    var key = state.user.id;
					    var src = state.user.profile_image_url;
					    icons.add(key, g.image().create(src));
					}
				    },
				    function (T) {
					$(selector+" ~ p").filter("p").remove();
					$(selector).after("<p>"+T.data.contents.error+"</p>");
					$(selector+" ~ p").filter("p").css({color:"white", backgroundColor:"red"});
				    }
				);
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

				for (i=0; i<statuses.length; ++i) {
				    var state = statuses[i];
				    var character =  new Character(state, icons)
				    character.translate.x = Math.floor(Math.random() * g.size().width );
				    character.translate.y = Math.floor(Math.random() * g.size().height);
				    characters.push(character);
				}
			   },
			   1000
		       );
		       setInterval( function () {
				g.draw.clear( g.color().convert(0, 0, 225) );
				for (i=0; i<characters.length; ++i) {
				    var character = characters[i];
				    character.rotate = character.rotate+10*Math.PI/180

				    g.transform().reset();
				    g.transform().translate({x:character.translate.x, y:character.translate.y});
				    g.transform().rotate(character.rotate); 
				    g.transform().translate({x:-16, y:-16});
				    g.draw.image(character.image(), {x:0, y:0}, {width:32, height:32});
				    
				}
			    },
			    60
			);
		    });
		}

		this.corkboard = function(interval) {
		    $(selector).after("<div>Start Corkboard</div>");
		    $(selector+"~ div").filter("div")
			.css({ margin:"0 auto", width:"30%", fontSize:"1em", color:"white", backgroundImage:"url(img/cork.jpg)", borderRadius:"0.5em" })
			.click(function () {
			    $(selector+"~ div").filter("div").remove();
			var users    = new Users(500);
			var icons    = new Images();
			var g        = new Graphic(selector);
			var position = {x:0, y:0};
			var size     = {width:64, height:64};

			$(g.canvas()).css( {backgroundImage: "url(img/cork.jpg)", backgroundRepeat: "repeat"} );

			users.update(
			    function (statuses) {
				// アップデート時にイメージを作成
				for (i=0; i<statuses.length; ++i) {
				    var state = statuses[i];
				    var key = state.user.id;
				    var src = state.user.profile_image_url;
				    icons.add(key, g.image().create(src));
				}
			    },
			    function (T) {
				$(selector+" ~ p").filter("p").remove();
				$(selector).after("<p>"+T.data.contents.error+"</p>");
				$(selector+" ~ p").filter("p").css({color:"white", backgroundColor:"red"});
			    }
			);
			setInterval( function () {
				users.update(
				    function (statuses) {
					// アップデート時にイメージを作成
					for (i=0; i<statuses.length; ++i) {
					    var state = statuses[i];
					    var key = state.user.id;
					    var src = state.user.profile_image_url;
					    icons.add(key, g.image().create(src));
					}
				    },
				    function (T) {
					$(selector+" ~ p").filter("p").remove();
					$(selector).after("<p>"+T.data.contents.error+"</p>");
					$(selector+" ~ p").filter("p").css({color:"white", backgroundColor:"red"});
				    }
				);
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

				for (i=0; i<statuses.length; ++i) {
				    var state = statuses[i];
				    position.x = Math.floor(Math.random() * (g.size().width - size.width));
				    position.y = Math.floor(Math.random() * (g.size().height - size.height));

				    try {
					g.draw.image(icons.get(state.user.id), position, size);
				    }
				    catch (e) {
				    }
				}
			    },
			    100
			);
		    });
		}

		// タイムライン表示 
	    	this.timeline = function(interval, count) {
		    // デフォルト値
		    var interval = interval || 10000;
		    var count    = count || 50;

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
				var state = statuses[i];
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
    urls : {
    	request   : "http://twitter.com/oauth/request_token",
    	access    : "http://twitter.com/oauth/access_token",
    	authorize : "http://twitter.com/oauth/authorize",
    },
    proxy : function (url) {
	return "http://eccyan.com/p.php?url=" + encodeURIComponent(url);
    },

    // 認証処理
    authorize : function (urls, callback) {
	var callback   = function (T) { };

	var p = [];
	p.access    = encodeURIComponent(urls.access);
	p.request   = encodeURIComponent(urls.request);
	p.authorize = encodeURIComponent(urls.authorize);

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

	var url = 'http://eccyan.com/api/1/oauth'+query;
	$(location).attr( "href", url );
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

	var urls      = this.urls;
	var authorize = this.authorize;
	var callback_ = function (T) {
	    if ( !T ) {
		authorize(urls, callback);
	    }
	    callback(T);
	}

	var url = 'http://eccyan.com/api/1/oauth_url'+query;
	$.getJSON(url, callback_);
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

	var success = function(data, dataType) {
	    callback({data:data, dataType:dataType, succeeded:true});
	}
	var error = function(XMLHttpRequest, textStatus, errorThrown) {
	    callback({XMLHttpRequest:XMLHttpRequest, textStatus:textStatus, errorThrown:errorThrown, succeeded:false});
	},

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
		    success  : success,
		    error    : error,
		    }
		$.ajax(options); 
	    }
	);
    },
};
