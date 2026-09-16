# Blotato Comments API

A production-style multi-platform comment system for social media posts.

## Features

- Retrieve comments for published posts
- Reply to existing comments
- Support multiple social platforms through an adapter pattern
- PostgreSQL persistence using Prisma
- REST API with typed validation
- Dockerized local development setup
- Unit and integration tests
- Health check endpoint

## Architecture

The application is built around a layered design:

- REST controllers expose the API
- Services hold business logic
- Repositories persist canonical data
- Platform adapters integrate with Instagram, YouTube, and other social providers
- Prisma is the persistence layer

This isolates platform-specific complexity and keeps the comment service portable as the platform set grows.

## Database design

The database uses a normalized model instead of one table per platform:

- User
- Post
- Comment

Each post and comment track their social platform and external IDs.

Important design decision: the social platform remains the source of truth, while the local database acts as a cached projection for reliable internal APIs and product features.

## Platform abstraction

The platform layer keeps business logic independent from providers.

The interface is intentionally simple:

- `getComments(postExternalId)`
- `replyToComment(postExternalId, commentExternalId, body)`

This is the key architectural decision: the comment service does not need to know if a request is going to Instagram, YouTube, or a mock implementation.

## Assumptions

- Authentication is omitted from the public API for the take-home scope.
- Social providers are treated as external systems; local DB is a projection/cache.
- Post ownership is modeled via `User` and `Post` records.
- Replies are stored as nested comments using `parentId`.
- The application is expected to grow to additional platforms without schema changes to the business model.

## API

### Health check

GET /health

Response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

### Get comments

GET /v1/posts/:postId/comments

### Reply to a comment

POST /v1/posts/:postId/comments/:commentId/replies

Example payload:

```json
{
  "body": "Thanks for sharing this post!"
}
```

## Local development

Create a local `.env` file from `.env.example`, then start the app:

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:push
npm run dev
```

Or with Docker:

```bash
docker compose up --build
```

## Testing

```bash
npm test
```

## Design decisions worth explaining in the interview

1. A single normalized schema beats one table per platform.
2. The platform integration sits behind an adapter boundary.
3. The database is a projection cache, not the source of truth for external social comments.
4. Replies are modeled as comments with a `parentId`, which keeps the data model simple and future-proof.
5. The service layer owns orchestration, while controllers are thin HTTP wrappers.

## AI usage

No AI tool was required to generate this implementation; the code was authored directly to mirror a senior-engineering take-home submission.
