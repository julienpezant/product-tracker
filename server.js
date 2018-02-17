// server.js

// set up ======================================================================
var path = require('path')
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');

var server = require('http').createServer(app);

var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var cron 		 = require('node-cron');

var configDB = require('./config/database.js');


// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


require('./config/passport')(passport); // pass passport for configuration

// set up our express application
/*app.use(morgan('dev'));*/ // log every request to the console, used for dev
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

// static files
app.use(express.static(__dirname + '/public'));

//view engine
app.set('views', path.join(__dirname, '/public/views'));
app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'producttrackerisgood' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport, mongoose); // load the routes

// cron jobs ===================================================================
require('./app/cron-jobs.js')(cron, mongoose);

server.listen(port, function(){
	console.log('Product Tracker is up on port ' + port);
});