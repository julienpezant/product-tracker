//indexes data from product response

var Product = require('../models/product');
var elasticlunr = require('elasticlunr');

module.exports = {

    searchProductsFromIndex: function(searchString, data){

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
    },

    searchSimilarProducts: function(mainproduct, data){
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
};

function findDocument(reference, data){
    for(product of data){
        if(product.sid == reference){
            return product;
        }
    }
    return null;
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