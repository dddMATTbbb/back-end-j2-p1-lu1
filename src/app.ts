import Fastify, { type FastifyInstance } from 'fastify';
import { postgressDBPlugin } from './plugins/postgressDB.ts';
import { corsPlugin } from './plugins/cors';
import { rootRoutes } from './routes';
import { boekenRoutes } from './routes/boeken';
import { authRoutes } from './routes/auth';
import {leesProfielRoutes} from "./routes/leesProfiel.ts";
import {leesLijstRoutes} from "./routes/leesLijst.ts";
import {docentRoutes} from "./routes/Docent.ts";
import {userRoutes} from "./routes/user.ts";
import {jwtPlugin} from "./plugins/jwt.ts";
import {cookiePlugin} from "./plugins/cookie";
import {mongoDBPlugin} from "./plugins/mongoDB.ts";

export function buildApp() {

    const fastify: FastifyInstance = Fastify({
        logger: {
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                    colorize: true
                }
            }
        }
    })

    // Plugins
    fastify.register(corsPlugin);
    fastify.register(postgressDBPlugin);
    fastify.register(mongoDBPlugin);
    fastify.register(cookiePlugin);
    fastify.register(jwtPlugin);

    // Routes
    fastify.register(rootRoutes);
    fastify.register(boekenRoutes);
    fastify.register(authRoutes);
    fastify.register(leesProfielRoutes);
    fastify.register(leesLijstRoutes);
    fastify.register(docentRoutes);
    fastify.register(userRoutes);

    return fastify;
}