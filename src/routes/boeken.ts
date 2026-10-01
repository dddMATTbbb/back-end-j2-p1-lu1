import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function boekenRoutes(fastify: FastifyInstance) {
    fastify.get('/boeken', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const db = fastify.mongo.client.db('j1-p1-lu1');
            const boekenCollection = db.collection('boeken');
            const boeken = await boekenCollection?.find().toArray();
            fastify.log.info(boeken);
            return reply.status(200).send(boeken);
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Database query mislukt' });
        }
    });
}