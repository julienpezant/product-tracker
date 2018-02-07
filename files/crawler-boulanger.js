var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var fs = require('fs');

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
crawl();

/**
 * Crawls the statements pages
 */
function crawl() {
    if(numPagesVisited >= MAX_PAGES_TO_VISIT) {
        console.log("Reached the last page");
        saveToJson();
        return;
    }else{
        var nextPage = pagesToVisit.pop();
        setTimeout(function(){visitPage(nextPage, crawl)},2000);
    }
}

/**
 * Visits and gets data from a statements page
 */
function visitPage(url, callback) {
    // Increments number of pages visited
    numPagesVisited++;

    // Makes the request
    console.log("Visiting page " + url);

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

            var img_url = $(this).find('div.visuel > div.minbox > a > img').attr("src");
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
            var price = priceExponent + "," + priceFraction;

            var link = 'https://www.boulanger.com' + $(this).find('.designations > h2 > a').attr("href");

            var element = 
            {
            "title" : title, 
            "description":description,
            "img_url": img_url,
            "img_alt": img_alt,
            "price": price,
            "link":link,
            "seller":"Boulanger"
            }


            /*console.log(JSON.stringify(element,null,2));*/
            content.push(element);
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
        console.log("Going to page " + nextLink);
        pagesToVisit.push(nextLink);

        callback();
    });
}

/**
 * Saves the results to a json file.
 */
function saveToJson(){
    var str = JSON.stringify(content, null, 2);
    console.log(str);
    /*fs.writeFile('../data/webdata.json', str, 'utf8', function(err) {
        if(err) {
            return console.log(err);
        }
    });*/
}

function cleanText(text){
    var ntext = text.replace(/[\t\n\r]/g," ");
    ntext = ntext.replace(/\s+/g," ");
    return ntext;
}
