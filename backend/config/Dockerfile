# Use official Redis image
FROM redis:7-alpine

# Expose default Redis port
EXPOSE 6379

# Start Redis server
CMD ["redis-server", "--bind", "127.0.0.1", "--requirepass", "yourStrongPassword"]
