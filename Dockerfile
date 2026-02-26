# Build stage
FROM node:24-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Dev run stage
FROM builder AS development
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]
