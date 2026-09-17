import Fastify, { type FastifyInstance } from 'fastify';
import { dbPlugin } from './plugins/db';
import { corsPlugin } from './plugins/cors';
import { rootRoutes } from './routes';
import { boekenRoutes } from './routes/boeken';
import { authRoutes } from './routes/auth';
import {jwtPlugin} from "./plugins/jwt.ts";
import {cookiePlugin} from "./plugins/cookie";

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
    fastify.register(dbPlugin);
    fastify.register(jwtPlugin);
    fastify.register(cookiePlugin);

    // Routes
    fastify.register(rootRoutes);
    fastify.register(boekenRoutes);
    fastify.register(authRoutes);

    return fastify;
}