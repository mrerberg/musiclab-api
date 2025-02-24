import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { FastifyInstance } from "fastify";

export async function UserRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    {
      schema: {
        tags: ["Users"],
        summary: "Получение данных текущего пользователя",
        description:
          "Получение данных текущего пользователя на основе access token, передаваемого в cookies.",
        parameters: [
          {
            name: "accessToken",
            in: "cookie",
            required: true,
            description: "JWT access token",
            schema: { type: "string" },
          },
        ],
        response: {
          200: {
            description: "Данные пользователя",
            type: "object",
            properties: {
              _id: { type: "string", example: "60e2b4d1fbd9b50016c3e7f5" },
              email: { type: "string", example: "user@example.com" },
              favorites: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          401: {
            description: "Access token missing",
            type: "object",
            properties: {
              code: { type: "string", example: "UNAUTHORIZED" },
              message: {
                type: "string",
                example: "Access token missing",
              },
            },
          },
          403: {
            description: "Invalid token",
            type: "object",
            properties: {
              code: { type: "string", example: "INVALID_TOKEN" },
              message: { type: "string", example: "Invalid token" },
            },
          },
          404: {
            description: "User not found",
            type: "object",
            properties: {
              code: { type: "string", example: "USER_NOT_FOUND" },
              message: { type: "string", example: "User not found" },
            },
          },
          500: {
            description: "Internal error",
            type: "object",
            properties: {
              code: { type: "string", example: "INTERNAL_ERROR" },
              message: { type: "string", example: "Something went wrong" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const token = request.cookies.accessToken;

        if (!token) {
          return reply.status(401).send({
            code: "UNAUTHORIZED",
            message: "Access token missing",
          });
        }

        const secret = process.env.JWT_SECRET || "";

        jwt.verify(token, secret, async (err, decoded) => {
          if (err) {
            return reply.status(403).send({
              code: "INVALID_TOKEN",
              message: "Invalid token",
            });
          }

          const { id } = decoded as jwt.JwtPayload;

          const user = await User.findById(id).select("-password");
          if (!user) {
            return reply.status(404).send({
              code: "USER_NOT_FOUND",
              message: "User not found",
            });
          }

          return reply.send(user);
        });
      } catch (error) {
        return reply.status(500).send({
          code: "INTERNAL_ERROR",
          message: "Something went wrong",
        });
      }
    }
  );
}
