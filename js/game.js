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
			internal.buffer = internal.buffer.slice( Math.min(internal.position, internal.capacity-1), Math.min(internal.buffer.length-1, internal.capacity-1) );
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

	// コンテンツ
	var Game = (function () {
	    return function (selector) {
	    	this.execute = function(interval) {
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
		}
	    }
	})();

	var Corkboard = (function () {
	    return function (selector) {
	    	this.execute = function (interval) {
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
		}
	    }
	})();

	var Timeline = (function () {
	    return function (selector) {
		this.execute = function() {
		    // デフォルト値
		    var interval = interval || 10000;
		    var count    = count || 50;

		    var users = new Users(500);

		    var hover = false;
		    $(selector).after("<div></div>");
		    var timeline = $(selector+"~ div").filter("div").get(0);
		    $(timeline).hover(function () { hover = true; }, function () { hover = false; });
		    $(timeline).css({ minHeight:"4em", margin:"1em", backgroundColor:"steelblue", borderRadius:"0.5em", opacity:0 });
		    $(timeline).animate({ opacity:1 }, 3000);

		    // 最初にアップデート
		    users.update();
		    setInterval( function () {
			    users.update(
				function (statuses) {
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
			    if ( hover == true ) { return; }

			    var now = new Date; 
			    var sliceId = "sliced-"+parseInt(now/1000);
			    for (i=0; i<statuses.length; ++i) {
				var state = statuses[i];
				// URL 置換
				var urls = state.text.match(/(https?|ftp)(:\/\/[-_.!~*¥'()a-zA-Z0-9;\/?:\@&=+\$,%#]+)/g) || [];
				for (i=0; i<urls.length; ++i) {
				    var url = urls[i];
				    state.text = state.text.replace(url, "<a href='"+url+"'>"+url+"</a>");
				}
				// リプライ置換
				var replies = state.text.match(/\@[a-zA-Z0-9]+/g) || [];
				for (i=0; i<replies.length; ++i) {
				    var reply = replies[i];
				    var name  = replies[i].match(/[a-zA-Z0-9]+/);
				    state.text = state.text.replace(reply, "<a href='http://twitter.com/"+name+"/' target='_blank'>"+reply+"</a>");
				}
				$(timeline).prepend("<div class="+sliceId+"></div>");
				var div = $(timeline).children("div").get(0);
				$(div) 
				    .append("<div class='timeline-image'><img src='"+state.user.profile_image_url+"' width=32px height=32px alt='"+state.user.profile_image_url+"'/></div>")
				    .append("<div class='timeline-name'><a href='http://twitter.com/"+state.user.screen_name+"/' target='_blank'>"+state.user.screen_name+"</a></div>")
				    .append("<div class='timeline-text'>"+state.text+"</div>")
				    .css({ clear:"both" });
			    }
			    $(".timeline-image").css({ float:"left" });
			    $(".timeline-name") .css({ height:"20px", color:"dimgray", textAlign:"left", fontSize:"0.8em" });
			    $(".timeline-text") .css({ minHeight:"4em", color:"white", textAlign:"left", fontSize:"0.8em" });
			    $("."+sliceId).css({ margin:"0 auto", width:"80%", listStyle:"none", color:"white", backgroundColor:"royalblue", opacity: "0.25" });
			    $("."+sliceId).animate({ opacity: "1" }, 1000);

			    // count件まで表示させる。
			    $(timeline).children("div:gt("+count+")").remove();
			},
			500
		    );
		}
	    }
	})();


	// バインドオブジェクト
    	var Binder = (function () {
	    return function (selector) {
		this.game = function(interval) {
		    var content = new Game(selector);

		    $(selector).after("<div>Start Game</div>");
		    $(selector+"~ div").filter("div")
			.css({ margin:"1em", fontSize:"3em", color:"white", backgroundColor:"blue", borderRadius:"0.5em" })
			.click(function () {
			    $(selector+"~ div").filter("div").remove();
			    content.execute(interval);
			});
		}

		this.corkboard = function(interval) {
		    var content = new Corkboard(selector);

		    $(selector).after("<div>Start Corkboard</div>");
		    $(selector+"~ div").filter("div")
			.css({ margin:"1em", fontSize:"3em", color:"white", backgroundImage:"url(img/cork.jpg)", borderRadius:"0.5em" })
			.click(function () {
			    $(selector+"~ div").filter("div").remove();
			    content.execute(interval);
			});
		}

		// タイムライン表示 
	    	this.timeline = function(interval, count) {
		    var content = new Timeline(selector);

		    $(selector).after("<div>Timeline</div>");
		    $(selector+"~ div").filter("div")
			.css({ margin:"1em", fontSize:"3em", color:"white", backgroundColor:"royalblue", borderRadius:"0.5em" })
			.click(function () {
			    $(selector+"~ div").filter("div").remove();
			    content.execute(interval, count);
			});
		    ;

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
		    success  : success,
		    error    : error,
		    }
		$.ajax(options); 
	    }
	);
    },
};
