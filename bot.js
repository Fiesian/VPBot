const version = '0.2-dev'
const formatter = require('./formatter');
const untis = require('./untis_module');
const Discord = require('discord.js');
const io = require('./io.js');

var config = io.loadConfig();

//check config for default token
if (config.token == 'YOUR-DISCORD-BOT-TOKEN') {
    console.log('Please enter your discord token in config.json');
    return;
}

// Initialize Discord Bot

var client = new Discord.Client();

client.on('ready', () => {
    console.log('Connected.');
    if (config.upload_icon) {
        client.user.setAvatar(config.icon);
        config.upload_icon = false;
        io.saveConfig(config);
    }
});

client.on('message', message => {
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'v':
            case 'version':
                message.reply('Version: ' + version);
                break;

            case 'klassen':
                if (message.channel.type == 'text') {
                    message.channel.startTyping();
                }
                untis.loadClassesRaw(json => {
                    classes = untis.mapClasses(json);
                    message.reply(Object.keys(classes).join(', '));
                });
                if (message.channel.type == 'text') {
                    message.channel.stopTyping();
                }
                break;

            case 'vp':
                if (message.channel.type == 'text') {
                    message.channel.startTyping();
                }
                untis.loadClassesRaw(json => {
                    var classMap = untis.mapClasses(json);
                    var className;
                    if (args.length == 0) {
                        className = '10c';
                    } else if (!classMap.hasOwnProperty(args[0])) {
                        message.reply('!vp <klasse>');
                        message.reply('!klassen');
                        if (message.channel.type == 'text') {
                            message.channel.stopTyping();
                        }
                        return;
                    } else {
                        className = args[0];
                    }

                    untis.loadTimetableRaw(classMap[className], json => {
                        var subjectMap = untis.mapSubjects(json);
                        var periods = untis.filterPeriods(json);
                        if (periods.length == 0) {
                            message.reply('Der Vertretungsplan ist leer.');
                            if (message.channel.type == 'text') {
                                message.channel.stopTyping();
                            }
                            return;
                        }
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
                        });
                        periods.forEach(p => {
                            var m = '';
                            var subject = untis.findPeriodSubject(p);
                            if (subject == false) {
                                if (p.hasPeriodText) {
                                    m += '"' + p.periodText + '" ';
                                } else {
                                    m += 'Etwas (Bug?) ';
                                }
                            } else if (subjectMap.hasOwnProperty(subject)) {
                                m += subjectMap[subject] + ' ';
                            } else {
                                m += 'Fach #' + subject + ' (Bug?) ';
                            }
                            m += 'wird am ' + formatter.getDateName(formatter.toDate(p.date).getDay()) + ' von ' + formatter.formatTime(p.startTime) + ' bis ' + formatter.formatTime(p.endTime) + ' ';
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
                                    m = 'Irgendetwas ist schiefgelaufen, bitte selber nachschauen. (Fehler: cellState unknown (' + p.cellState + '))';
                            }
                            if (p.hasPeriodText && subject != false) {
                                m += ' (' + p.periodText + ')';
                            }
                            message.reply(m);
                        });
                        if (message.channel.type == 'text') {
                            message.channel.stopTyping();
                        }
                    }, errId => {
                        message.reply('Fehler ' + errId);
                        if (message.channel.type == 'text') {
                            message.channel.stopTyping();
                        }
                    });
                });
                break;
        }
    }
});

client.login(config.token);
