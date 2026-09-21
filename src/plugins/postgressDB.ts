import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import pg from '@fastify/postgres';

async function postgressDBPluginImpl(fastify: FastifyInstance) {
    fastify.register(pg, {
        connectionString: process.env.POSTDB_CONNECTION_STRING,
    });
}

export const postgressDBPlugin = fp(postgressDBPluginImpl);