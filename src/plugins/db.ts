import { type FastifyInstance } from 'fastify';
import pg from '@fastify/postgres';

export async function dbPlugin(fastify: FastifyInstance) {
    fastify.register(pg, {
        connectionString: process.env.DB_CONNECTION_STRING,
    });
}