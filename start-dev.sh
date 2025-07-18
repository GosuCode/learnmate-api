#!/bin/bash

echo "🚀 Starting LearnMate Backend with Local Database"

# Set environment variables for local development
export USE_LOCAL_DB=true
export LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/learnmate"
export NODE_ENV=development

echo "🔧 Using LOCAL PostgreSQL database"
echo "📡 Database URL: $LOCAL_DATABASE_URL"

# Start the development server
npm run dev 