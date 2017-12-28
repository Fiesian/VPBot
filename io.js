const fs = require('fs');
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

exports.loadJSONSync = function(name) {
    var json = '{}';
    if (fs.existsSync('./data/' + name + '.json')) {
        json = fs.readFileSync('./data/' + name + '.json');
    }
    console.log('[IO] Loaded ' + name + '.json');
    return JSON.parse(json);
}

exports.writeJSONAsync = function(name, data) {
    fs.writeFile('./data/' + name + '.json', JSON.stringify(data, null, 2), (err) => {
        if (err) throw err;
        console.log('[IO] Saved ' + name + '.json');
    });
}

exports.writeJSONSync = function(name, data) {
    fs.writeFileSync('./data/' + name + '.json', JSON.stringify(data, null, 2));
    console.log('[IO] Saved ' + name + '.json');
}

exports.loadConfig = function() {
    var json = '{}';
    if (fs.existsSync('./config.json')) {
        json = fs.readFileSync('./config.json');
        console.log('[IO] Loaded config.json');
    } else {
        json = fs.readFileSync('./default_config.json');
        console.log('[IO] Loaded default_config.json (config.json did not exist)');
    }

    return JSON.parse(json);
}

exports.saveConfig = function(data) {
    fs.writeFileSync('./config.json', JSON.stringify(data, null, 2));
    console.log('[IO] Saved config.json');
}
