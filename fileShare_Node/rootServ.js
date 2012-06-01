

// Module dependencies
var express = require('express');
var routes = require('./routes');
var path = require('path');
var fs = require('fs');

var app = module.exports = express.createServer();
var logStream = fs.createWriteStream('./logRootServ.txt', {flags:'w'}); //truncates file if it exists, 'a' to append

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use(express.logger({ stream : logStream }));  //logging middleware
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


// TODO:
// Create a build script go through server.js files and build these vars and array automatically

// Config vars
var serverCount = 2;  //how many servers are currently running
var offset = 1; // How many characters to read from session id to get the server id. For example, if there
				// were over 100 servers, then the offset would be 3 because id's would be 3 digits

var serverList = [
	{
		'signature' : '0',
		'url' : 'http://localhost:3000'
	},
	{
		'signature' : '1',
		'url' : 'http://localhost:3001'
	}	
];


var server = 0; //start value used to determine which server to send request to
app.get('/', function(req, res){
	console.log("Forwarding request to server " + server);
	res.redirect(serverList[server++].url);
		  	
  	//reset count
   	if(server >= serverCount){
  		server = 0;
  	}
});

app.get('/get/:id', function(req, res){
	var id = req.params.id.slice(0, offset); //get server id
	var servId = parseInt(id);
	console.log("Forwarding get request to server " + server);
	
	var url = (serverList[servId].url + "/get/" + req.params.id);
	res.redirect(url);
});


app.listen(4000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
