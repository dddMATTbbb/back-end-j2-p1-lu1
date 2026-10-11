import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import type {LeesProfiel} from "../types/leesprofiel.ts";
import {db} from "../prisma/db.ts"
import {berichtSchema, leesProfielBodySchema, leesProfielRijSchema} from "../schemas/leesProfiel.ts";

export async function leesProfielRoutes(fastify: FastifyInstance) {
    async function handleCreateLeesProfiel(request: FastifyRequest<{ Body: LeesProfiel }>, reply: FastifyReply) {
        const userId:string = request.user.id;
        const { leeftijd, gender, leesniveau, favorieteTypeMatariaal } = request.body;

        try {
            const result = await db.orm.public.LeesProfiel.where({studentId: userId}).first();

            if (result) {
                return reply.status(403).send({ message: "Leesprofiel already exist" });
            }

            await db.orm.public.LeesProfiel.create({
                studentId: userId,
                leeftijd: leeftijd,
                gender: gender,
                leesniveau: leesniveau,
                favorieteTypeMatariaal: favorieteTypeMatariaal
            })
            return reply.status(201).send({ message: "leesprofiel added successfully" });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Server fout' });
        }
    }

    async function handleCheckLeesProfiel(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;

        try{
            const result = await db.orm.public.LeesProfiel.where({studentId: userId}).first();
            if (result) {
                fastify.log.info('there was leesprofiel data');
                return reply.status(200).send({data: result});
            } else{
                return reply.status(200).send({ message: 'Leesprofiel does not exist' });
            }
        }catch(err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Server fout' });
        }
    }

    async function handleUpdateLeesProfiel(request: FastifyRequest<{Body: LeesProfiel}>, reply: FastifyReply) {
        const userId = request.user.id;
        const { leeftijd, gender, leesniveau, favorieteTypeMatariaal } = request.body;

        try{
            const result = await db.orm.public.LeesProfiel.where({studentId: userId}).update({
                leeftijd: leeftijd,
                gender: gender,
                leesniveau: leesniveau,
                favorieteTypeMatariaal: favorieteTypeMatariaal,
            })

            if (!result) {
                return reply.status(404).send({ message: 'Leesprofiel does not exist' });
            }

            return reply.status(200).send({result});
        }catch(err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Server fout' });
        }
    }

    fastify.post<{ Body: LeesProfiel }>(
        '/leesProfiel',
        {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['leesProfiel'],
                summary: 'Maak een leesprofiel aan voor de ingelogde student',
                security: [{ cookieAuth: [] }],
                body: leesProfielBodySchema,
                response: {
                    201: berichtSchema,
                    403: berichtSchema,
                    500: berichtSchema,
                },
            },
        },
        handleCreateLeesProfiel
    );

    fastify.get(
        '/leesProfiel',
        {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['leesProfiel'],
                summary: 'Haal het leesprofiel van de ingelogde student op',
                description: 'Bestaat er nog geen leesprofiel, dan komt er alleen een message terug.',
                security: [{ cookieAuth: [] }],
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            message: { type: 'string' },
                            data: leesProfielRijSchema,
                        },
                    },
                    500: berichtSchema,
                },
            },
        },
        handleCheckLeesProfiel
    );

    fastify.put<{ Body: LeesProfiel }>(
        '/leesProfiel',
        {
            preHandler: [fastify.authenticate],
            schema: {
                tags: ['leesProfiel'],
                summary: 'Werk het leesprofiel van de ingelogde student bij',
                security: [{ cookieAuth: [] }],
                body: leesProfielBodySchema,
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            result: leesProfielRijSchema,
                        },
                    },
                    404: berichtSchema,
                    500: berichtSchema,
                },
            },
        },
        handleUpdateLeesProfiel
    );
}