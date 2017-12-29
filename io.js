const fs = require('fs');
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

exports.loadJSONSync = function(name) {
    var json = '{}';
    if (fs.existsSync('./data/' + name + '.json')) {
        json = fs.readFileSync('./data/' + name + '.json');
        if (json == '') {
            json = '{}';
        }
    }
    console.log('[IO] Loaded ' + name + '.json');
    return JSON.parse(json);
}

exports.saveJSONAsync = function(name, data) {
    fs.writeFile('./data/' + name + '.json', JSON.stringify(data, null, 2), (err) => {
        if (err) throw err;
        console.log('[IO] Saved ' + name + '.json');
    });
}

exports.saveJSONSync = function(name, data) {
    fs.writeFileSync('./data/' + name + '.json', JSON.stringify(data, null, 2));
    console.log('[IO] Saved ' + name + '.json');
}

exports.saveConfig = function(data) {
    fs.writeFileSync('./config.json', JSON.stringify(data, null, 2));
    console.log('[IO] Saved config.json');
}

exports.loadConfig = function() {
    var json = '{}';
    if (fs.existsSync('./config.json')) {
        json = fs.readFileSync('./config.json');
        console.log('[IO] Loaded config.json');
    } else {
        json = fs.readFileSync('./default_config.json');
        console.log('[IO] Loaded default_config.json (config.json did not exist)');
        exports.saveConfig(JSON.parse(json));
    }

    return JSON.parse(json);
}
