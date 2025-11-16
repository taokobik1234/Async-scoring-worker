const { v4: uuidv4 } = require('uuid');
const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

class ScoreJobModel {
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
    const job = {
      job_id: id,
      submission_id: data.submission_id,
      learner_id: data.learner_id,
      simulation_id: data.simulation_id,
      submission_data: data.submission_data,
      status: 'QUEUED',
      created_at: new Date().toISOString(),
      queued_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      score: null,
      feedback: null,
      error: null,
      retry_count: 0,
    };

    await this.client.set(
      `scorejob:${id}`,
      JSON.stringify(job),
      { EX: 604800 }
    );

    logger.info(`Score job created: ${id}`);
    return job;
  }

  async findById(id) {
    const data = await this.client.get(`scorejob:${id}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  async update(id, updates) {
    const job = await this.findById(id);
    if (!job) return null;

    const updated = {
      ...job,
      ...updates,
    };

    await this.client.set(
      `scorejob:${id}`,
      JSON.stringify(updated),
      { EX: 604800 }
    );

    logger.info(`Score job updated: ${id}, status: ${updated.status}`);
    return updated;
  }

  async updateStatus(id, status, additionalData = {}) {
    const updates = { status, ...additionalData };
    
    if (status === 'RUNNING' && !additionalData.started_at) {
      updates.started_at = new Date().toISOString();
    }
    
    if ((status === 'DONE' || status === 'ERROR') && !additionalData.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    return this.update(id, updates);
  }

  async incrementRetry(id) {
    const job = await this.findById(id);
    if (!job) return null;
    
    return this.update(id, { retry_count: job.retry_count + 1 });
  }
}

module.exports = new ScoreJobModel();