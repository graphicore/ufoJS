
var express = require('express');
var fs = require('fs');
var wrapup = require('wrapup');

var app = express();

app.engine('html', function(path, options, fn){
	fs.readFile(path, function(err, data){
		if (err) fn(err);
		else fn(null, String(data));
	});
});

app.get('/', function(req, res){
	res.render(__dirname + '/index.html');
});

app.get(/\/mocha\.(js|css)/, function(req, res, next){
	var type = req.params[0];
	fs.readFile(__dirname + '/../node_modules/mocha/mocha.' + type, function(err, data){
		if (err) next(err);
		else {
			res.type(type);
			res.send(String(data));
		}
	});
});

app.get('/test.js', function(req, res, next){
	var wrup = wrapup();
	wrup.require(__dirname + '/Complex.js');
	res.type('js');
	res.send(wrup.up());
});

app.listen(3000);
console.log('Listening on port 3000');
