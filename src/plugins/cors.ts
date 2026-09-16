import { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

export async function corsPlugin(fastify: FastifyInstance) {
    await fastify.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
}