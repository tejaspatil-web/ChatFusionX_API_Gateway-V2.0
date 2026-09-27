# ChatFusionX API Gateway

A secure and lightweight **TypeScript API Gateway** built with Node.js
and Express for routing, authentication, service-to-service
communication, and WebSocket proxying across ChatFusionX microservices.

The gateway provides a single entry point for frontend clients while
forwarding requests to the appropriate backend services.

------------------------------------------------------------------------

## Features

-   Centralized API Gateway for microservices
-   Dynamic HTTP request proxying
-   WebSocket proxy support
-   JWT Bearer token validation
-   Service-to-service authentication using `X-SERVICE-KEY`
-   CORS configuration
-   Security headers with Helmet
-   Configurable request and proxy timeouts
-   Centralized service registry
-   Health check endpoint
-   Request and proxy logging
-   Environment-based configuration
-   TypeScript
-   ESM support
-   Production build using `tsup`

------------------------------------------------------------------------

## Architecture

``` text
                    Frontend
                       |
                       v
              +----------------+
              |  API Gateway   |
              |   Express.js   |
              +--------+-------+
                       |
          +------------+-------------+
          |            |             |
          v            v             v
     ChatFusionX   PDF-to-PNG   Text Extraction
       Service       Service        Service
          |
          |
          +--------------------+
                               |
                               v
                       WebSocket Service
```

The API Gateway acts as the single public entry point and routes
requests to the appropriate internal service.

------------------------------------------------------------------------

## Request Flow

``` text
Client Request
      |
      v
API Gateway
      |
      +--> CORS
      |
      +--> Helmet
      |
      +--> JWT Validation
      |
      +--> Service Routing
      |
      +--> X-SERVICE-KEY
      |
      v
Target Microservice
      |
      v
Response
```

------------------------------------------------------------------------

## Service Routing

The gateway maintains a centralized service registry.

  Gateway Prefix           Target Service
  ------------------------ -------------------------
  `/api/v1`                ChatFusionX Service
  `/api/pdf-to-png`        PDF-to-PNG Service
  `/api/text-extraction`   Text Extraction Service

The actual service URLs are configured through environment variables.

------------------------------------------------------------------------

## WebSocket Proxy

WebSocket traffic is routed through:

``` text
/gateway
```

The gateway forwards WebSocket connections to the configured WebSocket
service.

``` text
Frontend
   |
   | WebSocket
   v
/gateway
   |
   v
WebSocket Service
```

The gateway also handles the HTTP server `upgrade` event for WebSocket
connections.

------------------------------------------------------------------------

## Authentication

### JWT Authentication

Requests routed to protected services require a JWT Bearer token.

``` http
Authorization: Bearer <JWT_TOKEN>
```

The gateway verifies the token using the configured JWT secret before
forwarding the request.

If the token is missing:

``` http
401 Unauthorized
```

``` json
{
  "error": "Missing token"
}
```

If the token is invalid:

``` http
401 Unauthorized
```

``` json
{
  "error": "Invalid token"
}
```

------------------------------------------------------------------------

## Public / Authorized URLs

Specific authentication-related URLs can bypass gateway JWT validation.

These include configured endpoints for:

-   Server status
-   User validation
-   Google authentication
-   Password reset
-   OTP sending
-   OTP verification

These URLs are configured through environment variables.

------------------------------------------------------------------------

## Service-to-Service Authentication

When forwarding requests to backend services, the gateway adds:

``` http
X-SERVICE-KEY: <SERVICE_KEY>
```

This allows downstream services to verify that requests are coming
through an authorized internal gateway.

The service key is configured using:

``` text
SERVICE_KEY
```

------------------------------------------------------------------------

## Security

The gateway uses:

### Helmet

Security-related HTTP headers are configured using Express Helmet.

### CORS

CORS is configured using the frontend URL and local development origin.

### JWT

Incoming protected requests are validated before being proxied.

### Service Key

The gateway adds an internal service key to proxied requests.

### Disable X-Powered-By

The Express `X-Powered-By` header is disabled.

### Trust Proxy

The application enables Express proxy trust for deployment behind a
reverse proxy or hosting platform.

------------------------------------------------------------------------

## Proxy Configuration

The gateway uses `http-proxy-middleware` for HTTP and WebSocket
proxying.

Proxy features include:

-   Dynamic service targets
-   WebSocket support
-   Original URL preservation
-   Forwarded headers
-   Redirect support
-   Configurable proxy timeout
-   Configurable request timeout
-   Proxy error handling
-   Service logging

Current proxy timeout:

``` text
300 seconds
```

Current request timeout:

``` text
300 seconds
```

------------------------------------------------------------------------

## API Endpoints

### Health Check

``` http
GET /health
```

Response:

``` json
{
  "status": "Server is awake and started."
}
```

This endpoint can be used by deployment platforms or monitoring systems
to verify that the gateway is running.

------------------------------------------------------------------------

### ChatFusionX Service

Requests beginning with:

``` http
/api/v1
```

are forwarded to the ChatFusionX service.

Example:

``` http
GET /api/v1/...
```

------------------------------------------------------------------------

### PDF-to-PNG Service

Requests beginning with:

``` http
/api/pdf-to-png
```

are forwarded to the PDF-to-PNG service.

Example:

``` http
POST /api/pdf-to-png/...
```

------------------------------------------------------------------------

### Text Extraction Service

Requests beginning with:

``` http
/api/text-extraction
```

are forwarded to the Text Extraction service.

Example:

``` http
POST /api/text-extraction/...
```

------------------------------------------------------------------------

### WebSocket

WebSocket connections use:

``` text
/gateway
```

The gateway forwards them to the configured WebSocket service.

------------------------------------------------------------------------

## Environment Variables

Create a `.env` file in the project root.

