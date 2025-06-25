FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /var/www/opentrashmail

# Copy package files
COPY package*.json ./

# Install dependencies (include devDependencies for build)
RUN npm ci

# Install tsx globally for running TypeScript files
RUN npm install -g tsx

# Copy app source
COPY . .

# Build the application
RUN npm run build

# (Optional) Remove node_modules and install only production dependencies to reduce image size
RUN rm -rf node_modules && npm ci --only=production

# Create data directory
RUN mkdir -p /var/www/opentrashmail/data

# Expose ports
EXPOSE 80 25

# Environment variables
ENV NODE_ENV=production
ENV PORT=80
ENV DOMAINS=tempmail.local
ENV DELETE_OLDER_THAN_DAYS=1
ENV DISCARD_UNKNOWN=false
ENV ADMIN_PASSWORD=admin123

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
