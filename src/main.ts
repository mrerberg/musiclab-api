import Fastify from "fastify";
import path from "node:path";
import fs from "node:fs";
import mongoose from "mongoose";
import cookie from "@fastify/cookie";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import dotenv from "dotenv";

import { AuthRoutes } from "./routes/auth";
import { TrackRoutes } from "./routes/track";
import { UserRoutes } from "./routes/user";
import { PlaylistRoutes } from "./routes/playlist";

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cookie);

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const mediaDir = path.join(__dirname, "../media");
fastify.register(fastifyStatic, {
  root: mediaDir,
  prefix: "/media/",
});

fastify.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Music Player API",
      description: "REST API for a music player",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
});

fastify.register(fastifySwaggerUi, {
  routePrefix: "/docs",
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
