const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.scoringQueue = new Queue('scoring-jobs', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
      },
      defaultJobOptions: {
        attempts: config.worker.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.worker.retryDelay,
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    });

    // Queue event listeners for observability
    this.scoringQueue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed`, {
        jobId: job.id,
        processingTime: Date.now() - job.processedOn,
        result,
      });
    });

    this.scoringQueue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed`, {
        jobId: job.id,
        attempt: job.attemptsMade,
        error: err.message,
      });
    });

    this.scoringQueue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`, { jobId: job.id });
    });
  }

  async addScoringJob(jobData) {
    const job = await this.scoringQueue.add(jobData, {
      jobId: jobData.job_id,
    });

    logger.info(`Scoring job enqueued: ${job.id}`);
    return job;
  }

  async getJob(jobId) {
    return await this.scoringQueue.getJob(jobId);
  }

  async getJobState(jobId) {
    const job = await this.getJob(jobId);
    if (!job) return null;
    return await job.getState();
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scoringQueue.getWaitingCount(),
      this.scoringQueue.getActiveCount(),
      this.scoringQueue.getCompletedCount(),
      this.scoringQueue.getFailedCount(),
      this.scoringQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async closeQueue() {
    await this.scoringQueue.close();
    logger.info('Queue closed');
  }
}

module.exports = new QueueService();