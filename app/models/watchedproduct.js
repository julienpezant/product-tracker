// app/models/watchedproduct.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our watched product model
var watchedProductSchema = mongoose.Schema({
	umail : String,
    sid : String, 
    threshold : String,
    notifications : String
});

// create the model for products and expose it to our app
module.exports = mongoose.model('WatchedProduct', watchedProductSchema);