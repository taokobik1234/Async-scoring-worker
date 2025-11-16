const request = require('supertest');
const app = require('../../src/app');

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Submission API', () => {
    it('POST /api/submissions should create a submission', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({
          learner_id: 'test-user-123',
          simulation_id: 'sim-456',
          data: {
            code: 'console.log("Hello");',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('submission_id');
      expect(response.body).toHaveProperty('status', 'IN_PROGRESS');
    });

    it('POST /api/submissions should require learner_id and simulation_id', async () => {
      const response = await request(app)
        .post('/api/submissions')
        .send({
          data: { code: 'test' },
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('required');
    });

    it('PATCH /api/submissions/:id should update submission', async () => {
      const createResponse = await request(app)
        .post('/api/submissions')
        .send({
          learner_id: 'user-123',
          simulation_id: 'sim-456',
          data: { code: 'initial' },
        });

      const id = createResponse.body.submission_id;

      const response = await request(app)
        .patch(`/api/submissions/${id}`)
        .send({
          data: { code: 'updated' },
        })
        .expect(200);

      expect(response.body).toHaveProperty('submission_id', id);
      expect(response.body).toHaveProperty('status', 'IN_PROGRESS');
    });

    it('POST /api/submissions/:id/submit should finalize submission', async () => {
      const createResponse = await request(app)
        .post('/api/submissions')
        .send({
          learner_id: 'user-123',
          simulation_id: 'sim-456',
          data: { code: 'final' },
        });

      const id = createResponse.body.submission_id;

      const response = await request(app)
        .post(`/api/submissions/${id}/submit`)
        .expect(200);

      expect(response.body).toHaveProperty('submission_id', id);
      expect(response.body).toHaveProperty('status', 'SUBMITTED');
      expect(response.body).toHaveProperty('score_job_id');
    });
  });

  describe('Score Job API', () => {
    it('POST /api/score-jobs should create a score job', async () => {
      const response = await request(app)
        .post('/api/score-jobs')
        .send({
          submission_id: 'sub-123',
          learner_id: 'user-456',
          simulation_id: 'sim-789',
          submission_data: {
            code: 'console.log("test");',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('job_id');
      expect(response.body).toHaveProperty('status', 'QUEUED');
    });

    it('GET /api/score-jobs should return queue metrics', async () => {
      const response = await request(app)
        .get('/api/score-jobs')
        .expect(200);

      expect(response.body).toHaveProperty('waiting');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('failed');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});