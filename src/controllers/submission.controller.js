const submissionModel = require('../models/submission.model');
const scoreJobModel = require('../models/scoreJob.model');
const queueService = require('../services/queue.service');
const logger = require('../utils/logger');

class SubmissionController {
  /**
   * POST /api/submissions
   * Create a new submission
   */
  async createSubmission(req, res, next) {
    try {
      const { learner_id, simulation_id, data } = req.body;

      if (!learner_id || !simulation_id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'learner_id and simulation_id are required',
        });
      }

      const submission = await submissionModel.create({
        learner_id,
        simulation_id,
        data: data || {},
      });

      res.status(201).json({
        submission_id: submission.submission_id,
        status: submission.status,
      });
    } catch (error) {
      logger.error('Error creating submission', { error: error.message });
      next(error);
    }
  }

  /**
   * PATCH /api/submissions/:submission_id
   * Update submission progress (auto-save)
   */
  async updateSubmission(req, res, next) {
    try {
      const { submission_id } = req.params;
      const { data } = req.body;

      const submission = await submissionModel.findById(submission_id);
      
      if (!submission) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Submission not found',
        });
      }

      if (submission.status === 'SUBMITTED') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot update a submitted submission',
        });
      }

      const updated = await submissionModel.update(submission_id, {
        data: { ...submission.data, ...data },
      });

      res.json({
        submission_id: updated.submission_id,
        status: updated.status,
      });
    } catch (error) {
      logger.error('Error updating submission', { error: error.message });
      next(error);
    }
  }

  /**
   * POST /api/submissions/:submission_id/submit
   * Finalize submission and trigger scoring
   */
  async submitSubmission(req, res, next) {
    try {
      const { submission_id } = req.params;

      const submission = await submissionModel.findById(submission_id);
      
      if (!submission) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Submission not found',
        });
      }

      if (submission.status === 'SUBMITTED') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Submission already submitted',
        });
      }

      // Update submission status
      const updated = await submissionModel.updateStatus(
        submission_id,
        'SUBMITTED'
      );

      // Create scoring job
      const scoreJob = await scoreJobModel.create({
        submission_id,
        learner_id: submission.learner_id,
        simulation_id: submission.simulation_id,
        submission_data: submission.data,
      });

      // Enqueue scoring job
      await queueService.addScoringJob({
        job_id: scoreJob.job_id,
        submission_id,
        learner_id: submission.learner_id,
        simulation_id: submission.simulation_id,
        submission_data: submission.data,
      });

      res.json({
        submission_id: updated.submission_id,
        status: updated.status,
        score_job_id: scoreJob.job_id,
      });
    } catch (error) {
      logger.error('Error submitting submission', { error: error.message });
      next(error);
    }
  }

  /**
   * GET /api/submissions/:submission_id
   * Get submission details
   */
  async getSubmission(req, res, next) {
    try {
      const { submission_id } = req.params;

      const submission = await submissionModel.findById(submission_id);
      
      if (!submission) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Submission not found',
        });
      }

      res.json(submission);
    } catch (error) {
      logger.error('Error getting submission', { error: error.message });
      next(error);
    }
  }
}

module.exports = new SubmissionController();