import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import {db} from "../prisma/db.ts"
import { ObjectId } from "mongodb";

export async function leesLijstRoutes(fastify: FastifyInstance) {
    const mongoDb = fastify.mongo.client.db('j1-p1-lu1');
    const boekenCollection = mongoDb.collection('boeken');

    async function handleGetLeeslijst(request: FastifyRequest, reply: FastifyReply) {
        const userId:string = request.user.id;

        try{
            const boekIds:string[] = [];
            for await (const row of db.orm.public.LeesLijst.where({ studentId: userId }).all()) {
                boekIds.push(row.boekId);
            }

            if(boekIds.length === 0){
                return reply.status(200).send([])
            }

            const objectIds = boekIds.map(id => new ObjectId(id));
            const boeken = await boekenCollection.find({ _id: { $in: objectIds } }).toArray();

            return reply.status(200).send(boeken);

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