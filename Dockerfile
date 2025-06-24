FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache sqlite

# Create app directory
WORKDIR /var/www/opentrashmail

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Enable corepack, prepare pnpm và cài dependencies production
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod

# Copy app source
COPY . .

# Build the application
RUN pnpm build

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
