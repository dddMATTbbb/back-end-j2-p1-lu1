import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../prisma/db.ts";

interface docentBody {
    docentEmail: string;
}

export async function docentRoutes(fastify: FastifyInstance) {
    async function handleStudentAddDocent(request: FastifyRequest<{Body: docentBody}>, reply: FastifyReply) {
        const studentId: string = request.user.id
        const {docentEmail} = request.body || {};

        if (!docentEmail) {
            return reply.status(400).send({message: "Docent email was not found in the query"});
        }

        try{
            const docent = await db.orm.public.Users.where({
                email: docentEmail,
                role: "docent",
            }).first();

            if (!docent) {
                return reply.status(400).send({message: "Docent email was not found in the db"});
            }

            await db.orm.public.StudentenLijstDocent.create({
                studentId: studentId,
                docentId: docent.id
            })

            return reply.status(201).send({ message: "Docent gekoppeld" });
        } catch (error){
            return reply.status(500).send({message: "serverfout"});
        }
    }

    fastify.post<{ Body: docentBody }>('/addDocent',
        {preHandler: [fastify.authenticate]},
        handleStudentAddDocent
    );
}