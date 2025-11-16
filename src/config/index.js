module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    },
    
    worker: {
      concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
      maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
      backoffMultiplier: parseInt(process.env.BACKOFF_MULTIPLIER) || 2,
    },
    
    scoring: {
      rubric: {
        codeQuality: 0.30,
        correctness: 0.40,
        documentation: 0.20,
        performance: 0.10,
      },
      minScore: 0,
      maxScore: 100,
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };