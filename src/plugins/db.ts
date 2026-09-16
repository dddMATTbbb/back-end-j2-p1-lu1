import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from '@fastify/postgres';

async function dbPluginImpl(fastify: FastifyInstance) {
    fastify.register(pg, {
        connectionString: process.env.DB_CONNECTION_STRING,
    });
}

export const dbPlugin = fp(dbPluginImpl);