# ==========================
# Stage 1: Build Dependencies
# ==========================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# ==========================
# Stage 2: Runtime
# ==========================
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies & code from builder
COPY --from=builder /app /app

# Expose app port
EXPOSE 8000

# Set NODE_ENV to production
ENV NODE_ENV=production

# Start server
CMD ["node", "src/server.js"]
