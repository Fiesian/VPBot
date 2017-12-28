const untis = require('./untis_module.js');

function TimetableWatcher(className, discordChannel, autoStart = true) {
    this._task = 0;
    this._discordChannel = discordChannel;
    untis.retrieveClassId(className, id => {
        this._classId = id;
        if (autoStart) {
            this.start();
        }
    }, () => {
        console.log('Could not retrieve class ' + className);
    })
}

TimetableWatcher.prototype.isRunning = function() {
    return this._task != 0;
};

TimetableWatcher.prototype.start = function() {
    if (isRunning()) {
        return;
    }
    this._task = setInterval(TimetableWatcher.prototype.checkTimetable, 600000);
};

TimetableWatcher.prototype.stop = function() {
    if (!isRunning()) {
        return;
    }
    clearInterval(this._task);
    this._task = 0;
};

TimetableWatcher.prototype.checkTimetable = function() {

};

module.exports = TimetableWatcher;
