import { type FastifyInstance, type FastifyRequest, type FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

const secret = process.env.JWT_SECRET!;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN!;
if (!secret || !jwtExpiresIn) {
    throw new Error('JWT_SECRET & JWT_EXPIRES_IN environment variable is required');
}

async function jwtPluginImpl(fastify: FastifyInstance) {
    fastify.register(jwt, {
        secret: secret,
        cookie: {
            cookieName: 'token',
            signed: false
        }
    });

    fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch (err) {
            return reply.status(401).send({ message: 'wrong credentials' });
        }
    });
}

export const jwtPlugin = fp(jwtPluginImpl);