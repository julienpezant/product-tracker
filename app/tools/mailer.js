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

		/*console.log("Sending mail");

		// Generate test SMTP service account from ethereal.email
		// Only needed if you don't have a real mail account for testing
		nodemailer.createTestAccount((err) => {

			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			// create reusable transporter object using the default SMTP transport
		    let transporter = nodemailer.createTransport({
		        host: 'smtp.ethereal.email',
		        port: 587,
		        secure: false, // true for 465, false for other ports
		        auth: {
		            user: 'product-tracker', // generated ethereal user
		            pass: 'whatever'  // generated ethereal password
		        }
		    });

			// setup email data with unicode symbols
		    let mailOptions = {
		        from: '"Product Tracker" <product.tracker@automailer.com>', // sender address
		        to: wprod.umail, // list of receivers
		        subject: 'Product Tracker - Notification', // Subject line
		        text: 'This product\'s price is below the threshold you set for it. Check it out on "localhost:8080".', // plain text body
		        html: '<p>This product\'s price is below the threshold you set for it. Check it out on "localhost:8080".</p>' // html body
		    };

		    // send mail with defined transport object
		    transporter.sendMail(mailOptions, (error, info) => {
		        if (error) {
		            return console.log(error);
		        }
		        console.log('Message sent: %s', info.messageId);
		        // Preview only available when sending through an Ethereal account
		        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
		    });
	    });*/

	    console.log("A mail should be sent to " + wprod.umail + "because the price of product " + wprod.sid + " ("
	    	+ prod.title + ") is below its associated threshold. (Price : " + prod.price + " <= Threshold : " + wprod.threshold + ")");
	    console.log("===========");
	}

}