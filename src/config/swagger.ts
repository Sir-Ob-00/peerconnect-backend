import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "PeerConnect API",
      version: "1.0.0",
      description:
        "REST API for PeerConnect — a campus-based student skill-sharing and collaboration platform. " +
        "This spec currently covers Phase 1 (foundation): health checks and placeholder auth contracts. " +
        "Endpoints will fill in as later phases land.",
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Server is running" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Something went wrong" },
            errors: {
              type: "array",
              items: { type: "string" },
              nullable: true,
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Ama" },
            lastName: { type: "string", example: "Mensah" },
            email: { type: "string", format: "email", example: "ama.mensah@st.university.edu.gh" },
            role: { type: "string", enum: ["STUDENT", "ADMIN"], example: "STUDENT" },
            accountStatus: { type: "string", enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], example: "ACTIVE" },
            profileImage: { type: "string", nullable: true, example: null },
            isEmailVerified: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthTokens: {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        },
        StudentProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            department: { type: "string", nullable: true, example: "Computer Science" },
            level: { type: "string", nullable: true, example: "Level 300" },
            skills: { type: "array", items: { type: "string" }, example: ["React Native", "UI Design"] },
            learningInterests: { type: "array", items: { type: "string" }, example: ["Machine Learning"] },
            bio: { type: "string", nullable: true },
            availability: { type: "string", nullable: true, example: "Weekdays after 5pm" },
            isAvailable: {
              type: "boolean",
              example: true,
              description: "Quick on/off toggle checked before a session request can be accepted (Phase 5). Distinct from `availability`, which is just a free-text description.",
            },
            profilePhoto: { type: "string", nullable: true, format: "uri" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PublicStudentProfile: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Ama" },
            lastName: { type: "string", example: "Mensah" },
            department: { type: "string", nullable: true, example: "Computer Science" },
            level: { type: "string", nullable: true, example: "Level 300" },
            skills: { type: "array", items: { type: "string" } },
            learningInterests: { type: "array", items: { type: "string" } },
            bio: { type: "string", nullable: true },
            availability: { type: "string", nullable: true },
            isAvailable: { type: "boolean", example: true },
            profilePhoto: { type: "string", nullable: true, format: "uri" },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            totalPages: { type: "integer", example: 4 },
            totalItems: { type: "integer", example: 37 },
          },
        },
        RecommendedStudent: {
          allOf: [
            { $ref: "#/components/schemas/PublicStudentProfile" },
            {
              type: "object",
              properties: {
                sharedSkills: { type: "array", items: { type: "string" }, example: ["React"] },
                sharedLearningInterests: { type: "array", items: { type: "string" }, example: ["Machine Learning"] },
                score: { type: "integer", example: 2 },
              },
            },
          ],
        },
        SessionParticipant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Ama" },
            lastName: { type: "string", example: "Mensah" },
            profileImage: { type: "string", nullable: true, format: "uri" },
          },
        },
        Session: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            skill: { type: "string", example: "React Native" },
            message: { type: "string", nullable: true, example: "Could you help me with navigation?" },
            status: {
              type: "string",
              enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED"],
              example: "PENDING",
            },
            scheduledDate: { type: "string", format: "date-time" },
            requester: { $ref: "#/components/schemas/SessionParticipant" },
            receiver: { $ref: "#/components/schemas/SessionParticipant" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ChatParticipant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Ama" },
            lastName: { type: "string", example: "Mensah" },
            profileImage: { type: "string", nullable: true, format: "uri" },
          },
        },
        Message: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            conversationId: { type: "string", format: "uuid" },
            senderId: { type: "string", format: "uuid" },
            content: { type: "string", nullable: true, example: "Hey, are you free to chat about React?" },
            imageUrl: { type: "string", nullable: true, format: "uri" },
            isRead: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ConversationListItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            participant: { $ref: "#/components/schemas/ChatParticipant" },
            lastMessage: {
              allOf: [{ $ref: "#/components/schemas/Message" }],
              nullable: true,
            },
            unreadCount: { type: "integer", example: 2 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ReviewReviewer: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            firstName: { type: "string", example: "Ama" },
            lastName: { type: "string", example: "Mensah" },
            profileImage: { type: "string", nullable: true, format: "uri" },
          },
        },
        Review: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            sessionId: { type: "string", format: "uuid" },
            reviewer: { $ref: "#/components/schemas/ReviewReviewer" },
            rating: { type: "integer", minimum: 1, maximum: 5, example: 5 },
            comment: { type: "string", nullable: true, example: "Really patient and explained things clearly!" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RatingSummary: {
          type: "object",
          properties: {
            averageRating: { type: "number", example: 4.7 },
            totalReviews: { type: "integer", example: 12 },
          },
        },
        Notification: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string", example: "New session request" },
            message: { type: "string", example: "Ama Mensah requested a session with you on React Native." },
            type: { type: "string", enum: ["SESSION_REQUEST", "SESSION_ACCEPTED", "CHAT_MESSAGE"], example: "SESSION_REQUEST" },
            isRead: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts", "./src/routes/**/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
