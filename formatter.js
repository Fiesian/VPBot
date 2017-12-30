const dateNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const untis = require('./untis_module.js');

exports.formatTime = function(time) {
    var min = (time % 100)
    return Math.floor(time / 100) + ':' + (min < 10 ? '0' : '') + min;
}

exports.formatDate = function(date) {
    return date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
}

exports.toDate = function(date) {
    str = date.toString();
    if (!/^(\d){8}$/.test(str)) return new Date(0, 0, 1);;
    var y = str.substr(0, 4),
        m = str.substr(4, 2),
        d = str.substr(6, 2);
    return new Date(y, m - 1, d);
}

exports.getDateName = function(day) {
    return dateNames[day];
}

function loopEmptyDays(emptyDays, m) {
    for (var i = 1; i < 6; i++) {
        if (emptyDays[i - 1]) {
            m += '\n **' + exports.getDateName(i) + ': Kein Untericht**';
        }
    }
    return m;
}

exports.formatMessage = function(periods, subjectMap, emptyDays, className) {
    /* Already sorted in untis_module
    periods.sort((a, b) => {
        if (a.date == b.date) {
            if (a.startTime == b.startTime) {
                return a.endTime - b.endTime;
            } else {
                return a.startTime - b.startTime;
            }
        } else {
            return a.date - b.date;
        }
    });*/
    var m = '__**Vertretungsplan ' + className + '**__';

    if (periods.length == 0) {
        if (emptyDays.every(e => !e)) {
            return m + '\n *Der Vertretungsplan ist leer.*';
        } else if (emptyDays.every(e => e)) {
            return m + '\n *Es findet kein Unterricht statt*';
        } else {
            m = loopEmptyDays(emptyDays, m);
            return m;
        }
    }

    m = loopEmptyDays(emptyDays, m);
    var lastDay = -1;
    periods.forEach(p => {
        var date = exports.toDate(p.date);
        if (date.getTime() >= Date.now()) {
            if (lastDay != date.getDay()) {
                m += '\n **' + exports.getDateName(date.getDay()) + '**';
                lastDay = date.getDay();
            }
            var subject = untis.findPeriodSubject(p); //Subject id
            if (subject == false) { //no subject
                if (p.hasPeriodText) {
                    m += '\n  "' + p.periodText + '" ';
                } else {
                    m += '\n  *Etwas* ';
                }
            } else if (subjectMap.hasOwnProperty(subject)) {
                m += '\n  ' + subjectMap[subject] + ' ';
            } else {
                m += '\n  *Fach #' + subject + '* ';
            }
            m += 'wird von ' + exports.formatTime(p.startTime) + ' bis ' + exports.formatTime(p.endTime) + ' ';
            switch (p.cellState) {
                case 'CANCEL':
                    m += 'ausfallen.';
                    break;

                case 'FREE':
                    m += 'nicht stattfinden.';
                    break;

                case 'SUBSTITUTION':
                    m += 'vertreten.';
                    break;

                case 'ROOMSUBSTITUTION':
                    m += 'in einem anderen Raum stattfinden.';
                    break;

                case 'ADDITIONAL':
                    m += 'zusätzlich stattfinden.';
                    break;

                default:
                    m += '*<unknown state: ' + p.cellState + '>*';
            }
            if (p.hasPeriodText && subject != false) {
                m += ' (' + p.periodText + ')';
            }
        }
    });
    return m;
}
