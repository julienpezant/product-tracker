// load up the product model
var Product = require('../models/product');

module.exports = function(mongoose) {

    crawlMaterielNet();

    function crawlMaterielNet(){

        var request = require('request');
        var cheerio = require('cheerio');
        var URL = require('url-parse');
        /*var fs = require('fs');*/

        // For testing purposes 
        var MAX_PAGES_TO_VISIT = 100;

        // Used to crawl the list of pages
        var pagesVisited = {};
        var numPagesVisited = 0;
        var pagesToVisit = [];

        // Contains the pages' data
        var content = [];

        // First page to visit and base url
        var START_URL = "https://www.materiel.net/pc-portable/";
        var url = new URL(START_URL);
        var baseUrl = url.protocol + "//" + url.hostname;

        // Starts filling the content array
        pagesToVisit.push(START_URL);
        console.log("Started crawling materiel.net");
        crawl();


        function crawl() {
            if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
                console.log("Reached the last page of materiel.net");
                cleanData();
                return;
            }else{
                var nextPage = pagesToVisit.pop();
                setTimeout(function(){visitPage(nextPage, crawl)},2000);
            }
        }


        function visitPage(url, callback) {
            // Increments number of pages visited
            numPagesVisited++;

            // Makes the request
            var options = {
                url: url,
                headers: {
                    'User-Agent': '1st ZipCommander (Net) - http://www.zipcommander.com/'
                }
            };

            request(options, function(error, response, body) {
                if(response.statusCode !== 200) {
                    console.log("error : "+ response.statusCode);
                    callback();
                    return;
                }
                // Parses the document body
                var $ = cheerio.load(body);

                var pageContent = $('table.ProdList > tbody');
                if(pageContent.length == 0){
                    MAX_PAGES_TO_VISIT = numPagesVisited;
                    callback();
                    return;
                }

                //Looks for data
                $('table.ProdList > tbody > tr').each(function( index ) {

                    
                    var img_url = $(this).find('td.Photo span img').attr("src");
                    var img_alt = $(this).find('td.Photo span img').attr("alt");

                    var title = $(this).find('td.Desc > table > tbody > tr > td > a').attr("title");

                    var description =  $(this).find('td.Desc > table > tbody > tr > td > div.Carac > span').text().trim();

                    var price = cleanPrice($(this).find('td.Price > span.prix').text().trim());
                    price = price.replace(",",'.');

                    var link = 'https://www.materiel.net' + $(this).find('td.Desc > table > tbody > tr > td > a').attr("href");

                    var sid = "materielnet_" + $(this).attr("data-numkey");

                    // Create an instance of Product
                    var product_instance = new Product({ 
                        sid : sid,
                        title : title, 
                        desc : description,
                        iurl : img_url,
                        ialt : img_alt,
                        price : price,
                        link : link,
                        seller : "materiel.net"
                     });

                    // Save the new model instance, passing a callback
                    product_instance.save(function (err) {
                      if (err) return handleError(err);
                      // saved!
                    });

                });

                var nextLink = START_URL + "?p=" + (numPagesVisited + 1);
                //if we reached the last page, nextLink should be undefined
                if(nextLink == null){
                    MAX_PAGES_TO_VISIT = numPagesVisited;
                    callback();
                    return;
                }
                console.log("   - Going to page " + nextLink);
                pagesToVisit.push(nextLink);

                callback();
            });
        }


        function cleanData(){
            require('../tools/clean-watchlists.js')(mongoose);
            console.log("Cleaning up collections...");
        }

        function cleanText(text){
            var ntext = text.replace(/[\t\n\r]/g," ");
            ntext = ntext.replace(/\s+/g," ");
            return ntext;
        }

        function cleanPrice(text){
            var ntext = text.replace(/[€\s]/g,"");
            return ntext;
        }

    }

}
