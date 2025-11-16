# Base stage - shared dependencies
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

#  runs the Express server
FROM base AS api
COPY . .
EXPOSE 3000
CMD ["node", "src/app.js"]

# runs the scoring worker
FROM base AS worker
COPY . .
CMD ["node", "src/workers/scoring.worker.js"]