import { FastifyInstance } from "fastify";
import { Track } from "../models/track";
import { User } from "../models/user";

export async function TrackRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Tracks"],
        summary: "Получение трека по id",
        description: "Получение информации о треке по его идентификатору.",
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Идентификатор трека",
            },
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
          500: {
            description: "Внутренняя ошибка сервера",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
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
        description:
          "Поиск треков, название которых соответствует заданной строке.",
        params: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Название трека для поиска",
            },
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
              },
            },
          },
          500: {
            description: "Внутренняя ошибка сервера",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const tracks = await Track.find({
          name: new RegExp(request.params.name, "i"),
        });
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
        description: "Добавление трека в список избранного пользователя.",
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Идентификатор трека",
            },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Трек добавлен в избранное",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          404: {
            description: "Пользователь не найден",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
          500: {
            description: "Внутренняя ошибка сервера",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
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
        description: "Удаление трека из списка избранного пользователя.",
        params: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Идентификатор трека",
            },
          },
          required: ["id"],
        },
        response: {
          200: {
            description: "Трек удален из избранного",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          404: {
            description: "Пользователь не найден",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
          500: {
            description: "Внутренняя ошибка сервера",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
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
