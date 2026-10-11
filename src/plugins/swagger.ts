import { type FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fp from 'fastify-plugin';

export async function swaggerPluginImpl(fastify: FastifyInstance) {
    await fastify.register(swagger, {
        openapi: {
            openapi: '3.0.3',
            info: {
                title: 'Leesapp API',
                description: 'API voor boeken, leesprofielen, leeslijsten en docenten',
                version: '1.0.0',
            },
            components: {
                securitySchemes: {
                    cookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
                },
            },
            tags: [
                { name: 'auth' },
                { name: 'boeken' },
                { name: 'leesProfiel' },
                { name: 'leesLijst' },
                { name: 'docent' },
                { name: 'user' },
            ],
        },
    });

    await fastify.register(swaggerUi, {
        routePrefix: '/docs',
    });
}

export const swaggerPlugin = fp(swaggerPluginImpl);