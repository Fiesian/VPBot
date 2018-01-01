const io = require('../io.js');

var config = io.loadConfig();
var default_config = io.loadDefaultConfig();

exports.get = function(key) {
    if(config.hasOwnProperty(key)){
      return config[key];
    }
    else if(default_config.hasOwnProperty(key)){
      return default_config[key];
    }
    else{
      console.log('[CONFIG] Could not find config object ' + key);
      return undefined;
    }
}

exports.set = function(key, object, save = true) {
    config[key] = object;
    if (save) {
        io.saveConfig(config);
    }
}
