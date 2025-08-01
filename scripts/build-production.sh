#!/bin/bash

# Production build script
echo "Building for production..."

# Set production environment variables
export NODE_ENV=production
export NEXT_PUBLIC_ENABLE_LOGS=false

# Build the application
npm run build

echo "Production build complete!"
echo "Logs are disabled for production." 