import { CronJob } from 'cron';

export default class Scheduler {
  cronExpression: string;
  job: CronJob;

  constructor(cronExpression: string, callback: () => void) {
    this.cronExpression = cronExpression;
    this.job = new CronJob(cronExpression, callback, null, false, 'Asia/Singapore');
  }
  start() {
    this.job.start();
  }
  stop() {
    this.job.stop();
  }
}
