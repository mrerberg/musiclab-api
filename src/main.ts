import Fastify from "fastify";
import path from "node:path";
import mongoose from "mongoose";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyCors from "@fastify/cors";

import authJwt from "./plugins/auth-jwt";

import dotenv from "dotenv";

import { AuthRoutes } from "./routes/auth";
import { TrackRoutes } from "./routes/track";
import { UserRoutes } from "./routes/user";
import { PlaylistRoutes } from "./routes/playlist";

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cookie);

fastify.register(fastifyCors, {
  origin: true,
  credentials: true,
});

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const mediaDir = path.join(__dirname, "../media");
fastify.register(fastifyStatic, {
  root: mediaDir,
  prefix: "/media/",
});

fastify.register(authJwt, { secret: process.env.JWT_SECRET || "" });

fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Music Player API",
      description: "REST API for a music player",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

fastify.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    withCredentials: true,
  },
  staticCSP: true,
});

fastify.register(AuthRoutes, {
  prefix: "/api/auth",
});
fastify.register(UserRoutes, {
  prefix: "/api/users",
});
fastify.register(TrackRoutes, {
  prefix: "/api/tracks",
});
fastify.register(PlaylistRoutes, {
  prefix: "/api/playlists",
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    fastify.log.info("Connected to MongoDB");

    await fastify.listen({ port: 3000 });
    fastify.log.info("Server running on http://localhost:3000");
    fastify.log.info("Docs running on http://localhost:3000/docs");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
