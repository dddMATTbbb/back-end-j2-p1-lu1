import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

const secret = process.env.JWT_SECRET!;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN!;
if (!secret || !jwtExpiresIn) {
    throw new Error('JWT_SECRET & JWT_EXPIRES_IN environment variable is required');
}

async function jwtPluginImpl(fastify: FastifyInstance) {
    fastify.register(jwt, {
        secret,
        sign: {
            expiresIn: jwtExpiresIn,
        },
        messages:{
            noAuthorizationInCookieMessage: "Geen autorisatie-cookie gevonden",
        },
        cookie: {
            cookieName: 'token',
            signed: false
        }
    });
}

export const jwtPlugin = fp(jwtPluginImpl);