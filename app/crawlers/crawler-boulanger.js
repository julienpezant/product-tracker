// load up the product model
var Product = require('../models/product');

module.exports = function(mongoose) {

    crawlBoulanger();

    function crawlBoulanger(){

        var request = require('request');
        var cheerio = require('cheerio');
        var URL = require('url-parse');

        // For testing purposes 
        var MAX_PAGES_TO_VISIT = 100;

        // Used to crawl the list of pages
        var pagesVisited = {};
        var numPagesVisited = 0;
        var pagesToVisit = [];

        // Contains the pages' data
        var content = [];

        // First page to visit and base url
        var START_URL = "https://www.boulanger.com/c/tous-les-ordinateurs-portables";
        var url = new URL(START_URL);
        var baseUrl = url.protocol + "//" + url.hostname;

        // Starts filling the content array
        pagesToVisit.push(START_URL);
        console.log("Started crawling boulanger.com");
        crawl();

        function crawl() {
            if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
                console.log("Reached the last page of boulanger.com");
                saveData();
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
                    callback();
                    return;
                }
                // Parses the document body
                var $ = cheerio.load(body);

                //Looks for data
                $('div.productListe > div.product').each(function( index ) {

                    var img_url = $(this).find('div.visuel > div.minbox > a > img').attr("data-lazy-src");

                    var img_alt = $(this).find('div.visuel > div.minbox > a > img').attr("alt");
                    
                    var title = cleanText($(this).find('.designations > h2 > a').text().trim());

                    var description =  '';
                    var compteur = 0;
                    $(this).find('div.designations > div.carac > ul > li').each(function( index2 ) {
                        var text = cleanText($(this).text());
                        if (!(compteur > 2)){
                            description += text;
                        }
                        compteur++;
                    });

                    var priceExponent = $(this).find('.pl-purchase-block > div.price > p > span.exponent').text().trim();
                    var priceFraction = $(this).find('.pl-purchase-block > div.price > p > sup > span.fraction').text().trim();
                    var price = priceExponent + "." + priceFraction;

                    var link = 'https://www.boulanger.com' + $(this).find('.designations > h2 > a').attr("href");

                    var sid = "boulanger_" + $(this).attr("id");

                    // Create an instance of Product
                    var product_instance = new Product({ 
                        sid : sid,
                        title : title, 
                        desc : description,
                        iurl : img_url,
                        ialt : img_alt,
                        price : price,
                        link : link,
                        seller : "Boulanger"
                     });

                    // Save the new model instance, passing a callback
                    product_instance.save(function (err) {
                      if (err) return handleError(err);
                      // saved!
                    });

                    /*var element = 
                    {
                    "title" : title, 
                    "description":description,
                    "img_url": img_url,
                    "img_alt": img_alt,
                    "price": price,
                    "link":link,
                    "seller":"Boulanger"
                    }

                    content.push(element);*/
                });

                var basepage = 'https://www.boulanger.com'; 
                var nextpage = $('span.navPage-right > a').attr("href");
                var nextLink = basepage + nextpage;
                //if we reached the last page, nextLink should be undefined
                if(nextpage == null){
                    MAX_PAGES_TO_VISIT = numPagesVisited;
                    callback();
                    return;
                }
                console.log("   - Going to page " + nextLink);
                pagesToVisit.push(nextLink);

                callback();
            });
        }

        function saveData(){
            console.log("Saving data from boulanger.com");
        }

        function cleanText(text){
            var ntext = text.replace(/[\t\n\r]/g," ");
            ntext = ntext.replace(/\s+/g," ");
            return ntext;
        }

    }

}
