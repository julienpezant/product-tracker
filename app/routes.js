// app/routes.js
var Product = require('./models/product');
var WatchedProduct = require('./models/watchedproduct');
var elasticlunr = require('elasticlunr');

module.exports = function(app, passport, mongoose) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // SEARCH SECTION =====================
    // =====================================
    app.all('/search', isLoggedIn, function(req, res) {
        var str = req.body.searchcontent;
        Product.find({}, function(err, products){
            if(err){
                console.log(err);
                res.render('search.ejs', {
                    user : req.user, // get the user out of session and pass to template
                    search : req.body.searchcontent,
                    results : null
                });
            } else{
                results = products;
                index = createProductIndex(products);
                indexed_results = searchProductsFromIndex(str, index, products);
                res.render('search.ejs', {
                    user : req.user, // get the user out of session and pass to template
                    search : req.body.searchcontent,
                    results : indexed_results
                });
            }
        })
    });

    app.get('/addWatchedProd', isLoggedIn, function(req, res) {
        var email = req.user.local.email;
        var sid = req.query.sid;
        // Create an instance of WatchedProduct
        var watched_product_instance = new WatchedProduct({ 
            umail : email,
            sid : sid,
            threshold : "-1",
            notifications : "disabled"
        });

        // Save the new model instance, passing a callback
        watched_product_instance.save(function (err) {
            if (err) return handleError(err);
                // saved!
                res.redirect('/watchedProduct?sid='+sid);
        }); 
    });

    app.all('/editWatchedProduct', isLoggedIn, function(req, res) {
        var email = req.user.local.email;
        var sid = req.query.sid;
        var error_msg = null;
        var threshold = req.body.threshold;
        if(!validateNumber(threshold)){
            res.redirect('/watchedProduct?sid='+sid+"&formMsg=numerror");
            return;
        }

        var notifications = req.body.notifications;
        // Find and update the watched product in the database
        var watched_product_instance = new WatchedProduct({ 
            umail : email,
            sid : sid,
            threshold : threshold,
            notifications : notifications
        });

        WatchedProduct.findOneAndUpdate({'umail': email, 'sid': sid}, {$set:{'threshold':threshold,'notifications':notifications}},function(err, doc){
            if(err) return handleError(err);
            res.redirect('/watchedProduct?sid='+sid+"&formMsg=updated");
        });
    });

    app.all('/watchedProduct', isLoggedIn, function(req, res) {
        var email = req.user.local.email;
        var sid = req.query.sid;
        var msg = req.query.formMsg;
        if(msg === 'numerror'){
            msg = "Invalid threshold. Please enter a valid number. (30, 250.99, etc...)";
        }else if(msg === 'updated'){
            msg = "Successfully updated settings";
        }
        WatchedProduct.findOne({'sid':sid, 'umail':email}, function(err, watchedproduct){
            if(err){
                console.log('Could not query watched product');
                res.render('watchedproduct.ejs', {
                    user : req.user, // get the user out of session and pass to template
                    product : null
                });
            } else {
                Product.find({}, function(err2, products){
                    if(err2){
                        console.log('Could not query products');
                        res.render('watchedproduct.ejs', {
                            user : req.user, // get the user out of session and pass to template
                            product : null
                        });
                    } else {
                        console.log("query successful");
                        for(product in products){
                            product = products[product];
                            if(product.sid === sid){
                                res.render('watchedproduct.ejs', {
                                    user : req.user, // get the user out of session and pass to template
                                    product : product,
                                    threshold : watchedproduct.threshold,
                                    notifications : watchedproduct.notifications,
                                    msg : msg
                                });
                                // localhost:8080/watchedProduct?sid=boulanger_product_1260482
                            }
                        }
                    }
                });
            }
        });
    });

    app.get('/watchlist', isLoggedIn, function(req,res) {
        var email = req.user.local.email;
        var results = [];
        WatchedProduct.find({'umail':email}, function(err, watchedproducts){
            if(err){
                console.log('Could not query watched products');
                res.render('profile.ejs', {
                    user : req.user, // get the user out of session and pass to template
                });
            } else {

                Product.find({}, function(err2, products){
                    if(err2){
                        console.log('Could not query products');
                        res.render('profile.ejs', {
                            user : req.user, // get the user out of session and pass to template
                        });
                    } else {
                        for(product in products){
                            product = products[product];
                            for(wprod in watchedproducts){
                                wprod = watchedproducts[wprod];
                                console.log(product);
                                if(product.sid === wprod.sid){
                                    results.push(product);
                                }
                            }
                        }

                        res.render('watchlist.ejs', {
                            user : req.user, // get the user out of session and pass to template
                            results : results
                        });
                    }
                });
            }
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

/**
 * Uses a response from mongoose to generate an elasctilunr index for products
 */
function createProductIndex(data){

    // create our elasticlunr index
    var index = elasticlunr(function () {
        this.addField('sid');
        this.addField('title');
        this.addField('desc');
        this.addField('iurl');
        this.addField('ialt');
        this.addField('price');
        this.addField('link');
        this.addField('seller');
        this.setRef('sid')
    });

    // insert data into the index
    for(product of data){

        var newProduct = {
            "sid": product.sid,
            "title": product.title,
            "desc": product.desc,
            "iurl": product.iurl,
            "ialt":  product.ialt,
            "price":  product.price,
            "link": product.link,
            "seller": product.seller
        };

        index.addDoc(newProduct);
    }

    return index;
}

function searchProductsFromIndex(searchString, index, data){

    // expand = true increases the overall recall
    var res = index.search(searchString,
        {
            fields: {
                title : {boost : 10},
                desc : {boost : 3},
                seller : {boost : 3}
            },
            bool: "OR",
            expand: true
        });

    var content = [];

    for(doc of res){
        var doc = findDocument(doc.ref, data);
        if(doc != null){
            content.push(doc);
        }
    }

    // return the retrieved results
    if(content.length > 0){
        return content;
    }else{
        return null;
    }
}

function findDocument(reference, data){
    for(product of data){
        if(product.sid == reference){
            return product;
        }
    }
    return null;
}

function validateNumber(number){
    var regex = RegExp('^[0-9]+\.[0-9]{2}$|^[0-9]+$');
    number = number.replace(",",".");
    return regex.test(number);
}
