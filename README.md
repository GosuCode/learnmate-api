# LearnMate Backend

> Fastify & TypeScript backend for LearnMate - an AI-powered e-learning platform.

## Features

- **User Authentication**: JWT-based auth with Google OAuth support
- **Content Management**: Create, read, update, delete educational content
- **AI Content Generation**: Generate summaries, quizzes, and categorize content using Google Gemini AI
- **Database**: PostgreSQL with Prisma ORM
- **Security**: CORS, Helmet, input validation

## Installation

```bash
$ git clone https://github.com/GosuCode/fastify-typescript-starter.git
$ cd fastify-typescript-starter
$ npm install
```

## Usage

### Development

```bash
# Required: typescript watch compilation
$ npm run watch

# Required: development server with hot reload (nodemon)
$ npm run dev

# Format with prettier
$ npm run format
```

### Production

```bash
# build for production
$ npm run build

# start production app
$ npm run start
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/learnmate"
USE_LOCAL_DB=true

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# AI Configuration
GEMINI_API_KEY="your-gemini-api-key"

# Server
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Content Management

- `POST /api/content` - Create content manually
- `GET /api/content` - Get user's content
- `GET /api/content/:id` - Get specific content
- `PUT /api/content/:id` - Update content
- `DELETE /api/content/:id` - Delete content

### AI Content Generation

- `POST /api/content/generate` - Generate content with Gemini AI
- `POST /api/content/:id/summary` - Generate summary for content
- `POST /api/content/:id/quiz` - Generate quiz for content
- `POST /api/content/:id/categorize` - Categorize content

For detailed API documentation, see [CONTENT_GENERATION.md](./CONTENT_GENERATION.md).
