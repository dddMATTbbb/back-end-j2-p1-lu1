import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

const secret = process.env.JWT_SECRET!;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN;
if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
}

async function jwtPluginImpl(fastify: FastifyInstance) {
    fastify.register(jwt, {
        secret,
        sign: {
            expiresIn: jwtExpiresIn,
        }
    });
}

export const jwtPlugin = fp(jwtPluginImpl);