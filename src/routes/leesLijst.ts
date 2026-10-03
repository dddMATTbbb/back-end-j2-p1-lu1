import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import {db} from "../prisma/db.ts"

export async function leesLijstRoutes(fastify: FastifyInstance) {
    async function handleGetLeeslijst(request: FastifyRequest, reply: FastifyReply) {
        const userId:string = request.user.id;

        try{
            const results = db.orm.public.LeesLijst.where({studentId:userId});
            if (!results){
                return reply.status(404).send({message: 'Lees not found'});
            }
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
}