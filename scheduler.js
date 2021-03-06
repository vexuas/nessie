const CronJob = require('cron').CronJob;

module.exports = class Scheduler {
  constructor(cronExpression, callback) {
    this.cronExpression = cronExpression;
    this.job = new CronJob(cronExpression, callback, null, false, 'Asia/Singapore');
  }
  start() {
    this.job.start();
  }
  stop() {
    this.job.stop();
  }
};
