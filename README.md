# EasiiDesk Transportation Backend

A server-based backend for the EasiiDesk transportation management system. This application provides APIs for managing transportation requests, schedules, drivers, and vehicles.

## Architecture

The application follows a modular architecture with clear separation of concerns:

```
route → validator → middleware → controller → service → repository → model
```

- **Routes**: Define API endpoints and connect them to controllers
- **Validators**: Validate request data using Yup schemas
- **Middleware**: Handle cross-cutting concerns like authentication
- **Controllers**: Process HTTP requests and return responses
- **Services**: Implement business logic
- **Repositories**: Handle data access operations
- **Models**: Define data schemas using Mongoose

## Tech Stack

- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: Database (via Mongoose ODM)
- **JWT**: Authentication
- **Yup**: Validation
- **Swagger**: API documentation

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy .env.example to .env and update the environment variables:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
npm run dev
```

### Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development, production, test)
- `API_PREFIX`: API path prefix (default: tse-easiidesk-drivops)
- `FIREBASE_*`: Firebase configuration for notifications

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with hot reloading
- `npm test`: Run tests
- `npm run lint`: Run ESLint for code quality

## Project Structure

```
├── src/
│   ├── config/                  # Configuration files
│   │   ├── database.js          # MongoDB connection config
│   │   ├── app.js               # Express app config
│   │   ├── swagger.js           # Swagger config
│   │   └── env.js               # Environment variables
│   ├── models/                  # Mongoose models
│   ├── common/                  # Common utilities
│   │   ├── middleware/          # Common middlewares
│   │   ├── utils/               # Utility functions
│   │   └── responses/           # Response formatting
│   ├── modules/                 # Application modules
│   │   ├── auth/                # Authentication module
│   │   │   ├── routes.js        # Express routes
│   │   │   ├── controller.js    # Route handlers
│   │   │   ├── validator.js     # Request validators
│   │   │   ├── service.js       # Business logic
│   │   │   └── repository.js    # Data access
│   │   ├── users/               # Users module
│   │   └── [other modules]...
│   └── server.js                # Entry point
├── .env                         # Environment variables
└── package.json                 # Dependencies
```

## Authentication

The API uses JWT tokens for authentication. Include the token in the request header:

```
x-access-token: YOUR_JWT_TOKEN
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400,
  "errors": {
    "field": "Field-specific error"
  }
}
```

## License

ISC 