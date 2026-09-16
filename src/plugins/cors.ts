import { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fp from 'fastify-plugin';

export async function corsPluginImpl(fastify: FastifyInstance) {
    await fastify.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
}

export const corsPlugin = fp(corsPluginImpl);