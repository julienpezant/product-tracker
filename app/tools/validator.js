module.exports = {
	validateNumber: function(number){
	    var regex = RegExp('^[0-9]+\.[0-9]{2}$|^[0-9]+$');
	    number = number.replace(",",".");
	    return regex.test(number);
	}
}