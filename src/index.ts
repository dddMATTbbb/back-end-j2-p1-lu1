import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import pg from "@fastify/postgres";
import 'dotenv/config'

const fastify = Fastify({
    logger: true
});

fastify.register(pg, {
    connectionString: process.env.DB_CONNECTION_STRING,
});

fastify.get('/', (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
        message: 'Hello'
    });
});

fastify.get('/test', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { rows } = await fastify.pg.query("SELECT * FROM public.boeken;");

        return reply.status(200).send({
            answer: rows
        });
    } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Database query mislukt' });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start().catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});