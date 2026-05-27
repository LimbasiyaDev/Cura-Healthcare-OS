# Use a lightweight Node.js Alpine image for minimal size and high performance
FROM node:18-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package metadata first to optimize Docker build caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Expose the default backend port (4000)
EXPOSE 4000

# Start the application
CMD [ "node", "index.js" ]
