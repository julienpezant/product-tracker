// app/routes.js
var Product = require('./models/product');
var WatchedProduct = require('./models/watchedproduct');
var indexer = require('./tools/index-results');
var validator = require('./tools/validator');

module.exports = function(app, passport, mongoose) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {

        if(isLoggedInBool(req, res)){
            res.redirect('/home');
        }else{
            res.render('index.ejs'); // load the index.ejs file
        }
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        if(isLoggedInBool(req, res)){
            res.redirect('/home');
        }else{
            // render the page and pass in any flash data if it exists
            res.render('login.ejs', { message: req.flash('loginMessage') }); 
        }
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/home', // redirect to the secure home section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        if(isLoggedInBool(req, res)){
            res.redirect('/home');
        }else{
            // render the page and pass in any flash data if it exists
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        }
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/home', // redirect to the secure home section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    app.get('/home', isLoggedIn, function(req, res) {
        res.render('home.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });


    // =====================================
    // SEARCH SECTION =====================
    // =====================================
    app.all('/search', isLoggedIn, function(req, res) {
        var str = req.body.searchcontent;
        var regex = RegExp('^\ *$');
        if(regex.test(str)){
            res.render('search.ejs', {
                user : req.user, // get the user out of session and pass to template
                search : '',
                results : null,
                watched_products: null
            });
        }else{
            Product.find({}, function(err, products){
                if(err){
                    console.log(err);
                    res.render('search.ejs', {
                        user : req.user, // get the user out of session and pass to template
                        search : req.body.searchcontent,
                        results : null,
                        watched_products: null
                    });
                } else{
                    results = products;
                    indexed_results = indexer.searchProductsFromIndex(str, products);
                    WatchedProduct.find({}, function(err, watched_products){
                        if(err){
                            console.log(err);
                            res.render('search.ejs', {
                                user : req.user, // get the user out of session and pass to template
                                search : req.body.searchcontent,
                                results : null,
                                watched_products: null
                            });
                        } else {
                            res.render('search.ejs', {
                                user : req.user, // get the user out of session and pass to template
                                search : req.body.searchcontent,
                                results : indexed_results,
                                watched_products : watched_products
                            });
                        }
                    });
                }
            });
        }
    });


    // =====================================
    // SIMILAR PRODUCTS SECTION ============
    // =====================================
    app.get('/similarProducts', isLoggedIn, function(req,res) {
        var sid = req.query.sid;
        Product.findOne({'sid':sid}, function(err, mainproduct){
            if(err){
                console.log('Could not query product');
            } else {
                Product.find({}, function(err, products){
                    if(err){
                        console.log(err);
                    } else{
                        results = products;
                        indexed_results = indexer.searchSimilarProducts(mainproduct, products);
                        WatchedProduct.find({}, function(err, watched_products){
                            if(err){
                                console.log(err);
                                res.render('home.ejs', {
                                    user : req.user, // get the user out of session and pass to template
                                });
                            } else {
                                res.render('similarproducts.ejs', {
                                    user : req.user, // get the user out of session and pass to template
                                    sourceprod : mainproduct,
                                    results : indexed_results,
                                    watched_products : watched_products
                                });
                            }
                        });
                    }
                })
            }
        });
    });


    // =====================================
    // ADD NEW WATCHED PRODUCT ============
    // =====================================
    app.get('/addWatchedProd', isLoggedIn, function(req, res) {
        var email = req.user.local.email;
        var sid = req.query.sid;
        // Create an instance of WatchedProduct
        var watched_product_instance = new WatchedProduct({ 
            umail : email,
            sid : sid,
            threshold : "1000",
            notifications : "disabled"
        });

        // Save the new model instance, passing a callback
        watched_product_instance.save(function (err) {
            if (err) return handleError(err);
                // saved!
                res.redirect('/watchedProduct?sid='+sid);
        }); 
    });


    // =====================================
    // EDIT WATCHED PRODUCT DATA ===========
    // =====================================
    app.all('/editWatchedProduct', isLoggedIn, function(req, res) {
        var email = req.user.local.email;
        var sid = req.query.sid;
        var error_msg = null;
        var threshold = req.body.threshold;
        if(!validator.validateNumber(threshold)){
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


    // =====================================
    // REMOVE WATCHED PRODUCT ==============
    // =====================================
    app.get('/removeWatchedProduct', isLoggedIn, function(req, res){
        var email = req.user.local.email;
        var sid = req.query.sid;
        WatchedProduct.findOneAndRemove({'sid':sid, 'umail':email}, function(err){
            if(err){
                console.log('Could not query watched product');
            } 
            res.redirect('/watchlist');
        });
    });


    // =====================================
    // WATCHED PRODUCT SECTION =============
    // =====================================
    app.all('/watchedProduct', isLoggedIn, function(req, res) {
        var email = req.user.local.email;
        var sid = req.query.sid;
        var msg = req.query.formMsg;
        if(msg === 'numerror'){
            msg = "invalid_num";
        }else if(msg === 'updated'){
            msg = "valid_num";
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
                            }
                        }
                    }
                });
            }
        });
    });


    // =====================================
    // WATCHLIST SECTION ===================
    // =====================================
    app.get('/watchlist', isLoggedIn, function(req,res) {
        var email = req.user.local.email;
        var results = [];
        WatchedProduct.find({'umail':email}, function(err, watchedproducts){
            if(err){
                console.log('Could not query watched products');
                res.render('home.ejs', {
                    user : req.user, // get the user out of session and pass to template
                });
            } else {

                Product.find({}, function(err2, products){
                    if(err2){
                        console.log('Could not query products');
                        res.render('home.ejs', {
                            user : req.user, // get the user out of session and pass to template
                        });
                    } else {
                        for(product in products){
                            product = products[product];
                            for(wprod in watchedproducts){
                                wprod = watchedproducts[wprod];
                                if(product.sid === wprod.sid){
                                    results.push(product);
                                }
                            }
                        }
                        res.render('watchlist.ejs', {
                            user : req.user, // get the user out of session and pass to template
                            results : results,
                            watched_products : watchedproducts
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

    // =====================================
    // ERROR ===============================
    // =====================================
    app.get('*', function(req, res){
        res.render('error404.ejs');
    });

};

// route middleware to check user login
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't, redirect them to the home page
    res.redirect('/');
}

//checks user login (not a middleware)
function isLoggedInBool(req, res){
    if (req.isAuthenticated()){
        return true;
    }
    return false;
}
