// load up the models
var Product = require('../models/product');
var WatchedProduct = require('../models/watchedproduct');

module.exports = function(mongoose) {

	removeObsoleteEntries();

	/**
	 * Removes obsolete entries from mongoDB.
	 */
	function removeObsoleteEntries(){
		//get watched products
        WatchedProduct.find({}, function(err, watched_products){
        	if(err){

        	}else{
        		//get products
        		Product.find({}, function(err2, products){
        			if(err2){

        			}else{
        				for(wprod in watched_products){
                            wprod = watched_products[wprod];

                            //check = false if the product in watched_products is not in products (it has to be deleted)
                            var check = false;

                            for(prod in products){
                                prod = products[prod];
                                //if the product and watched product have the same sid, then the check switches to true
                                if(prod.sid === wprod.sid){
                                    check = true;
                                    break;
                                }
                            }

                            if(!check){
                            	WatchedProduct.findOneAndRemove({'_id' : wprod._id}, function(err){
						            if(err){
						                console.log('Could not remove watched product');
						            } 
						        });
                            }
                        }
        			}
        		});
        	}
        });
	}
}