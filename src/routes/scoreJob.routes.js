const express = require('express');
const router = express.Router();
const scoreJobController = require('../controllers/scoreJob.controller');

router.post('/', scoreJobController.createScoreJob.bind(scoreJobController));
router.get('/:id', scoreJobController.getScoreJob.bind(scoreJobController));
router.get('/', scoreJobController.getQueueMetrics.bind(scoreJobController));

module.exports = router;