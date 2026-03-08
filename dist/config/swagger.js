import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CricHub API',
            version: '1.0.0',
            description: 'A comprehensive cricket scoring and management API',
            contact: {
                name: 'CricHub Team',
                email: 'support@crichub.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token obtained from /auth/login endpoint',
                },
            },
            schemas: {
                // User & Auth Schemas
                UserRole: {
                    type: 'string',
                    enum: ['ADMIN', 'CREATOR', 'SCORER', 'USER', 'PLAYER'],
                    description: 'User role in the system',
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'User ID' },
                        email: { type: 'string', format: 'email', description: 'User email' },
                        role: { $ref: '#/components/schemas/UserRole' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['id', 'email', 'role'],
                },
                SignUpRequest: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email', description: 'User email' },
                        password: { type: 'string', minLength: 6, description: 'User password' },
                        role: { $ref: '#/components/schemas/UserRole' },
                    },
                    required: ['email', 'password'],
                },
                LoginRequest: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email', description: 'User email' },
                        password: { type: 'string', description: 'User password' },
                    },
                    required: ['email', 'password'],
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        token: { type: 'string', description: 'JWT access token' },
                        user: { $ref: '#/components/schemas/User' },
                    },
                    required: ['token'],
                },
                // Player Schemas
                Player: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Player ID' },
                        name: { type: 'string', description: 'Player name' },
                        isBatsman: { type: 'boolean', description: 'Can the player bat' },
                        isBowler: { type: 'boolean', description: 'Can the player bowl' },
                        isWicketKeeper: { type: 'boolean', description: 'Is the player a wicket keeper' },
                        teamId: { type: 'integer', nullable: true, description: 'Current team ID' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['id', 'name'],
                },
                CreatePlayerRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', minLength: 1, description: 'Player name' },
                    },
                    required: ['name'],
                },
                UpdatePlayerRoleRequest: {
                    type: 'object',
                    properties: {
                        isBatsman: { type: 'boolean', description: 'Can the player bat' },
                        isBowler: { type: 'boolean', description: 'Can the player bowl' },
                        isWicketKeeper: { type: 'boolean', description: 'Is the player a wicket keeper' },
                    },
                },
                // Team Schemas
                Team: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Team ID' },
                        name: { type: 'string', description: 'Team name' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        players: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Player' },
                            description: 'Team players (when populated)',
                        },
                    },
                    required: ['id', 'name'],
                },
                CreateTeamRequest: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', minLength: 1, description: 'Team name' },
                    },
                    required: ['name'],
                },
                // Match Schemas
                Match: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', description: 'Match ID' },
                        teamAId: { type: 'integer', description: 'Team A ID' },
                        teamBId: { type: 'integer', description: 'Team B ID' },
                        format: { type: 'string', enum: ['T20', 'ODI', 'Test'], description: 'Match format' },
                        isStarted: { type: 'boolean', description: 'Has the match started' },
                        isCompleted: { type: 'boolean', description: 'Is the match completed' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                    required: ['id', 'teamAId', 'teamBId', 'format'],
                },
                CreateMatchRequest: {
                    type: 'object',
                    properties: {
                        teamAId: { type: 'integer', description: 'Team A ID' },
                        teamBId: { type: 'integer', description: 'Team B ID' },
                        format: { type: 'string', enum: ['T20', 'ODI', 'Test'], description: 'Match format' },
                    },
                    required: ['teamAId', 'teamBId', 'format'],
                },
                PlayingXI: {
                    type: 'object',
                    properties: {
                        teamId: { type: 'integer', description: 'Team ID' },
                        playerIds: {
                            type: 'array',
                            items: { type: 'integer' },
                            minItems: 11,
                            maxItems: 11,
                            description: 'Array of 11 player IDs',
                        },
                    },
                    required: ['teamId', 'playerIds'],
                },
                // Score Schemas
                Score: {
                    type: 'object',
                    properties: {
                        matchId: { type: 'integer', description: 'Match ID' },
                        teamId: { type: 'integer', description: 'Batting team ID' },
                        runs: { type: 'integer', minimum: 0, description: 'Total runs' },
                        wickets: { type: 'integer', minimum: 0, maximum: 10, description: 'Wickets fallen' },
                        overs: { type: 'number', minimum: 0, description: 'Overs completed' },
                        balls: { type: 'integer', minimum: 0, description: 'Total balls faced' },
                        extras: { type: 'integer', minimum: 0, description: 'Extra runs' },
                        currentBall: { type: 'integer', minimum: 0, description: 'Current ball number' },
                    },
                    required: ['matchId', 'teamId', 'runs', 'wickets'],
                },
                // Common Error Schema
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'Error message' },
                        error: { type: 'string', description: 'Error type' },
                        statusCode: { type: 'integer', description: 'HTTP status code' },
                    },
                    required: ['message'],
                },
                // Success Response Schema
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', description: 'Success message' },
                        data: { type: 'object', description: 'Response data' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        './src/modules/**/*.routes.ts', // Path to the API routes files
        './src/docs/**/*.ts', // Path to documentation files
    ],
};
export const swaggerSpec = swaggerJsdoc(options);
export const setupSwagger = (app) => {
    // Swagger UI options
    const swaggerOptions = {
        explorer: true,
        swaggerOptions: {
            persistAuthorization: true, // Persists authorization across browser refreshes
            tryItOutEnabled: true,
            filter: true,
            layout: 'BaseLayout',
            docExpansion: 'none', // Don't expand docs by default
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
        },
        // customCss: `
        //   .swagger-ui .topbar { display: none }
        //   .swagger-ui .info { margin: 20px 0 }
        //   .swagger-ui .scheme-container { margin: 20px 0 }
        // `,
        customCss: `
    /* Remove Swagger top bar */
    .swagger-ui .topbar {
      display: none;
    }

    /* Background */
    body {
      background-color: #ffffff;
      font-family: 'Inter', sans-serif;
    }

    /* Section spacing */
    .swagger-ui .info {
      margin: 40px 0;
    }

    /* Endpoint cards */
    .swagger-ui .opblock {
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 10px rgba(0,0,0,0.04);
    }

    /* GET color */
    .swagger-ui .opblock.opblock-get {
      border-left: 6px solid #137fec;
    }

    /* POST color */
    .swagger-ui .opblock.opblock-post {
      border-left: 6px solid #16a34a;
    }

    /* Execute button */
    .swagger-ui .btn.execute {
      background-color: #137fec;
      border-color: #137fec;
      border-radius: 8px;
      font-weight: 600;
    }

    .swagger-ui .btn.execute:hover {
      background-color: #0f6bd0;
    }

    /* Inputs */
    .swagger-ui input,
    .swagger-ui textarea,
    .swagger-ui select {
      border-radius: 8px !important;
    }

    /* Tag headings */
    .swagger-ui .opblock-tag {
      font-weight: 700;
      font-size: 18px;
      margin-top: 40px;
    }
  `,
        customSiteTitle: 'CricHub API Documentation',
    };
    // Serve swagger documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
    // Swagger JSON endpoint
    app.get('/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    console.log('📚 Swagger UI available at: http://localhost:3000/api-docs');
    console.log('📄 Swagger JSON available at: http://localhost:3000/swagger.json');
};
//# sourceMappingURL=swagger.js.map