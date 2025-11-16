const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');

router.post('/', submissionController.createSubmission.bind(submissionController));
router.get('/:submission_id', submissionController.getSubmission.bind(submissionController));
router.patch('/:submission_id', submissionController.updateSubmission.bind(submissionController));
router.post('/:submission_id/submit', submissionController.submitSubmission.bind(submissionController));

module.exports = router;