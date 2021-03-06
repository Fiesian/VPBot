const https = require("https");
const config = require("./config/config.js");
const formatter = require("./formatter.js");

exports.loadTimetableRaw = function(classId, callback, callbackErr) {
    var date = new Date();
    date.setDate(date.getDate() + config.get('dev_shift_days')); //For debugging
    if (date.getDay() == 6 || date.getDay() == 0 || (date.getDay() == 5 && date.getHours() >= 14)) {
        var dateString = [date.getFullYear(), ((date.getMonth() + 1 > 9 ? '' : '0') + (date.getMonth() + 1)), ((date.getDate() > 9 ? '' : '0') + (date.getDate() + 3))].join('-');
    } else {
        var dateString = [date.getFullYear(), ((date.getMonth() + 1 > 9 ? '' : '0') + (date.getMonth() + 1)), ((date.getDate() > 9 ? '' : '0') + date.getDate())].join('-');
    }

    //'https://mese.webuntis.com/WebUntis/api/public/timetable/weekly/data?elementType=1&elementId=' + classId + '&date=' + dateString + '&formatId=1'
    var options = {
        'hostname': 'mese.webuntis.com',
        'path': ('/WebUntis/api/public/timetable/weekly/data?elementType=1&elementId=' + classId + '&date=' + dateString + '&formatId=1'),
        'headers': {
            'Cookie': 'schoolname="_a3NoLXN0LiBhbnNnYXI="'
        }
    }

    https.request(options, function(resp) {
        let data = '';
        resp.setEncoding('utf8');
        if (resp.statusCode != 200) {
            console.log('Received status code ' + resp.statusCode + ' (' + resp.statusMessage + ').');
            console.log('Request options: ' + JSON.stringify(options));
            console.log('Response: ' + JSON.stringify(resp.headers));
            console.log('ClassID: ' + classId);
            callbackErr(resp.statusCode);
            return;
        }

        resp.on('data', d => {
            data += d;
        });

        resp.on('end', () => {
            callback(JSON.parse(data));
        });

        resp.on('error', e => {
            console.error(e);
            console.log('Status ' + resp.statusCode + ' (' + resp.statusMessage + ').');
            console.log('Request options: ' + options);
            console.log('Response: ' + resp.headers);
            callbackErr();
        });
    }).end();
}

exports.loadClassesRaw = function(callback) {
    //https://mese.webuntis.com/WebUntis/api/public/timetable/weekly/pageconfig?type=1&id=123&date=2017-12-10&formatId=1
    var date = new Date();
    if (date.getDay() == 6 || date.getDay() == 0 || (date.getDay() == 5 && date.getHours() >= 14)) {
        var dateString = [date.getFullYear(), ((date.getMonth() + 1 > 9 ? '' : '0') + (date.getMonth() + 1)), ((date.getDate() > 9 ? '' : '0') + (date.getDate() + 3))].join('-');
    } else {
        var dateString = [date.getFullYear(), ((date.getMonth() + 1 > 9 ? '' : '0') + (date.getMonth() + 1)), ((date.getDate() > 9 ? '' : '0') + date.getDate())].join('-');
    }

    var options = {
        'hostname': 'mese.webuntis.com',
        'path': ('/WebUntis/api/public/timetable/weekly/pageconfig?type=1&id=123&date=' + dateString + '&formatId=1'),
        'headers': {
            'Cookie': 'schoolname="_a3NoLXN0LiBhbnNnYXI="'
        }
    }

    https.request(options, function(resp) {
        let data = '';
        resp.setEncoding('utf8');
        if (resp.statusCode != 200) {
            console.log('Received status code ' + resp.statusCode + ' (' + resp.statusMessage + ').');
            console.log('Request options: ' + JSON.stringify(options));
            console.log('Response: ' + JSON.stringify(resp.headers));
            return;
        }

        resp.on('data', d => {
            data += d;
        });

        resp.on('end', () => {
            callback(JSON.parse(data));
        });

        resp.on('error', e => {
            console.error(e);
            console.log('Status ' + resp.statusCode + ' (' + resp.statusMessage + ').');
            console.log('Request options: ' + options);
            console.log('Response: ' + resp.headers);
        });
    }).end();
}

exports.mapSubjects = function(json) {
    var e = json.data.result.data.elements;
    var map = {};
    Object.keys(e).forEach(key => {
        if (e[key].type == 3) {
            map[e[key].id] = e[key].longName;
        }
    });
    return map;
}

exports.mapClasses = function(json) {
    var e = json.data.elements;
    var map = {};
    Object.keys(e).forEach(key => {
        if (e[key].type == 1) {
            map[e[key].name] = e[key].id;
        }
    });
    return map;
}

exports.retrieveClassId = function(className, callback, callbackErr) {
    exports.loadClassesRaw(json => {
        if (!Object.keys(json.data.elements).some(key => {
                if (json.data.elements[key].type == 1 && json.data.elements[key].name == className) {
                    callback(json.data.elements[key].id);
                    return true;
                }
                return false;
            })) {
            callbackErr();
        }
    });
}

exports.filterPeriods = function(json) {
    var classID = json.data.result.data.elementIds[0];
    var periods = json.data.result.data.elementPeriods[classID];
    var filteredPeriods = [];

    Object.keys(periods).forEach(key => {
        if (periods[key].cellState != 'STANDARD') {
            filteredPeriods.push(periods[key]);
        }
    });
    filteredPeriods.sort((a, b) => {
        if (a.date == b.date) {
            if (a.startTime == b.startTime) {
                return a.endTime - b.endTime;
            } else {
                return a.startTime - b.startTime;
            }
        } else {
            return a.date - b.date;
        }
    });
    return filteredPeriods;
}

exports.findPeriodSubject = function(period) {
    if (!(period.hasOwnProperty('elements'))) {
        return false;
    }
    var id = false;
    Object.keys(period.elements).forEach(key => {
        if (period.elements[key].type == 3) {
            id = period.elements[key].id; //No need to care about several subjects
        }
    });
    return id;
}

exports.mapEmptyDays = function(json) {
    var a = new Array(true, true, true, true, true);
    var classID = json.data.result.data.elementIds[0];
    Object.keys(json.data.result.data.elementPeriods[classID]).forEach(key => {
        a[formatter.toDate(json.data.result.data.elementPeriods[classID][key].date).getDay() - 1] = false;
    });
    return a;
}
