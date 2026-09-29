import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import type {LeesProfiel} from "../types/leesprofiel.ts";
import {db} from "../prisma/db.ts"
import type {UUID} from "node:crypto";

export async function leesProfielRoutes(fastify: FastifyInstance) {
    async function handleCreateLeesProfiel(request: FastifyRequest<{ Body: LeesProfiel }>, reply: FastifyReply) {
        const userId:string = request.user.id;
        const { leeftijd, gender, leesniveau, genre } = request.body;

        const result = await db.orm.public.LeesProfiel.where({studentId: userId}).first();

        if (result) {
            return reply.status(403).send({ message: "Leesprofiel already exist" });
        }

        try {
            await db.orm.public.LeesProfiel.create({
                studentId: userId,
                leeftijd: leeftijd,
                gender: gender,
                leesniveau: leesniveau,
                genre: genre,
            })
            return reply.status(201).send({ message: "leesprofiel added successfully" });
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    async function handleCheckLeesProfiel(request: FastifyRequest, reply: FastifyReply) {
        const userId = request.user.id;

        try{
            const result = await db.orm.public.LeesProfiel.where({studentId: userId}).first();
            if (result) {
                return reply.status(200).send({ message: "Leesprofiel already exist", data: result});
            } else{
                return reply.status(200).send({ message: 'Leesprofiel does not exist' });
            }
        }catch(err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Server fout' });
        }
    }

    fastify.post<{ Body: LeesProfiel }>(
        '/leesProfiel',
        { preHandler: [fastify.authenticate] },
        handleCreateLeesProfiel
    );
    fastify.get('/leesProfiel',
        {preHandler: [fastify.authenticate]},
        handleCheckLeesProfiel);
}