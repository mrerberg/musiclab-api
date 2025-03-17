import plugin from "fastify-plugin";

export default plugin(async (server) => {
  server.register(import("@fastify/cors"), {
    origin: true,
    credentials: true,
  });
});
