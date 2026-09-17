import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

async function jwtPluginImpl(fastify: FastifyInstance) {
    fastify.register(jwt, {
        secret: 'supersecret',
    });
}

export const jwtPlugin = fp(jwtPluginImpl);