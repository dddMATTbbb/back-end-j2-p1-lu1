import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import {db} from "../prisma/db.ts"

export async function leesLijstRoutes(fastify: FastifyInstance) {
    async function handleGetLeeslijst(request: FastifyRequest, reply: FastifyReply) {
        const userId:string = request.user.id;

        try{
            const results = await db.orm.public.LeesLijst.where({ studentId: userId }).all().toArray();

            fastify.log.info({results});
            return reply.status(200).send(results);

        } catch (error){
            fastify.log.error(error);
            return reply.status(500).send({message: "server error"});
        }
    }

    fastify.get('/leesLijst',
        {preHandler: [fastify.authenticate]},
        handleGetLeeslijst
    );

    //TODO: functie om boeken in je leestlijst te doen!
}