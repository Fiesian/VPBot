const io = require('../io.js');

var config = io.loadConfig();
var default_config = io.loadDefaultConfig();

exports.get = function(key) {
    return config.hasOwnProperty(key) ? config[key] : default_config[key];
}

exports.set = function(key, object, save = true) {
    config[key] = object;
    if (save) {
        io.saveConfig(config);
    }
}
