import { type FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cookie from '@fastify/cookie'

const secret = process.env.COOKIE_SECRET!;

async function cookiePluginImpl(fastify: FastifyInstance) {
    fastify.register(cookie, {
        secret: secret,
    });
}

export const cookiePlugin = fp(cookiePluginImpl);