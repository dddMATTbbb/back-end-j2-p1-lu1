import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function boekenRoutes(fastify: FastifyInstance) {
    fastify.get('/test', async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { rows } = await fastify.pg.query("SELECT * FROM public.boeken;");
            return reply.status(200).send({ answer: rows });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Database query mislukt' });
        }
    });
}