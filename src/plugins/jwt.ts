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
        }
    });

    fastify.decorate("authenticate", async function (req:any, res:any) {
        try{
            await req.jwtVerify();
        } catch(err){
            res.status(401).send({ error: 'Niet geautoriseerd' });
        }
    })
}

export const jwtPlugin = fp(jwtPluginImpl);