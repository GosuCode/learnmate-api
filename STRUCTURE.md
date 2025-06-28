# LearnMate Backend - Folder Structure

This document outlines the organized folder structure for the LearnMate backend project.

## 📁 Root Structure

```
fastify-typescript-starter/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Data models (future)
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── plugins/         # Fastify plugins
│   ├── ai/              # AI-specific logic (future)
│   ├── validation/      # Validation schemas (future)
│   ├── errors/          # Error handling (future)
│   ├── app.ts           # Main application setup
│   └── index.ts         # Application entry point
├── static/              # Static files
├── package.json
├── tsconfig.json
└── README.md
```

## 📁 Detailed Structure

### `/src/config/`

Configuration files for different parts of the application:

- `app.ts` - Main application configuration
- `database.ts` - Database connection settings
- `ai.ts` - AI service configuration
- `index.ts` - Exports all configurations

### `/src/controllers/`

Request handlers that process HTTP requests:

- `userController.ts` - User authentication and management
- `contentController.ts` - Content management
- `aiController.ts` - AI service endpoints

### `/src/middleware/`

Custom middleware functions:

- `auth.ts` - JWT authentication middleware

### `/src/routes/`

Route definitions organized by feature:

- `index.ts` - Main route registration
- `user.ts` - User-related routes
- `content.ts` - Content management routes
- `ai.ts` - AI service routes

### `/src/services/`

Business logic and external service integrations:

- `aiService.ts` - AI API integrations

### `/src/types/`

TypeScript type definitions:

- `user.ts` - User-related types
- `content.ts` - Content-related types
- `ai.ts` - AI service types
- `api.ts` - API response types
- `index.ts` - Type exports

### `/src/utils/`

Utility functions and helpers:

- `validation.ts` - Validation helper functions

### `/src/plugins/`

Fastify plugins:

- `auth.ts` - Authentication plugin

## 🚀 API Endpoints

### User Management

- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Content Management

- `POST /api/content` - Create content
- `GET /api/content` - Get user's content
- `GET /api/content/:id` - Get specific content
- `DELETE /api/content/:id` - Delete content

### AI Services

- `POST /api/ai/summarize` - Generate content summary
- `POST /api/ai/quiz` - Generate quiz from content
- `POST /api/ai/categorize` - Categorize content

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Application Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
DB_NAME=learnmate

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

## 📝 Development Guidelines

1. **Controllers**: Handle HTTP requests and responses
2. **Services**: Contain business logic and external API calls
3. **Routes**: Define API endpoints and validation schemas
4. **Types**: Define TypeScript interfaces and types
5. **Middleware**: Handle cross-cutting concerns like authentication
6. **Utils**: Provide reusable utility functions

## 🔄 Next Steps

1. Install required dependencies (`@fastify/cors`, `@fastify/helmet`)
2. Set up database connection and models
3. Implement JWT authentication
4. Integrate with AI services (OpenAI/Gemini)
5. Add comprehensive error handling
6. Set up testing framework
