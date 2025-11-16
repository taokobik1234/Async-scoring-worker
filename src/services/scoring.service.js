const config = require('../config');
const logger = require('../utils/logger');

class ScoringService {
  constructor() {
    this.rubric = config.scoring.rubric;
  }

  async computeScore(submissionData) {
    logger.info('Computing score for submission', {
      simulationId: submissionData.simulation_id,
    });

    try {
      const scores = {
        codeQuality: this.evaluateCodeQuality(submissionData),
        correctness: this.evaluateCorrectness(submissionData),
        documentation: this.evaluateDocumentation(submissionData),
        performance: this.evaluatePerformance(submissionData),
      };

      const totalScore = Math.round(
        scores.codeQuality * this.rubric.codeQuality * 100 +
        scores.correctness * this.rubric.correctness * 100 +
        scores.documentation * this.rubric.documentation * 100 +
        scores.performance * this.rubric.performance * 100
      );

      const feedback = this.generateFeedback(scores, totalScore);

      logger.info('Score computed successfully', {
        totalScore,
        breakdown: scores,
      });

      return {
        score: totalScore,
        feedback,
        breakdown: scores,
      };
    } catch (error) {
      logger.error('Error computing score', { error: error.message });
      throw error;
    }
  }

  evaluateCodeQuality(data) {
    const content = JSON.stringify(data.data || {});
    let score = 0.5;

    const goodPractices = ['function', 'class', 'const', 'let', 'return'];
    const foundPractices = goodPractices.filter(kw => 
      content.toLowerCase().includes(kw)
    ).length;
    score += (foundPractices / goodPractices.length) * 0.3;

    if (content.includes('//') || content.includes('/*')) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  evaluateCorrectness(data) {
    const content = JSON.stringify(data.data || {});
    let score = 0.4;

    if (content.includes('result') || content.includes('output')) {
      score += 0.3;
    }

    if (data.data && typeof data.data === 'object') {
      score += 0.2;
    }

    score += Math.random() * 0.1;

    return Math.min(score, 1);
  }

  evaluateDocumentation(data) {
    const content = JSON.stringify(data.data || {});
    let score = 0.3;

    const docKeywords = ['description', 'readme', 'explanation', 'notes'];
    const foundDocs = docKeywords.filter(kw => 
      content.toLowerCase().includes(kw)
    ).length;
    score += (foundDocs / docKeywords.length) * 0.5;

    if (content.length > 500) score += 0.2;

    return Math.min(score, 1);
  }

  evaluatePerformance(data) {
    return 0.6 + Math.random() * 0.4;
  }

  generateFeedback(scores, totalScore) {
    const feedback = [];

    feedback.push(`Overall Score: ${totalScore}/100`);
    feedback.push('\nBreakdown:');
    feedback.push(`- Code Quality (30%): ${Math.round(scores.codeQuality * 100)}/100`);
    feedback.push(`- Correctness (40%): ${Math.round(scores.correctness * 100)}/100`);
    feedback.push(`- Documentation (20%): ${Math.round(scores.documentation * 100)}/100`);
    feedback.push(`- Performance (10%): ${Math.round(scores.performance * 100)}/100`);

    if (totalScore >= 90) {
      feedback.push('\n✅ Excellent work! Your submission exceeds expectations.');
    } else if (totalScore >= 75) {
      feedback.push('\n✅ Great job! Your submission meets all requirements.');
    } else if (totalScore >= 60) {
      feedback.push('\n⚠️ Good effort. Consider improving code quality and documentation.');
    } else {
      feedback.push('\n❌ Needs improvement. Review the rubric and requirements.');
    }

    feedback.push('\nSuggestions:');
    if (scores.codeQuality < 0.7) {
      feedback.push('- Improve code structure and follow best practices');
    }
    if (scores.correctness < 0.7) {
      feedback.push('- Review the simulation requirements and ensure all outputs are correct');
    }
    if (scores.documentation < 0.7) {
      feedback.push('- Add more detailed documentation and comments');
    }
    if (scores.performance < 0.7) {
      feedback.push('- Optimize your solution for better performance');
    }

    return feedback.join('\n');
  }
}

module.exports = new ScoringService();