import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user";

export async function AuthRoutes(fastify: FastifyInstance) {
  const generateTokens = (user: any) => {
    const secret = process.env.JWT_SECRET || "";

    const accessToken = jwt.sign({ id: user._id }, secret, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign({ id: user._id }, secret, {
      expiresIn: "7d",
    });
    return { accessToken, refreshToken };
  };

  fastify.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Регистрация нового пользователя",
        description:
          "Регистрация нового пользователя с указанием email и password.",
        body: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },
        response: {
          201: {
            description: "Пользователь успешно зарегистрирован",
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
          400: {
            description: "Пользователь с таким email уже существует",
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
        const { email, password } = request.body;

        const existingUser = await User.findOne({ email });
        if (existingUser)
          return reply
            .status(400)
            .send({ code: "USER_EXISTS", message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        return reply
          .status(201)
          .send({ done: true, message: "User registered successfully" });
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Авторизация пользователя",
        description:
          "Авторизация пользователя с выдачей access и refresh токенов.",
        body: {
          type: "object",
          properties: {
            email: { type: "string" },
            password: { type: "string" },
          },
          required: ["email", "password"],
        },
        response: {
          200: {
            description:
              "Успешная авторизация. Токены возвращаются в теле ответа и устанавливаются в cookies.",
            type: "object",
            properties: {
              accessToken: {
                type: "string",
              },
              refreshToken: {
                type: "string",
              },
            },
          },
          400: {
            description: "Неверные учётные данные",
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
        const { email, password } = request.body;

        const user = await User.findOne({ email });
        if (!user)
          return reply.status(400).send({
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return reply.status(400).send({
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          });

        const { accessToken, refreshToken } = generateTokens(user);

        reply.setCookie("accessToken", accessToken, {
          path: "/",
          httpOnly: true,
          secure: "auto",
          maxAge: 3600,
        });
        reply.setCookie("refreshToken", refreshToken, {
          path: "/",
          httpOnly: true,
          secure: "auto",
          maxAge: 604800,
        });

        reply.send({ accessToken, refreshToken });
      } catch (error) {
        return reply
          .status(500)
          .send({ code: "INTERNAL_ERROR", message: "Something went wrong" });
      }
    }
  );

  fastify.get("/logout", async (_, reply) => {
    reply
      .setCookie("accessToken", "", {
        path: "/",
        maxAge: -1,
        httpOnly: true,
        secure: "auto",
      })
      .setCookie("refreshToken", "", {
        path: "/",
        maxAge: -1,
        httpOnly: true,
        secure: "auto",
      });

    reply.send();
  });

  fastify.post(
    "/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Обновление токенов",
        description:
          "Обновление access и refresh токенов с использованием refresh токена, передаваемого в cookies.",
        parameters: [
          {
            name: "refreshToken",
            in: "cookie",
            description: "Refresh токен, передаваемый в cookies.",
            required: true,
            schema: { type: "string" },
          },
        ],
        response: {
          200: {
            description: "Токены успешно обновлены",
            type: "object",
            properties: {
              accessToken: {
                type: "string",
              },
              refreshToken: {
                type: "string",
              },
            },
          },
          401: {
            description: "Отсутствует refresh токен",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
          403: {
            description: "Недействительный refresh токен",
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
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
        const { refreshToken } = request.cookies;
        if (!refreshToken) {
          return reply.status(401).send({
            code: "NO_REFRESH_TOKEN",
            message: "Refresh token missing",
          });
        }

        const secret = process.env.JWT_SECRET || "";

        const decoded = await new Promise((resolve, reject) => {
          jwt.verify(refreshToken, secret, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
          });
        });

        const { id } = decoded as jwt.JwtPayload;

        const user = await User.findById(id);
        if (!user) {
          return reply.status(404).send({
            code: "USER_NOT_FOUND",
            message: "User not found",
          });
        }

        const { accessToken, refreshToken: newRefreshToken } =
          generateTokens(user);

        reply.setCookie("accessToken", accessToken, {
          path: "/",
          httpOnly: true,
          secure: "auto",
          maxAge: 3600,
        });
        reply.setCookie("refreshToken", newRefreshToken, {
          path: "/",
          httpOnly: true,
          secure: "auto",
          maxAge: 604800,
        });

        return reply.send({ accessToken, refreshToken: newRefreshToken });
      } catch (error) {
        console.error("Ошибка при обновлении токена:", error);
        return reply.status(403).send({
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid refresh token",
        });
      }
    }
  );
}
