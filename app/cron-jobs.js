module.exports = function(cron, mongoose) {

	//crawl websites at 1am each day
	cron.schedule('0 0 * * *', function(){
		console.log('========================== Starting daily crawling tasks ==========================');
		mongoose.connection.collections['products'].drop( function(err) {
			console.log("Dropped old products collection");
       		require('./crawlers/crawler-materielnet.js')(mongoose);
  			require('./crawlers/crawler-boulanger.js')(mongoose);
    	});
	});

	//send notifications every monday at 4am
	cron.schedule('0 4 * * 1', function(){
		console.log('========================== Starting daily mailing tasks ===========================');
		require('./tools/mailer.js')(mongoose);
	});


};