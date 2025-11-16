const scoringService = require('../../src/services/scoring.service');

describe('ScoringService', () => {
  describe('computeScore', () => {
    it('should return a score between 0 and 100', async () => {
      const submissionData = {
        submission_id: 'test-123',
        learner_id: 'user-456',
        simulation_id: 'sim-789',
        data: {
          code: 'function hello() { return "world"; }',
          description: 'A simple hello function',
        },
      };

      const result = await scoringService.computeScore(submissionData);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.feedback).toBeDefined();
      expect(result.breakdown).toBeDefined();
    });

    it('should include all rubric criteria in breakdown', async () => {
      const submissionData = {
        submission_id: 'test-123',
        learner_id: 'user-456',
        simulation_id: 'sim-789',
        data: {
          code: 'const x = 10; // This is a comment',
        },
      };

      const result = await scoringService.computeScore(submissionData);

      expect(result.breakdown).toHaveProperty('codeQuality');
      expect(result.breakdown).toHaveProperty('correctness');
      expect(result.breakdown).toHaveProperty('documentation');
      expect(result.breakdown).toHaveProperty('performance');
    });

    it('should give higher scores for well-structured code', async () => {
      const goodSubmission = {
        data: {
          code: `
            // Well documented function
            function calculateSum(a, b) {
              return a + b;
            }
            const result = calculateSum(5, 10);
          `,
          description: 'Comprehensive documentation here',
          readme: 'Detailed explanation of the solution',
        },
      };

      const poorSubmission = {
        data: {
          code: 'x=5',
        },
      };

      const goodResult = await scoringService.computeScore(goodSubmission);
      const poorResult = await scoringService.computeScore(poorSubmission);

      expect(goodResult.score).toBeGreaterThan(poorResult.score);
    });

    it('should handle empty submission data', async () => {
      const emptySubmission = {
        data: {},
      };

      const result = await scoringService.computeScore(emptySubmission);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.feedback).toBeDefined();
    });
  });

  describe('evaluateCodeQuality', () => {
    it('should detect good coding practices', () => {
      const goodCode = {
        data: {
          code: 'function test() { const x = 10; return x; }',
        },
      };

      const score = scoringService.evaluateCodeQuality(goodCode);

      expect(score).toBeGreaterThan(0.5);
    });

    it('should reward code comments', () => {
      const commentedCode = {
        data: {
          code: '// This is a comment\nfunction test() { return true; }',
        },
      };

      const uncommentedCode = {
        data: {
          code: 'function test() { return true; }',
        },
      };

      const commentedScore = scoringService.evaluateCodeQuality(commentedCode);
      const uncommentedScore = scoringService.evaluateCodeQuality(uncommentedCode);

      expect(commentedScore).toBeGreaterThan(uncommentedScore);
    });
  });

  describe('generateFeedback', () => {
    it('should provide constructive feedback', () => {
      const scores = {
        codeQuality: 0.8,
        correctness: 0.9,
        documentation: 0.6,
        performance: 0.7,
      };

      const feedback = scoringService.generateFeedback(scores, 75);

      expect(feedback).toContain('Overall Score: 75/100');
      expect(feedback).toContain('Code Quality');
      expect(feedback).toContain('Correctness');
      expect(feedback).toContain('Documentation');
      expect(feedback).toContain('Performance');
    });

    it('should suggest improvements for low scores', () => {
      const scores = {
        codeQuality: 0.5,
        correctness: 0.5,
        documentation: 0.4,
        performance: 0.5,
      };

      const feedback = scoringService.generateFeedback(scores, 48);

      expect(feedback).toContain('Suggestions:');
      expect(feedback).toContain('documentation');
    });

    it('should congratulate high scores', () => {
      const scores = {
        codeQuality: 0.95,
        correctness: 0.95,
        documentation: 0.90,
        performance: 0.90,
      };

      const feedback = scoringService.generateFeedback(scores, 93);

      expect(feedback).toContain('Excellent');
    });
  });
});