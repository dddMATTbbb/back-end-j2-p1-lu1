import {type FastifyInstance} from 'fastify';
import fp from 'fastify-plugin';
import mongo from '@fastify/mongodb';

async function mongoDBPluginImpl(fastify: FastifyInstance) {
    fastify.register(mongo, {
        forceClose: true,
        url: process.env.MONGODB_CONNECTION_STRING
    })
}

export const mongoDBPlugin = fp(mongoDBPluginImpl);