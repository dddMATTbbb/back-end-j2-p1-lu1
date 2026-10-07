import type {FastifyInstance, FastifyRequest, FastifyReply} from "fastify";
import {db} from "../prisma/db"

export async function userRoutes(fastify: FastifyInstance) {
    async function checkRole(request: FastifyRequest, reply: FastifyReply) {
        const userId:string = request.user.id

        try{
            const result = await db.orm.public.Users.where({id: userId}).first()
            if (!result) {
                return reply.status(400).send({message: 'User does not exist' })
            }

            if (result.role === 'student'){
                return reply.status(200).send({message: 'student'})
            } else {
                return reply.status(200).send({message: 'docent'})
            }
        } catch (error) {
            fastify.log.error(error)
            return reply.status(500).send({message: 'server fout'})
        }
    }

    fastify.get('/checkRole', {preHandler: [fastify.authenticate]}, checkRole);
}