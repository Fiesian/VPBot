const untis = require('./untis_module.js');
const formatter = require('./formatter.js');

function TimetableWatcher(className, discordChannel, checkRate, autoStart = true) {
    this._task = 0;
    this._discordChannel = discordChannel;
    this._subjectMap = {};
    this._lastCheck = [];
    this._lastEmptyDays = [];
    this._lastMessageSnowflake = 0;
    this._checkRate = checkRate;
    this._className = className;
    untis.retrieveClassId(className, id => {
        this._classId = id;
        if (autoStart) {
            this.start();
        }
    }, () => {
        console.log('Could not retrieve classId for ' + className);
    });
}

TimetableWatcher.prototype.isRunning = function() {
    return this._task != 0;
};

TimetableWatcher.prototype.start = function() {
    if (this.isRunning()) {
        return;
    }
    this.checkTimetable(true);
    console.log('[TTW] Starting TTW task for channel ' + this._discordChannel.id + ' (will be executed every ' + this._checkRate + 's).')
    this._task = setInterval(this.checkTimetable.bind(this), this._checkRate * 1000);
};

TimetableWatcher.prototype.stop = function() {
    if (!this.isRunning()) {
        return;
    }
    clearInterval(this._task);
    this._task = 0;
};

TimetableWatcher.prototype.isDifferent = function(filteredPeriods, emptyDays){
  //This is dirty but also easier to debug
  if(filteredPeriods.length != this._lastCheck.length){
    return true;
  }
  else if(!(filteredPeriods.some((e, i) => e != this._lastCheck[i]))){
    return false;
  }
  else if(!(emptyDays.some((e, i) => e != this._lastEmptyDays[i]))){
    return false;
  }
  else{
    return true;
  }
}

TimetableWatcher.prototype.checkTimetable = function(firstRun = false) {
    untis.loadTimetableRaw(this._classId, json => {
        this._subjectMap = untis.mapSubjects(json);
        var filteredPeriods = untis.filterPeriods(json);
        var emptyDays = untis.mapEmptyDays(json);

        if (firstRun || this.isDifferent(filteredPeriods, emptyDays)) {
            if (this._lastMessageSnowflake != 0) {
                this._discordChannel.fetchMessage(this._lastMessageSnowflake).then(m => {
                    m.delete();
                }, () => {
                    console.log('Could not fetch message ' + this._lastMessageSnowflake);
                });
            }
            this._discordChannel.send(formatter.formatMessage(filteredPeriods, this._subjectMap, emptyDays, this._className)).then(m => {
                this._lastMessageSnowflake = m.id;
            }, () => {
                this._lastMessageSnowflake = 0;
            });
        }
        this._lastCheck = filteredPeriods;
        this._lastEmptyDays = emptyDays;
    }, () => {
        console.log('Could not load timetable. Skipping check.');
    })
};

module.exports = TimetableWatcher;
