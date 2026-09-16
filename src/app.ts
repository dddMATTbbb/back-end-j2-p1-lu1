import Fastify from 'fastify';
import { dbPlugin } from './plugins/db';
import { corsPlugin } from './plugins/cors';
import { rootRoutes } from './routes';
import { boekenRoutes } from './routes/boeken';
import { authRoutes } from './routes/auth';

export function buildApp() {
    const fastify = Fastify({ logger: true });

    // Plugins
    fastify.register(corsPlugin);
    fastify.register(dbPlugin);

    // Routes
    fastify.register(rootRoutes);
    fastify.register(boekenRoutes);
    fastify.register(authRoutes);

    return fastify;
}