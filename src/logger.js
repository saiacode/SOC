const { Socket } = require('./socket')

class Logger {
  static activityLogs = [];

  addLog(message) {
    const log = { time: new Date().toLocaleTimeString(), message }
    const socket = new Socket()
    const socketIO = socket.getSocketIO()
    socketIO.emit('newLog', log)
    Logger.activityLogs.unshift(log);
    if (Logger.activityLogs.length > 10) Logger.activityLogs.pop();
  }
  
  getLogs() {
    return Logger.activityLogs;
  }
}

module.exports = { Logger };
