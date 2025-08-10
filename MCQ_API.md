# MCQ Generation API

This document describes the MCQ (Multiple Choice Question) generation API endpoints for the LearnMate backend.

## Endpoints

### Generate MCQ Questions

**POST** `/api/mcq`

Generates multiple choice questions from provided text content using AI services. This endpoint forwards requests to the FastAPI microservice running on `localhost:8000`.

#### Request Body

```json
{
  "text": "Your educational content here...",
  "num_questions": 5
}
```

#### Parameters

- `text` (required): The educational content to generate questions from
  - Minimum length: 50 characters
  - Maximum length: 10,000 characters
- `num_questions` (optional): Number of questions to generate (1-20, default: 5)

#### Response

```json
{
  "questions": [
    {
      "id": 1,
      "question": "What is the main point of the following statement: 'Machine learning is a subset of artificial intelligence...'?",
      "options": [
        "The statement provides information about the topic.",
        "The statement is irrelevant.",
        "The statement is completely false.",
        "The statement has no meaning."
      ],
      "correct_answer_index": 0,
      "correct_answer": "The statement provides information about the topic.",
      "explanation": "This question is based on the text: 'Machine learning is a subset of artificial intelligence...'"
    }
  ],
  "total_questions": 1,
  "text_length": 393,
  "model_used": "Basic"
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "error": "Text is required for MCQ generation"
}
```

**500 Internal Server Error**

```json
{
  "error": "Failed to generate MCQ"
}
```

### Health Check

**GET** `/api/mcq/health`

Checks the health status of the MCQ generation service.

#### Response

```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu"
}
```

## Usage Examples

### cURL

```bash
# Test FastAPI microservice directly
curl -X POST "http://localhost:8000/api/v1/mcq/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves.",
    "num_questions": 3,
    "use_bart": false
  }'

# Test Fastify endpoint (forwards to FastAPI)
curl -X POST "http://localhost:9000/api/mcq" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Machine learning is a subset of artificial intelligence that focuses on the development of computer programs that can access data and use it to learn for themselves.",
    "num_questions": 3
  }'

# Check FastAPI service health
curl "http://localhost:8000/api/v1/mcq/health"

# Check Fastify service health
curl "http://localhost:9000/api/mcq/health"
```

### JavaScript/Fetch

```javascript
const response = await fetch("/api/mcq", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "Your educational content here...",
    num_questions: 3,
    difficulty: "easy",
  }),
});

const result = await response.json();
console.log(result.data.questions);
```

## Architecture

The MCQ generation API follows a microservice architecture:

1. **Fastify Route Layer** (`mcqRoute.ts`): Handles HTTP requests and forwards them to the FastAPI microservice
2. **FastAPI Microservice** (`localhost:8000`): Contains the actual MCQ generation logic using AI models
3. **Type Layer** (`api.ts`): Defines TypeScript interfaces for request/response validation

The Fastify endpoint `/api/mcq` acts as a proxy, forwarding requests to the FastAPI service at `/api/v1/mcq/generate`.

## Error Handling

The API provides comprehensive error handling for:

- Invalid input validation
- External service failures
- Network connectivity issues
- Response format validation

All errors return structured JSON responses with appropriate HTTP status codes and descriptive error messages.

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use to prevent abuse.

## Security

- Input validation ensures content length and format requirements
- No authentication required (consider adding JWT auth for production)
- CORS is handled at the application level
- Input sanitization is performed to prevent injection attacks
