FROM node:18-alpine

# Install Chrome dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Install MCP puppeteer server
RUN npm install -g @modelcontextprotocol/server-puppeteer

# Set Chrome path
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3002

CMD ["/app/start.sh"]