const dateNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

exports.formatTime = function(time){
	var min = (time % 100)
	return Math.floor(time / 100) + ':' + (min < 10 ? '0' : '') + min;
}

exports.formatDate = function(date){
	return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
}

exports.toDate = function(date){
	str = date.toString();
	if(!/^(\d){8}$/.test(str)) return new Date(0, 0, 1);;
    var y = str.substr(0,4),
        m = str.substr(4,2),
        d = str.substr(6,2);
    return new Date(y, m - 1, d);
}

exports.getDateName = function(day){
	return dateNames[day];
}