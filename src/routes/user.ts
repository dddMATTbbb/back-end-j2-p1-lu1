import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import {db} from "../prisma/db"
import type {Varchar} from "@prisma/orm-postgres/target/codec-types";

export async function userRoutes(fastify: FastifyInstance) {
    async function getUserGeneralInfo(request: FastifyRequest, reply: FastifyReply) {
        const userId:string = request.user.id

    }

    fastify.get('/user', {preHandler: [fastify.authenticate]}, getUserGeneralInfo);
}