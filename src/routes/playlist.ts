import { FastifyInstance } from "fastify";
import { Playlist } from "../models/playlist";

export async function PlaylistRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Playlists"],
        summary: "Получение всех плейлистов",
        description:
          "Возвращает список всех плейлистов с информацией о треках.",
        security: [{ BearerAuth: [] }],
        response: {
          200: {
            description: "Список плейлистов",
            type: "array",
            items: {
              type: "object",
              properties: {
                _id: { type: "string" },
                name: { type: "string" },
                owner: { type: "string" },
                tracks: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const playlists = await Playlist.find()
          .populate("tracks", "_id")
          .lean();

        const mappedPlaylists = playlists.map((playlist) => ({
          ...playlist,
          tracks: playlist.tracks.map((track) => track._id.toString()),
        }));

        return reply.send(mappedPlaylists);
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
        tags: ["Playlists"],
        summary: "Получение плейлиста по ID",
        description:
          "Возвращает плейлист по указанному идентификатору с информацией о треках.",
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Идентификатор плейлиста" },
          },
          required: ["id"],
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        let playlist = await Playlist.findById(request.params.id)
          .populate("tracks", "_id")
          .lean();

        if (!playlist) {
          return reply.status(404).send({
            code: "PLAYLIST_NOT_FOUND",
            message: "Playlist not found",
          });
        }

        const mappedPlaylist = playlist.tracks.map((track) =>
          track._id.toString()
        );

        return reply.send(mappedPlaylist);
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        tags: ["Playlists"],
        summary: "Создание нового плейлиста",
        description:
          "Создаёт новый плейлист с заданным именем и списком треков.",
        security: [{ BearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название плейлиста" },
            tracks: {
              type: "array",
              description: "Список идентификаторов треков",
              items: { type: "string" },
            },
          },
          required: ["name"],
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const { name, tracks } = request.body;

        const playlist = new Playlist({ name, tracks });
        await playlist.save();

        return reply.status(201).send(playlist);
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.put(
    "/:id/tracks/:trackId",
    {
      schema: {
        tags: ["Playlists"],
        summary: "Добавление трека в плейлист",
        description: "Добавляет трек в плейлист, если его там ещё нет.",
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Идентификатор плейлиста" },
            trackId: { type: "string", description: "Идентификатор трека" },
          },
          required: ["id", "trackId"],
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const playlist = await Playlist.findById(request.params.id);
        if (!playlist) {
          return reply.status(404).send({
            code: "PLAYLIST_NOT_FOUND",
            message: "Playlist not found",
          });
        }

        if (!playlist.tracks.includes(request.params.trackId)) {
          playlist.tracks.push(request.params.trackId);
          await playlist.save();
        }
        return reply.send({ message: "Track added to playlist" });
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.delete(
    "/:id/tracks/:trackId",
    {
      schema: {
        tags: ["Playlists"],
        summary: "Удаление трека из плейлиста",
        description:
          "Удаляет трек из плейлиста по идентификаторам плейлиста и трека.",
        security: [{ BearerAuth: [] }],
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Идентификатор плейлиста" },
            trackId: { type: "string", description: "Идентификатор трека" },
          },
          required: ["id", "trackId"],
        },
      },
      preHandler: [fastify.auth],
    },
    async (request, reply) => {
      try {
        const playlist = await Playlist.findById(request.params.id);
        if (!playlist) {
          return reply.status(404).send({
            code: "PLAYLIST_NOT_FOUND",
            message: "Playlist not found",
          });
        }

        playlist.tracks = playlist.tracks.filter(
          (trackId) => trackId.toString() !== request.params.trackId
        );
        await playlist.save();
        return reply.send({ message: "Track removed from playlist" });
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );
}
