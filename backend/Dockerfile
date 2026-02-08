# Use Node 20 Alpine as base
FROM node:20-alpine3.17

WORKDIR /app


# Copy package files and install dependencies first (cache-friendly)
COPY package*.json ./
RUN npm install --production=false

# Copy only source files required to build the backend (avoid large data)
COPY tsconfig.json ./
COPY server.ts ./
COPY server ./server
COPY controllers ./controllers
COPY models ./models
COPY routes ./routes
COPY config ./config
COPY db ./db
COPY middleware ./middleware
COPY utils ./utils

# Build TypeScript to JavaScript
RUN npm run build

# Copy non-TypeScript JS files to dist (mixed .js/.ts files in controllers, models, etc.)
RUN cp -r ./db ./dist/ && \
    cp -r ./config ./dist/ && \
    cp -r ./utils ./dist/ && \
    cp -r ./routes ./dist/ && \
    cp -r ./middleware ./dist/ && \
    cp ./controllers/*.js ./dist/controllers/ 2>/dev/null || true && \
    cp ./models/*.js ./dist/models/ 2>/dev/null || true

# Expose the server port
EXPOSE 5000

# Run the compiled JS
CMD ["node", "dist/server.js"]
