
// WHAT SERVER AM I
var serverSignature = "1"; //second server
var serverIP = 3001; //update node server based on this information


// Module dependencies
var express = require('express');
var routes = require('./routes');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var app = module.exports = express.createServer();
var logStream = fs.createWriteStream('./logServ' + serverSignature + '.txt', {flags:'w'}); //truncates file if it exists, 'a' to append

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


// Config vars
var title = "fileShare";
var filesRoot = "public/files/";  //root dir of file directories
var fileData = "filedata.md";  //name of metadata file used in each directory


// Routes

// Index
app.get('/', function(req, resp){
  resp.render('index', { title: title, serverSig : serverSignature });
});

app.get('/get/:id', function(req, res){
	// Read in the files metadata from the requested directory
	fs.readFile(path.join(filesRoot,req.params.id,fileData), 'utf8', function (err, files) {
  		if(err) {
  			console.log(err);
  			res.send(500);
  		} else {
  			files = files.slice(0, -1);  //remove trailing comma
  			files = ('[' + files + ']');  //add brackets to "create" and array literal
  			files = JSON.parse(files);
  			res.render('fileView', { title : title, files : files, userId : req.params.id });
  		}
	});
});


// Click on the images in browser to call this
app.get('/download/:userId/:file', function(req, res){
  var path = filesRoot + req.params.userId + '/' + req.params.file;
  res.download(path, function(err){
  	res.send(500);  //internal server error
  });
});


// file upload
app.post('/fileUpload/:id', function(req, res){
	var dir = path.join(filesRoot, req.params.id);
	
	// Make directory if it hasn't already been created
	fs.mkdir(dir, function(){
		// Stream file from temp to permanent storage
		var readStream = fs.createReadStream(req.files.file.path);
		var writeStream = fs.createWriteStream(path.join(dir, req.files.file.name));
		readStream.pipe(writeStream);
		req.files.file.path = path.join(dir, req.files.file.name);  //change path to new location
		
		// Save file metadata, append to or create session file
		fs.open(path.join(dir,fileData), 'a', function( e, id ) {
			var writeString = (JSON.stringify(req.files.file) + ',');
  			fs.write(id, writeString, null, 'utf8', function(){
    			fs.close(id);
   			});
		});	
	}); 
	
	res.send(204); 	
});

app.listen(serverIP, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
