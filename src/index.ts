import Fastify, { type FastifyRequest, type FastifyReply} from "fastify";
import pg from "@fastify/postgres";
import 'dotenv/config'
import cors from '@fastify/cors';

const fastify = Fastify({
    logger: true
});

fastify.register(pg, {
    connectionString: process.env.DB_CONNECTION_STRING,
});

await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});

interface LoginBody {
    email: string;
    password: string;
}

fastify.get('/', (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
        message: 'Hello'
    });
});

fastify.get('/test', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
        const {rows} = await fastify.pg.query("SELECT * FROM public.boeken;");

        return reply.status(200).send({
            answer: rows
        });
    } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({error: 'Database query mislukt'});
    }
});

fastify.post('/Login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
        const { email, password } = request.body;


        fastify.log.info({ body: request.body }, "Ontvangen credentials");

        return reply.status(200).send({
            message: "succes"
        });
    } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({ error: 'Failed to login' });
    }
});

const start = async () => {
    try {
        await fastify.listen({port: 3000});
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start().catch((err) => {
    fastify.log.error(err);
    process.exit(1);
});