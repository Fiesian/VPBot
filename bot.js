const version = '1.0.0'
const formatter = require('./formatter');
const untis = require('./untis_module');
const Discord = require('discord.js');
const io = require('./io.js');
const TimetableWatcher = require('./timetablewatcher.js');
const config = require('./config/config.js');

var channelData = io.loadJSONSync('channels');

var runningTTWs = new Map();

//check config for default token
if (config.get('token') == 'YOUR-DISCORD-BOT-TOKEN') {
    console.log('Please enter your discord token in /config/config.json');
    return;
}

// Initialize Discord Bot

var client = new Discord.Client();

client.on('ready', () => {
    console.log('Connected.');
    if (config.get('upload_icon')) {
        client.user.setAvatar(config.get('icon'));
        config.set('upload_icon', false);
    }
    client.user.setGame('VPBot v' + version);
    client.channels.forEach(c => {
        if (channelData.hasOwnProperty(c.id)) {
            runningTTWs.set(c.id, new TimetableWatcher(channelData[c.id].className, client.channels.get(c.id), config.get('check_rate')));
        }
    });
});

client.on('message', message => {
    if (message.channel.type == 'dm' && config.get('trusted_users').includes(message.author.id)) {
        var args = message.content.split(' ');
        var cmd = args[0];

        args = args.splice(1);
        switch (cmd) {
            case 'v':
            case 'version':
                message.reply('Version: ' + version);
                break;

            case 'klassen':
                untis.loadClassesRaw(json => {
                    classes = untis.mapClasses(json);
                    message.reply(Object.keys(classes).join(', '));
                });
                break;

            case 'register':
                if (args.length == 2) {
                    if (!client.channels.has(args[0])) {
                        message.reply('Could not find channel ' + args[0]);
                        return;
                    }
                    if (channelData.hasOwnProperty(args[0])) {
                        message.reply(args[0] + ' is already registered for class ' + channelData[args[0]].className + '.');
                        return;
                    }

                    channelData[args[0]] = {
                        'className': args[1]
                    };
                    io.saveJSONAsync('channels', channelData);
                    runningTTWs.set(args[0], new TimetableWatcher(channelData[c.id].className, client.channels.get(c.id), config.get('check_rate)')));
                    console.log('Registered channel ' + args[0] + ' for ' + args[1])
                    message.reply('Done.');
                } else {
                    message.reply('*register <id> <className>*');
                }

                break;

            case 'unregister':
                if (args.length == 1) {
                    if (!channelData.hasOwnProperty(args[0])) {
                        message.reply(args[0] + ' is not registered.')
                        return;
                    }
                    delete channelData[args[0]];
                    io.saveJSONAsync('channels', channelData);
                    if (runningTTWs.has(args[0])) {
                        runningTTWs.get(args[0]).stop();
                        runningTTWs.delete(args[0]);
                    }
                    console.log('Unregistered channel ' + args[0]);
                    message.reply('Done.');
                } else {
                    message.reply('*unregister <id>*');
                }
                break;

            case 'stop':
                if (args.length == 1) {
                    if (runningTTWs.has(args[0])) {
                        runningTTWs.get(args[0]).stop();
                        runningTTWs.delete(args[0]);
                        console.log('Stopped channel ' + args[0]);
                        message.reply('Done.');
                    } else {
                        message.reply(args[0] + ' is not running');
                    }
                } else {
                    message.reply('*stop <id>*');
                }
                break;

            case 'stopAll':
                runningTTWs.forEach(ttw => ttw.stop());
                runningTTWs.clear();
                console.log('Stopped all channels');
                message.reply('Done.');
                break;

            case 'restart':
                client.user.setGame('Restarting ...');
                console.log('Restarting ...');
                runningTTWs.forEach(ttw => ttw.stop());
                runningTTWs.clear();

                client.channels.forEach(c => {
                    if (channelData.hasOwnProperty(c.id)) {
                        runningTTWs.set(c.id, new TimetableWatcher(channelData[c.id].className, client.channels.get(c.id), config.get('check_rate')));
                    }
                });
                console.log('Restarted.');
                client.user.setGame('VPBot v' + version);
                break;
        }
    }
});


client.login(config.get('token'));
