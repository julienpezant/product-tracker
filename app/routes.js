// app/routes.js
var Product = require('./models/product');
var WatchedProduct = require('./models/watchedproduct');
var elasticlunr = require('elasticlunr');

module.exports = function(app, passport, mongoose) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {

        if(isLoggedInBool(req, res)){
            res.redirect('/profile');
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
            res.redirect('/profile');
        }else{
            // render the page and pass in any flash data if it exists
            res.render('login.ejs', { message: req.flash('loginMessage') }); 
        }
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

        if(isLoggedInBool(req, res)){
            res.redirect('/profile');
        }else{
            // render the page and pass in any flash data if it exists
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        }
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
                    indexed_results = searchProductsFromIndex(str, products);
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
                        indexed_results = searchSimilarProducts(mainproduct, products);
                        WatchedProduct.find({}, function(err, watched_products){
                            if(err){
                                console.log(err);
                                res.render('profile.ejs', {
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


    // =====================================
    // WATCHLIST SECTION ===================
    // =====================================
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
                                if(product.sid === wprod.sid){
                                    results.push(product);
                                }
                            }
                        }
                        if(results.length === 0){
                            console.log('no watchlist');
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

function isLoggedInBool(req, res){
    if (req.isAuthenticated()){
        return true;
    }
    return false;
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

function searchProductsFromIndex(searchString, data){

    index = createProductIndex(data);
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

function searchSimilarProducts(mainproduct, data){
    index = createProductIndex(data);
    var terms = mainproduct.title + " " + mainproduct.desc;

    //removing generic terms
    terms = terms.replace(/ordinateur|pc|portable/gi,'');

    var res = index.search(terms,
        {
            fields: {
                title : {boost : 3},
                desc : {boost : 1}
            },
            bool: "OR",
            expand: true
        });

    var content = [];

    var c = 0;
    for(doc of res){
        var doc = findDocument(doc.ref, data);
        if(c < 20){
            if(doc != null){
                if(doc.sid != mainproduct.sid){
                    content.push(doc);
                    c++;
                }
            }
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
