const scoreJobModel = require('../models/scoreJob.model');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');

class ScoreJobController {
  async createScoreJob(req, res, next) {
    try {
      const { learner_id, simulation_id, submission_data } = req.body;

      if (!learner_id || !simulation_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'submission_id, learner_id, and simulation_id are required',
        });
      }

      const job = await scoreJobModel.create({
        learner_id,
        simulation_id,
        submission_data: submission_data || {},
      });

      await queueService.addScoringJob({
        job_id: job.job_id,
        learner_id,
        simulation_id,
        submission_data: submission_data || {},
      });

      res.status(201).json({
        job_id: job.job_id,
        status: job.status,
      });
    } catch (error) {
      logger.error('Error creating score job', { error: error.message });
      next(error);
    }
  }

  async getScoreJob(req, res, next) {
    try {
      const { id } = req.params;

      const job = await scoreJobModel.findById(id);
      
      if (!job) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Score job not found',
        });
      }

      const response = {
        job_id: job.job_id,
        status: job.status,
      };

      if (job.status === 'DONE') {
        response.score = job.score;
        response.feedback = job.feedback;
        response.breakdown = job.breakdown;
        response.completed_at = job.completed_at;
      }

      if (job.status === 'ERROR') {
        response.error = job.error;
        response.retry_count = job.retry_count;
      }

      if (job.status === 'RUNNING') {
        response.started_at = job.started_at;
      }

      res.json(response);
    } catch (error) {
      logger.error('Error getting score job', { error: error.message });
      next(error);
    }
  }

  async getQueueMetrics(req, res, next) {
    try {
      const metrics = await queueService.getQueueMetrics();
      res.json(metrics);
    } catch (error) {
      logger.error('Error getting queue metrics', { error: error.message });
      next(error);
    }
  }
}

module.exports = new ScoreJobController();