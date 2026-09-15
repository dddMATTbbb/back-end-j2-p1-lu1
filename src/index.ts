import 'dotenv/config';
import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import pg from "@fastify/postgres";
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const fastify = Fastify({
    logger: true
});

fastify.register(pg, {
    connectionString: process.env.DB_CONNECTION_STRING,
});

console.log('CHECK PROCESS:', process.env.DB_CONNECTION_STRING);
console.log('CHECK BUN:', typeof Bun !== 'undefined' ? Bun.env.DB_CONNECTION_STRING : 'Geen bun');

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
    if (process.env.DB_CONNECTION_STRING) {
        fastify.log.info(process.env.DB_CONNECTION_STRING);
    } else {
        fastify.log.error("Database string is leeg!");
    }
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

fastify.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    const { email, password } = request.body || {};

    if (!email || !password) {
        return reply.status(400).send({ error: 'Invalid input' });
    }

    try {
        // Tikfout opgelost: geen losse backtick meer voor SELECT
        const query = "SELECT id, email, password_text FROM public.users WHERE LOWER(email) = LOWER($1) LIMIT 1";
        const result = await fastify.pg.query(query, [email]);

        if (result.rowCount === 0) {
            return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
        }

        const user = result.rows[0];

        // Let op: hier vergelijk je later het wachtwoord met bcrypt
        if (user.password_text !== password) {
            return reply.status(401).send({ error: 'Ongeldige email of wachtwoord' });
        }

        return reply.status(200).send({
            message: "Succesvol ingelogd",
            user: { id: user.id, email: user.email }
        });
    } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Server fout' });
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

start();