import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../prisma/db.ts";
import type {Varchar} from "@prisma/orm-postgres/target/codec-types";
import type {Student} from "../types/student.ts";

type docentQuery = {
    Querystring: {
        docentMail?: Varchar<255>;
    };
}

export async function docentRoutes(fastify: FastifyInstance) {
    async function handleStudentAddDocent(request: FastifyRequest<docentQuery>, reply: FastifyReply) {
        const studentId: string = request.user.id
        const docentEmail = request.query.docentMail;

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

            const checkIfexists = await db.orm.public.StudentenLijstDocent.where({
                docentId: docent.id,
                studentId: studentId,
            }).first();

            if(checkIfexists) {
                return reply.status(400).send({message: "Koppeling bestaat al"});
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

    async function handleStudentGet(request: FastifyRequest, reply: FastifyReply) {
        const docentId: string = request.user.id
        const students: Student[] = []
        if (!docentId) {
            return reply.status(400).send({message: "Docent id was not found"});
        }

        try{
            const studentRows = await db.orm.public.StudentenLijstDocent.where({docentId: docentId}).all();
            if (!studentRows) {
                return reply.status(400).send({message: "There are no students"});
            }

            //fastify.log.info(students[0]?.studentId);

            const studentIds = studentRows.map(row => row.studentId)

            for (const studentId of studentIds) {
                const studentInfo = await db.orm.public.Users.where({ id: studentId }).first();

            }

        } catch (error){
            return reply.status(500).send({message: "serverfout"});
        }


    }

    fastify.post<docentQuery>('/addDocent',
        {preHandler: [fastify.authenticate]},
        handleStudentAddDocent
    );

    fastify.get('/getStudents',
        {preHandler: [fastify.authenticate]},
        handleStudentGet
    );
}