``` env
# Frontend
FRONTEND_URL=http://localhost:4200

# Gateway
PORT=3000

# Authentication
JWT_SECRET=your-jwt-secret
SERVICE_KEY=your-service-key

# Microservices
CHATFUSIONX_SERVICE=http://localhost:3001
WS_SERVICE=http://localhost:3002
PDF_TO_PNG_SERVICE=http://localhost:3003
TEXT_EXTRACTION_SERVICE=http://localhost:3004

# Authentication-related URLs
SERVER_STATUS_URL=/api/auth/server-status
USER_VALIDATE_URL=/api/auth/validate
GOOGLE_AUTH_URL=/api/auth/google
PASS_RESET_URL=/api/auth/password-reset
OTP_SEND_URL=/api/auth/otp/send
OTP_VERIFY_URL=/api/auth/otp/verify
```

Use the actual service URLs and authentication paths from your
deployment environment.

Do not commit `.env` files or production secrets to source control.

------------------------------------------------------------------------

## Project Structure

``` text
ChatFusionX_API_Gateway/
│
├── src/
│   ├── config/
│   │   ├── env.ts
│   │   └── serviceRegistry.ts
│   │
│   ├── middleware/
│   │   ├── rateLimiter.ts
│   │   └── verifyJWT.ts
│   │
│   ├── routes/
│   │   └── gatewayRouter.ts
│   │
│   ├── services/
│   │   ├── health.ts
│   │   ├── proxyService.ts
│   │   └── wsProxy.ts
│   │
│   ├── utils/
│   │   └── logger.ts
│   │
│   └── server.ts
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsup.config.ts
└── .gitignore
```

------------------------------------------------------------------------

## Tech Stack

-   **Node.js 18+**
-   **TypeScript**
-   **Express 5**
-   **HTTP Proxy Middleware**
-   **JWT**
-   **Helmet**
-   **CORS**
-   **Axios**
-   **Express Rate Limit**
-   **tsup**
-   **tsx**

------------------------------------------------------------------------

## Installation

### Prerequisites

Install:

-   Node.js 18+
-   npm

### Clone

``` bash
git clone https://github.com/tejaspatil-web/ChatFusionX_API_Gateway-V2.0.git
cd ChatFusionX_API_Gateway-V2.0
```

### Install Dependencies

``` bash
npm install
```

------------------------------------------------------------------------

## Development

Start the gateway in development mode:

``` bash
npm run dev
```

The development server uses `tsx` watch mode and automatically reloads
when source files change.

------------------------------------------------------------------------

## Type Checking

Run TypeScript type checking:

``` bash
npm run typecheck
```

------------------------------------------------------------------------

## Production Build

Build the application:

``` bash
npm run build
```

The compiled output is generated in:

``` text
dist/
```

Start the production build:

``` bash
npm start
```

------------------------------------------------------------------------

## Error Handling

If a route does not match any gateway route, the gateway returns:

``` http
404 Not Found
```

``` json
{
  "error": "Route not found"
}
```

If a downstream service is unavailable, the proxy returns:

``` http
503 Service Unavailable
```

with an error response.

Proxy errors are also logged by the gateway.

------------------------------------------------------------------------

## Logging

The gateway provides simple centralized logging for:

-   Service proxy registration
-   Proxy requests
-   Proxy responses
-   Invalid JWT tokens
-   Proxy errors
-   Route-not-found errors
-   Server startup

Example:

``` text
[INFO] Gateway running on port 3000
[INFO] Proxy mounted: /api/v1 -> http://localhost:3001
```

------------------------------------------------------------------------

## Microservice Integration

The gateway is designed to sit between the frontend and backend
microservices.

Example:

``` text
                         +----------------+
                         |    Frontend    |
                         +-------+--------+
                                 |
                                 v
                       +-------------------+
                       |   API Gateway     |
                       |                   |
                       | JWT Validation    |
                       | CORS              |
                       | Security          |
                       | Routing           |
                       | Proxying          |
                       +---------+---------+
                                 |
              +------------------+------------------+
              |                  |                  |
              v                  v                  v
       ChatFusionX API     PDF-to-PNG API    Text Extraction API
              |                  |                  |
              v                  v                  v
          MongoDB            Poppler             Tesseract
```

This architecture keeps service URLs and internal authentication details
behind the gateway.

------------------------------------------------------------------------

## Why Use an API Gateway?

The gateway provides a centralized location for common cross-cutting
concerns:

-   Authentication
-   Service routing
-   CORS
-   Security headers
-   Internal service authentication
-   WebSocket routing
-   Logging
-   Error handling
-   Service abstraction

The frontend does not need to directly communicate with every internal
microservice.

------------------------------------------------------------------------

## Design

The service registry separates routing configuration from the server
implementation:

``` ts
export const services = [
  {
    prefix: "/api/v1",
    target: env.CHATFUSIONX_SERVICE
  },
  {
    prefix: "/api/pdf-to-png",
    target: env.PDF_TO_PNG_SERVICE
  },
  {
    prefix: "/api/text-extraction",
    target: env.TEXT_EXTRACTION_SERVICE
  }
];
```

This makes it easier to add or change backend services without modifying
the core proxy implementation.

------------------------------------------------------------------------

## Use Cases

This gateway can be used for:

-   Microservice architectures
-   Centralized API routing
-   JWT-protected APIs
-   Internal service authentication
-   WebSocket applications
-   AI application backends
-   Document-processing pipelines
-   Multi-service Node.js applications

------------------------------------------------------------------------

## Related Services

The gateway is designed to work with the ChatFusionX ecosystem,
including:

-   ChatFusionX API
-   PDF-to-PNG Service
-   Text Extraction Service
-   WebSocket Service

------------------------------------------------------------------------

## License

ISC
