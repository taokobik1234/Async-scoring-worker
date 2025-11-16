const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

class SubmissionModel {
  constructor() {
    this.client = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });

    this.client.on('error', (err) => logger.error('Redis Client Error', err));
    this.client.connect();
  }

  async create(data) {
    const id = uuidv4();
    const submission = {
      submission_id: id,
      learner_id: data.learner_id,
      simulation_id: data.simulation_id,
      status: 'IN_PROGRESS',
      data: data.data || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.client.set(
      `submission:${id}`,
      JSON.stringify(submission),
      { EX: 86400 }
    );

    logger.info(`Submission created: ${id}`);
    return submission;
  }

  async findById(id) {
    const data = await this.client.get(`submission:${id}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  async update(id, updates) {
    const submission = await this.findById(id);
    if (!submission) return null;

    const updated = {
      ...submission,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await this.client.set(
      `submission:${id}`,
      JSON.stringify(updated),
      { EX: 86400 }
    );

    logger.info(`Submission updated: ${id}`);
    return updated;
  }

  async updateStatus(id, status) {
    return this.update(id, { status });
  }
}

module.exports = new SubmissionModel();