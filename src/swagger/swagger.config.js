const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Async Scoring Worker API',
      version: '1.0.0',
      description: 'Assessment Engine for AI-enabled Job Simulation Platform',
      contact: {
        name: 'Edtronaut',
        email: 'hr@edtronaut.ai',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Submission: {
          type: 'object',
          properties: {
            submission_id: {
              type: 'string',
              format: 'uuid',
            },
            learner_id: {
              type: 'string',
            },
            simulation_id: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['IN_PROGRESS', 'SUBMITTED'],
            },
            data: {
              type: 'object',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ScoreJob: {
          type: 'object',
          properties: {
            job_id: {
              type: 'string',
              format: 'uuid',
            },
            submission_id: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['QUEUED', 'RUNNING', 'DONE', 'ERROR'],
            },
            score: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              nullable: true,
            },
            feedback: {
              type: 'string',
              nullable: true,
            },
            breakdown: {
              type: 'object',
              nullable: true,
            },
            error: {
              type: 'string',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            completed_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Submissions',
        description: 'Submission management endpoints',
      },
      {
        name: 'Score Jobs',
        description: 'Scoring job endpoints',
      },
    ],
    paths: {
      '/api/submissions': {
        post: {
          tags: ['Submissions'],
          summary: 'Create a new submission',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['learner_id', 'simulation_id'],
                  properties: {
                    learner_id: { type: 'string' },
                    simulation_id: { type: 'string' },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Submission created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      submission_id: { type: 'string' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
            400: { $ref: '#/components/responses/BadRequest' },
          },
        },
      },
      '/api/submissions/{submission_id}': {
        get: {
          tags: ['Submissions'],
          summary: 'Get submission details',
          parameters: [
            {
              in: 'path',
              name: 'submission_id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Submission details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Submission' },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        patch: {
          tags: ['Submissions'],
          summary: 'Update submission progress',
          parameters: [
            {
              in: 'path',
              name: 'submission_id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Submission updated' },
            400: { $ref: '#/components/responses/BadRequest' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/submissions/{submission_id}/submit': {
        post: {
          tags: ['Submissions'],
          summary: 'Finalize submission and trigger scoring',
          parameters: [
            {
              in: 'path',
              name: 'submission_id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Submission finalized',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      submission_id: { type: 'string' },
                      status: { type: 'string' },
                      score_job_id: { type: 'string' },
                    },
                  },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/score-jobs': {
        post: {
          tags: ['Score Jobs'],
          summary: 'Create and enqueue a scoring job',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: [ 'learner_id', 'simulation_id'],
                  properties: {
                    learner_id: { type: 'string' },
                    simulation_id: { type: 'string' },
                    submission_data: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Score job created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      job_id: { type: 'string' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          tags: ['Score Jobs'],
          summary: 'Get queue metrics',
          responses: {
            200: {
              description: 'Queue metrics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      waiting: { type: 'integer' },
                      active: { type: 'integer' },
                      completed: { type: 'integer' },
                      failed: { type: 'integer' },
                      delayed: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/score-jobs/{id}': {
        get: {
          tags: ['Score Jobs'],
          summary: 'Get scoring job status and results',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: {
              description: 'Score job details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ScoreJob' },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;