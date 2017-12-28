const fs = require('fs');
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

exports.loadJSONSync = function(name) {
    var json = '{}';
    if (fs.existsSync('./data/' + name + '.json')) {
        json = fs.readFileSync('./data/' + name + '.json', {
            'encoding': 'string'
        });
    }
    console.log('[IO] Loaded ' + name '.json');
    return JSON.parse(json);
}

exports.writeJSONAsync = function(name, data){
  fs.writeFile('./data/' + name + '.json', JSON.stringify(data, null, 2), (err) => {
      if (err) throw err;
      console.log('[IO] Saved ' + name '.json');
  });
}

exports.writeJSONSync = function(name, data){
  fs.writeFileSync('./data/' + name + '.json', JSON.stringify(data, null, 2));
  console.log('[IO] Saved ' + name '.json');
}
