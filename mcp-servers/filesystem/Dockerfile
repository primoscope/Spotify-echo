FROM node:18-alpine

WORKDIR /app

# Install MCP filesystem server
RUN npm install -g @modelcontextprotocol/server-filesystem

# Create startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3001

CMD ["/app/start.sh"]