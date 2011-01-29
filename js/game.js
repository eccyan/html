var game = {
    api : {
	accessParameters : function (callback) {
	    var url = 'http://eccyan.com/api/1/access_parameters.php';
	    $.getJSON(url, callback);
	},
    }
};

