const untis = require('./untis_module.js');
const formatter = require('./formatter.js');

function TimetableWatcher(className, discordChannel, autoStart = true) {
    this._task = 0;
    this._discordChannel = discordChannel;
    this._subjectMap = {};
    this._lastCheck = {};
    this._lastMessageSnowflake = 0;
    untis.retrieveClassId(className, id => {
        this._classId = id;
        if (autoStart) {
            this.start();
        }
    }, () => {
        console.log('Could not retrieve classId for ' + className);
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
    untis.loadTimetableRaw(this._classId, json => {
        this._subjectMap = untis.mapSubjects(json);
        var filteredPeriods = untis.filterPeriods(json);

        if (this._lastCheck.length != filterPeriods.length || !(filterPeriods.every((e, index) => e == this._lastCheck[index]))) {
            if (this._lastMessageSnowflake != 0) {
                this._discordChannel.fetchMessage(this._lastMessageSnowflake).then(m => {
                    m.delete();
                }, () => {
                    console.log('Could not fetch message ' + this._lastMessageSnowflake);
                });
            }
            this._discordChannel.send(formatter.formatMessage(filterPeriods)).then(m => {
                this._lastMessageSnowflake = m.id;
            }, () => {
                this._lastMessageSnowflake = 0;
            });
            //
        }
        this._lastCheck = filterPeriods;
    }, () => {
        console.log('Could not load timetable. Skipping check.');
    })
};

module.exports = TimetableWatcher;
