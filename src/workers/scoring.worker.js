require('dotenv').config();
const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');
const scoreJobModel = require('../models/scoreJob.model');
const scoringService = require('../services/scoring.service');

const scoringQueue = new Queue('scoring-jobs', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

logger.info('Scoring worker starting...', {
  concurrency: config.worker.concurrency,
  maxRetries: config.worker.maxRetries,
});

scoringQueue.process(config.worker.concurrency, async (job) => {
  const { job_id, submission_id, learner_id, simulation_id, submission_data } = job.data;
  
  logger.info(`Processing job ${job_id}`, {
    attempt: job.attemptsMade + 1,
    maxAttempts: job.opts.attempts,
  });

  try {
    await scoreJobModel.updateStatus(job_id, 'RUNNING');
    logger.info(`Job ${job_id} status updated to RUNNING`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await scoringService.computeScore({
      submission_id,
      learner_id,
      simulation_id,
      data: submission_data,
    });

    await scoreJobModel.updateStatus(job_id, 'DONE', {
      score: result.score,
      feedback: result.feedback,
      breakdown: result.breakdown,
    });

    logger.info(`Job ${job_id} status updated to DONE`, {
      score: result.score,
    });

    return { success: true, score: result.score };

  } catch (error) {
    logger.error(`Job ${job_id} failed`, {
      error: error.message,
      stack: error.stack,
    });

    await scoreJobModel.incrementRetry(job_id);

    if (job.attemptsMade + 1 >= job.opts.attempts) {
      await scoreJobModel.updateStatus(job_id, 'ERROR', {
        error: error.message,
      });
    }

    throw error;
  }
});

scoringQueue.on('completed', (job, result) => {
  logger.info(`Worker completed job ${job.id}`, {
    processingTime: Date.now() - job.processedOn,
  });
});

scoringQueue.on('failed', (job, err) => {
  logger.error(`Worker failed job ${job.id}`, {
    attempt: job.attemptsMade,
    maxAttempts: job.opts.attempts,
    error: err.message,
  });
});

scoringQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

scoringQueue.on('error', (error) => {
  logger.error('Queue error', { error: error.message });
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker...');
  await scoringQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker...');
  await scoringQueue.close();
  process.exit(0);
});

logger.info('Scoring worker ready and waiting for jobs');