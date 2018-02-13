/*var socket = io.connect('http://localhost:8080');

$( function() {

	$('body').on('click', '.infobox_watchlist_add_button', function(e) {
        e.stopPropagation();
        var product_id = e.target.id;
        product_id = product_id.replace('button_','');
        e.target.className = 'infobox_watchlist_remove_button';
        e.target.innerHTML = 'Remove from watchlist';
        socket.emit('ATWL', [product_id]);
    });

	$('body').on('click', '.infobox_watchlist_remove_button', function(e) {
        e.stopPropagation();
        var product_id = e.target.id;
        product_id = product_id.replace('button_','');
        e.target.className = 'infobox_watchlist_add_button';
        e.target.innerHTML = 'Add to watchlist';
        socket.emit('RFWL', [product_id]);
    });


});*/