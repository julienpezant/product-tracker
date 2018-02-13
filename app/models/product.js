// app/models/product.js
var mongoose = require('mongoose');

// define the schema for our product model
var productSchema = mongoose.Schema({
    sid : String,
    title : String, 
    desc :String,
    iurl : String,
    ialt : String,
    price : String,
    link : String,
    seller : String
});

// create the model for products and expose it to our app
module.exports = mongoose.model('Product', productSchema);