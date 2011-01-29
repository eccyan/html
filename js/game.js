$().ready(function(){
    getAccessToken(alerter);
});

function getAccessToken(callback) {
	var url = 'http://eccyan.com/api/1/access_parameters.php';
	$.getJSON(url, callback);
}

function alerter(data, status) {
	alert(data);
}
