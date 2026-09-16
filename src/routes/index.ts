import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function rootRoutes(fastify: FastifyInstance) {
    fastify.get('/', (_request: FastifyRequest, reply: FastifyReply) => {
        return reply.status(200).send({ message: 'Hello the server is running!' });
    });
}