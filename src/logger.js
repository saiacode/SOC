let activityLogs = [];

function addLog(message) {
    activityLogs.unshift({ time: new Date().toLocaleTimeString(), message });
    if (activityLogs.length > 10) activityLogs.pop();
}

function getLogs() {
    return activityLogs;
}

module.exports = { addLog, getLogs };
