import { FastifyInstance } from "fastify";
import { Track } from "../models/track";
import { User } from "../models/user";

export async function TrackRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Tracks"],
        summary: "Получение всех треков",
        description: "Возвращает список всех треков, доступных в базе данных.",
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            description: "Список всех треков",
            type: "array",
            items: {
              type: "object",
              properties: {
                _id: { type: "string" },
                name: { type: "string" },
                author: { type: "string" },
                releaseDate: { type: "string" },
                genre: { type: "string" },
                durationInSeconds: { type: "number" },
                album: { type: "string" },
                previewUrl: { type: "string" },
                trackUrl: { type: "string" },
              },
            },
          },
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const tracks = await Track.find();
        return reply.send(tracks);
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tracks"],
        summary: "Получение трека по ID",
        description: "Получение информации о треке по его идентификатору.",
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Идентификатор трека" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Трек найден",
            type: "object",
            properties: {
              _id: { type: "string" },
              name: { type: "string" },
              author: { type: "string" },
              releaseDate: { type: "string" },
              genre: { type: "string" },
              durationInSeconds: { type: "number" },
              album: { type: "string" },
              previewUrl: { type: "string" },
              trackUrl: { type: "string" },
            },
          },
          404: {
            description: "Трек не найден",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const track = await Track.findById(request.params.id);
        if (!track)
          return reply
            .status(404)
            .send({ code: "TRACK_NOT_FOUND", message: "Track not found" });

        return reply.send(track);
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.get(
    "/search/:name",
    {
      schema: {
        tags: ["Tracks"],
        summary: "Поиск треков по имени",
        description: "Поиск треков, название которых содержит заданную строку.",
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название трека для поиска" },
          },
          required: ["name"],
        },
        response: {
          200: {
            description: "Список найденных треков",
            type: "array",
            items: {
              type: "object",
              properties: {
                _id: { type: "string" },
                name: { type: "string" },
                author: { type: "string" },
                genre: { type: "string" },
                releaseDate: { type: "string" },
              },
            },
          },
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const tracks = await Track.find({
          name: new RegExp(request.params.name, "i"),
        }).select("name author genre releaseDate");
        return reply.send(tracks);
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.post(
    "/favorite/:id",
    {
      schema: {
        tags: ["Tracks"],
        summary: "Добавление трека в избранное",
        security: [{ BearerAuth: [] }],
        description: "Добавление трека в список избранного пользователя.",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Идентификатор трека" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Трек добавлен в избранное",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const user = await User.findById(request.user.id);
        if (!user)
          return reply
            .status(404)
            .send({ code: "USER_NOT_FOUND", message: "User not found" });

        if (!user.favorites.includes(request.params.id)) {
          user.favorites.push(request.params.id);
          await user.save();
        }
        return reply.send({ message: "Track added to favorites" });
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.delete(
    "/favorite/:id",
    {
      schema: {
        tags: ["Tracks"],
        summary: "Удаление трека из избранного",
        security: [{ BearerAuth: [] }],
        description: "Удаление трека из списка избранного пользователя.",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Идентификатор трека" },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Трек удален из избранного",
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const user = await User.findById(request.user.id);
        if (!user)
          return reply
            .status(404)
            .send({ code: "USER_NOT_FOUND", message: "User not found" });

        user.favorites = user.favorites.filter(
          (trackId) => trackId.toString() !== request.params.id
        );
        await user.save();
        return reply.send({ message: "Track removed from favorites" });
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );
}
