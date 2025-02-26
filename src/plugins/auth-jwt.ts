import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";

export interface AuthenticatedRequest extends FastifyRequest {
  user?: { id: string };
}

interface JwtAuthOptions {
  secret: string;
}

export default fp(async function jwtAuth(
  fastify: FastifyInstance,
  options: JwtAuthOptions
) {
  fastify.decorate(
    "auth",
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const tokenFromCookie = request.cookies.accessToken;
      const tokenFromHeader = getTokenFromHeader(request.headers.authorization);

      const token = tokenFromCookie || tokenFromHeader;

      if (!token) {
        return reply
          .status(401)
          .send({ code: "UNAUTHORIZED", message: "Access token missing" });
      }

      try {
        const decoded = jwt.verify(token, options.secret) as { id: string };
        request.user = { id: decoded.id };
      } catch (error) {
        return reply
          .status(403)
          .send({ code: "INVALID_TOKEN", message: "Invalid token" });
      }
    }
  );
});

function getTokenFromHeader(token?: string) {
  if (!token || !token.startsWith("Bearer ")) {
    return "";
  }
  const tokenValue = token.split(" ")[1];

  return tokenValue;
}
