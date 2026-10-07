FROM node:20-alpine

WORKDIR /app

# Install deps first (layer cache)
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copy source
COPY src/ ./src/

# Run as non-root
USER node

EXPOSE 8080

CMD ["node", "src/index.js"]
