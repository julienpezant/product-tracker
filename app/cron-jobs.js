module.exports = function(cron, mongoose) {
	cron.schedule('42 5 * * *', function(){
		console.log('========================== Starting daily crawling tasks ==========================');
		mongoose.connection.collections['products'].drop( function(err) {
			console.log("Dropped old products collection");
       		require('./crawlers/crawler-materielnet.js')(mongoose);
  			require('./crawlers/crawler-boulanger.js')(mongoose);
    	});
	});

	cron.schedule('0 6 * * *', function(){
		console.log('========================== Starting daily mailing tasks ===========================');

	});


};