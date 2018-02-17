// load up the models
var Product = require('../models/product');
var WatchedProduct = require('../models/watchedproduct');

const nodemailer = require('nodemailer');

module.exports = function(mongoose) {

	sendMails();

	/**
	 * Removes obsolete entries from mongoDB.
	 */
	function sendMails(){
		//get watched products
        WatchedProduct.find({}, function(err, watched_products){
        	if(err){
        		console.log("couldnt get watched products from db");
        	}else{
        		//get products
        		Product.find({}, function(err2, products){
        			if(err2){
        				console.log("couldnt get products from db");
        			}else{
        				for(wprod in watched_products){
                            wprod = watched_products[wprod];
                            for(prod in products){
                                prod = products[prod];
                                if(prod.sid === wprod.sid){
                                	if(wprod.notifications === 'enabled' && parseFloat(wprod.threshold) >= parseFloat(prod.price)){
                                		sendNotif(wprod,prod);
                                		break;
                                	}
                                }
                            }
                        }
        			}
        		});
        	}
        });
	}

	function sendNotif(wprod,prod){

		var sender = 'producttrackermail@gmail.com';
		var password = 'prodtrackunicaen2018';

		var message = "Greetings " + wprod.umail + ", the price of the product \"" + prod.title + "\" (" + prod.price + " €) is below the threshold you set for it (" + wprod.threshold + " €). Check it out here : "+prod.link;
		var html = "<h4>Greetings " + wprod.umail + ",</h4> <p>The price of the product <i>\"" + prod.title + "\"</i> (" + prod.price + " €) is below the threshold you set for it (" + wprod.threshold + " €).</p> <a href="+prod.link+">Check it out here</a>";

		var transporter = nodemailer.createTransport({
		  service: 'gmail',
		  auth: {
		    user: sender,
		    pass: password
		  }
		});

		var mailOptions = {
		  from: sender,
		  to: wprod.umail,
		  subject: 'Sending Email using Node.js',
		  text: message,
		  html: html

		};

		transporter.sendMail(mailOptions, function(error, info){
		  if (error) {
		    console.log(error);
		  } else {
		    console.log('Email sent: ' + info.response);
		  }
		});

	    console.log("A mail should be sent to " + wprod.umail + "because the price of product " + wprod.sid + " ("
	    	+ prod.title + ") is below its associated threshold. (Price : " + prod.price + " <= Threshold : " + wprod.threshold + ")");
	    console.log("===========");
	}

}