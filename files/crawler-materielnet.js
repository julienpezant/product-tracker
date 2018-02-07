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
var START_URL = "https://www.materiel.net/pc-portable/";
var url = new URL(START_URL);
var baseUrl = url.protocol + "//" + url.hostname;

// Starts filling the content array
pagesToVisit.push(START_URL);
console.log(pagesToVisit);
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

            
            var img_url = $(this).find('td.Photo > a > span > img').attr("src");
            var img_alt = $(this).find('td.Photo > a > span > img').attr("alt");

            var title = $(this).find('td.Desc > table > tbody > tr > td > a').attr("title");

            var description =  $(this).find('td.Desc > table > tbody > tr > td > div.Carac > span').text().trim();

            var price = cleanPrice($(this).find('td.Price > span.prix').text().trim());

            var link = 'https://www.materiel.net' + $(this).find('td.Desc > table > tbody > tr > td > a').attr("href");



            var element = 
            {
            "title" : title, 
            "description":description,
            "img_url": img_url,
            "img_alt": img_alt,
            "price": price,
            "link":link,
            "seller":"materiel.net"
            }


            /*console.log(JSON.stringify(element,null,2));*/
            content.push(element);
        });

        var nextLink = START_URL + "?p=" + (numPagesVisited + 1);
        //if we reached the last page, nextLink should be undefined
        if(nextLink == null){
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

function cleanPrice(text){
    var ntext = text.replace(/[€\s]/g,"");
    /*ntext = ntext.replace(/\s+/g," ");*/
    return ntext;
}
